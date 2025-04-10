const md5 = require("md5");
const { axios } = require("./axios");
const fs = require("fs");

const storage = require("./storage");
const { sensorTopics, attributeTopics } = require("./map");
const { mqttModule, EntityType, ActionableAndLink } = require('./mqtt');
const { checkConnection, register, remove, sendDeviceTrackerUpdate, sendMessage, sendMqtt } = mqttModule;

const validationSchema = require('./schema')
const { isTokenExpired } = require('./utils');

require("dotenv").config();
const { USERNAME, PASSWORD, REFRESH_TIME, DEVICE_TRACKER_ENABLED, VIN } = process.env;

function getCurrentDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

const LogType = { INFO: "info", ERROR: "error", WARNING: "warning", DEBUG: "debug", CRITICAL: "critical", FATAL: "fatal", };

function printLog(logType, message){
  var _message = " | " + message;
  switch(logType){
    case "info":
      console.info(getCurrentDateTime() + _message);
      break;
    case "error":
      console.error(getCurrentDateTime() + _message);
      break;
    case "warning":
      console.warn(getCurrentDateTime() + _message);
      break;
    case "debug":
      console.debug(getCurrentDateTime() + _message);
      break;
    case "critical":
      console.critical(getCurrentDateTime() + _message);
      break;
    case "fatal":
      console.fatal(getCurrentDateTime() + _message);
      break;
    }
}

if (REFRESH_TIME < 5) {
  printLog(LogType.ERROR, "The param `refresh_time` cannot be lower than 5.");
  return;
}

const deviceid = storage.getItem("deviceid") ? storage.getItem("deviceid") : md5(Math.random().toString());

storage.setItem("deviceid", deviceid);

const userHeaders = {
  appid: "6",
  brand: "6",
  brandid: "CCZ001",
  country: "BR",
  devicetype: "0",
  enterpriseid: "CC01",
  gwid: "",
  language: "pt_BR",
  rs: "5",
  terminal: "GW_PC_GWM",
};

const auth = async () => {
  const params = {
    deviceid,
    password: md5(PASSWORD),
    account: USERNAME,
  };

  const accessToken = storage.getItem("accessToken")

  if (accessToken && !isTokenExpired(accessToken)) {
    return;
  }

  try {
    const { data } = await axios.post(
      "https://br-front-service.gwmcloud.com/br-official-commerce/br-official-gateway/pc-api/api/v1.0/userAuth/loginAccount",
      params,
      {
        headers: userHeaders,
      }
    );

    if (data.description === "SUCCESS") {
      Object.keys(data.data).forEach((key) => {
        storage.setItem(key, data.data[key]);
      });

      return data;
    }

    throw data;
  } catch (e) {
    printLog(LogType.ERROR, "Error on authentication: " + e.message);
    process.exit(0);
  }
};

const getCarList = async () => {
  try {
    await auth();
    const { data } = await axios.getCarInfo('globalapp/vehicle/acquireVehicles');
    var carList;
    if(data.data){
      //carData = data.data.find(car => car.vin === vin);
      carList = data.data;
      const vinArray = data.data.map(car => car.vin);
      storage.setItem('carList', vinArray);

      if (data.data.length > 0) {        
        const _code = "gwmbrasil_veiculos_registrados";
        const _name = "Veículos registrados no My GWM";
        const topic = `homeassistant/select/${_code.toLowerCase()}/state`;
        register(entityType = EntityType.SELECT, 
                 vin = VIN,
                 code = _code, 
                 entity_name = _name, 
                 unit = null, 
                 device_class = null, 
                 icon = "mdi:car-2-plus", 
                 actionable = null,
                 initial_value = vinArray,
                 state_class = null);

        sendMqtt(topic, String(VIN).toUpperCase(), { retain: true }); //Set the default VIN
      }
    }
    return carList;
  } catch(e) {
    printLog(LogType.ERROR, "***Error retrieving car data: " + e.message);
  }
}

const GetCarLastStatus = async (vin) => {
  try {
    await auth();
    const { data } = await axios.getCarInfo("vehicle/getLastStatus", vin.toUpperCase());
    return data.data;
  } catch (e) {
    printLog(LogType.ERROR, "Error retrieving car info: " + e.message);
  }
};

storage.setItem('Startup', "true");

printLog(LogType.INFO, "***STARTUP PROCESS INITIATED***");

printLog(LogType.INFO, "Flight check:");

if (!fs.existsSync("./certs/gwm_general.cer")) printLog(LogType.ERROR, "¡¡¡GWM general certicate not found!!!");
if (!fs.existsSync("./certs/gwm_general.key")) printLog(LogType.ERROR, "¡¡¡GWM general certificate key not found!!!");
if (!fs.existsSync("./certs/gwm_root.cer"))    printLog(LogType.ERROR, "¡¡¡GWM root certificate not found!!!");

validationSchema.validate(process.env)
  .then(() => {
    printLog(LogType.INFO, "  MQTT parameters validated");
    return checkConnection();
  })
  .then(() => {
    printLog(LogType.INFO, "  Retrieving car list");
    return getCarList();
  })
  .then(async (data)=> {
    var carList = data;
    if(carList.length > 0){
      printLog(LogType.INFO, "  Retrieving car data");
      for (const key of Object.keys(carList)) {
        printLog(LogType.INFO, `  Registering car: ${carList[key].vin}`);      

        var _vin = carList[key].vin;

        printLog(LogType.INFO, "    Removing deprecated entities");
        Object.keys(sensorTopics).forEach((code) => {
          var { entity_type, actionable } = sensorTopics[code];

          remove(entity_type, "haval", _vin, code);
          remove(entity_type, "haval", _vin, null);
          remove(entity_type, "haval", _vin, "None");
          remove(EntityType.DEVICE_TRACKER, "haval", _vin, null);
          remove(EntityType.SENSOR, "haval", _vin, "hyEngSts");
          if(actionable && actionable.action){
            remove(actionable.entity_type, "haval", _vin, `${code}_${actionable.action}`);
            remove(actionable.entity_type, "haval", _vin, `${code.toLowerCase()}_${actionable.action.toLowerCase()}`);
          }
        });

        const staticEntities = {
          image: { entity_type: EntityType.SENSOR, },
          model: { entity_type: EntityType.SENSOR, },
          color: { entity_type: EntityType.SENSOR, },
          tankCapacity: { entity_type: EntityType.SENSOR, },
        }
        Object.keys(staticEntities).forEach((code) => {
          var { entity_type } = staticEntities[code];

          remove(entity_type, "haval", _vin, code);
        });

        if(carList[key].staticImageUrl){
          printLog(LogType.INFO, "    Registering static entities");
          const staticEntities = {
            image: {
              description: "Imagem do veículo",
              entity_type: EntityType.SENSOR,
              value: `${carList[key].staticImageUrl}`,
              icon: "mdi:image",
            },
            model: {
              description: "Modelo do veículo",
              entity_type: EntityType.SENSOR,
              value: `${carList[key].appShowSeriesName} ${carList[key].powerType}`,
              icon: "mdi:car-estate",
            },
            color: {
              description: "Cor do veículo",
              entity_type: EntityType.SENSOR,
              value: `${carList[key].color}`,
              icon: "mdi:palette",
            },
            tankCapacity: {
              description: "Capacidade do tanque",
              entity_type: EntityType.SENSOR,
              value: `${String(carList[key].tankCapacity)}`,
              icon: "mdi:gas-station",
            },
          }

          Object.keys(staticEntities).forEach((code) => {
            var { description, entity_type, value, icon } = staticEntities[code];

            register(entityType = entity_type, 
                     vin = _vin, 
                     code = code, 
                     entity_name = description, 
                     unit = null, 
                     device_class = null, 
                     icon = icon, 
                     actionable = null, 
                     initial_value = null, 
                     state_class = null);
              
            sendMessage(_vin, code, value);
          });

          const isDeviceTrackerEnabled = Boolean(DEVICE_TRACKER_ENABLED === 'true');
          if(isDeviceTrackerEnabled){
            storage.setItem('simIccid-'+_vin, carList[key].simIccid);
            storage.setItem('imsi-'+_vin, carList[key].imsi);

            var desc = `${carList[key].appShowSeriesName} ${carList[key].powerType} - ${carList[key].color}`;
            register(EntityType.DEVICE_TRACKER,
                     vin = _vin, 
                     code = "DeviceTracker", 
                     entity_name = desc);
            printLog(LogType.INFO, "    Device tracker registered");
          }
          else{
            remove(EntityType.DEVICE_TRACKER, "gwmbrasil", _vin, "DeviceTracker");
          }
        }
        
        printLog(LogType.INFO, "    Retrieving car status");
        const data = await GetCarLastStatus(_vin);
            
        if(data && data.items){
          printLog(LogType.INFO, "    Registering entities");

          Object.keys(sensorTopics).forEach((code) => {
            var { description, unit, device_class, entity_type, icon, actionable, state_class } = sensorTopics[code];
  
            register(entityType = EntityType[entity_type.toUpperCase()],
                    vin = _vin,
                    code = code, 
                    entity_name = description, 
                    unit = unit, 
                    device_class = device_class, 
                    icon = icon, 
                    actionable = actionable, 
                    initial_value = null, 
                    state_class = state_class);
          });

          data.items.forEach(({ code, value }) => {
            if (sensorTopics.hasOwnProperty(code)) {
              var entity_value = value;
              if(sensorTopics[code].formula) entity_value = eval(sensorTopics[code].formula.replace("value", value));
              sendMessage(_vin, code, entity_value);
            }
          });
          
          const engineStatus = {
            code: "hyEngSts",
            description: "Estado do Motor",
            entity_type: EntityType.SENSOR,
            value: `${data.hyEngSts ? data.hyEngSts : '0'}`,
            icon: "mdi:engine",
          };
          
          register(entityType = EntityType[engineStatus.entity_type.toUpperCase()], 
                   vin = _vin, 
                   code = engineStatus.code, 
                   entity_name = engineStatus.description, 
                   unit = null, 
                   device_class = null, 
                   icon = engineStatus.icon, 
                   actionable = null, 
                   initial_value = null, 
                   state_class = null);
  
          if(data.hasOwnProperty(engineStatus.code)){
            sendMessage(_vin, engineStatus.code, engineStatus.value);
          }
  
          printLog(LogType.INFO, "    Activating actionables and linked entities");
          ActionableAndLink.execute();
        }
        else{
          printLog(LogType.ERROR, "   ¡¡¡No data found. Check your configuration!!!");
        }
        //
      }
    }
  })
  .then(() => {
    printLog(LogType.INFO, "***STARTUP PROCESS FINISHED***");
    storage.setItem('Startup', "false");
  })
  .catch((e) => {
    printLog(LogType.ERROR, `***Error on startup process: ${e.message}`);
    process.exit(0);
  });

  const updateState = async () => {
    const carList = storage.getItem('carList') ? storage.getItem('carList').split(',') : [];
  
    for (const vin of carList) {
      const data = await GetCarLastStatus(vin);

    const attributes = {};
    var slugify = require("slugify");
   
    try{
        if(data && data.items){
          printLog(LogType.INFO, "Updating status");
          data.items.forEach(({ code, value }) => {
            var entity_value = value;
            if (sensorTopics.hasOwnProperty(code)) {
              if(sensorTopics[code].formula) entity_value = eval(sensorTopics[code].formula.replace("value", value));
              
              sendMessage(vin, code, entity_value);
            }
            
            if (attributeTopics.hasOwnProperty(code)) {
              attributes[slugify(attributeTopics[code].description.toLowerCase(), "_")] = String(value);
            }
          });

          const isDeviceTrackerEnabled = Boolean(DEVICE_TRACKER_ENABLED === 'true');
          if(isDeviceTrackerEnabled){
            attributes['simIccid'] = storage.getItem('simIccid-'+vin);
            attributes['imsi'] = storage.getItem('imsi-'+vin);
            attributes['icon'] = "mdi:car-electric-outline";

            sendDeviceTrackerUpdate(vin, String(data.latitude), String(data.longitude), attributes);
          }

          if(data.hasOwnProperty("hyEngSts")){
            sendMessage(vin, "hyEngSts", data.hyEngSts);
          }
        }
        else
          printLog(LogType.ERROR, "***Failed to update status");
    } catch (e) {
      printLog(LogType.ERROR, `***Error updating information: ${e.message}`);
      process.exit(0);
    }
  }
};

setInterval(async () => updateState(), (REFRESH_TIME || 1) * 1000); 