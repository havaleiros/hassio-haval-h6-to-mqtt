const md5 = require("md5");
const { axios, commands } = require("./axios");
const fs = require("fs");

const storage = require("./storage");
const { sensorTopics, attributeTopics } = require("./map");
const { mqttModule, EntityType, ActionableAndLink } = require('./mqtt');
const { checkConnection, register, sendDeviceTrackerUpdate, sendMessage } = mqttModule;

const validationSchema = require('./schema')
const { isTokenExpired } = require('./utils')

require("dotenv").config();

const { USERNAME, PASSWORD, REFRESH_TIME, DEVICE_TRACKER_ENABLED } = process.env;

function getCurrentDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Mês começa do zero
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

if (REFRESH_TIME < 5) {
  console.error("The param refresh_time cannot be lower than 5.")
  return;
}

const deviceid = storage.getItem("deviceid")
  ? storage.getItem("deviceid")
  : md5(Math.random().toString());

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
    console.error("***Error on authentication: ", e.message);
    process.exit(0);
  }
};

const getCarInfo = async () => {
  try {
    await auth();
    const { data } = await axios.getCarInfo("vehicle/getLastStatus");
    return data.data;
  } catch (e) {
    console.error(`***Error retrieving car info: ${e.message}`);
  }
};

const getCarData = async () => {
  try {
    await auth();
    const { data } = await axios.getCarInfo('vehicle/acquireVehicles');
    return data.data[0];
  } catch(e) {
    console.error(`***Error retrieving car data: ${e.message}`);
  }
}

storage.setItem('Startup', "true");

console.info(getCurrentDateTime() + " - ***STARTUP PROCESS INITIATED***");

console.info("Flight check:");
if (!fs.existsSync("./certs/gwm_general.cer"))
  console.info("¡¡¡GWM general certicate not found!!!");

if (!fs.existsSync("./certs/gwm_general.key"))
  console.info("¡¡¡GWM general certificate key not found!!!");

if (!fs.existsSync("./certs/gwm_root.cer"))
  console.info("¡¡¡GWM root certificate not found!!!");

validationSchema.validate(process.env)
  .then(() => {
    console.info('Check MQTT parameters')
    return checkConnection();
  })
  .then(() => {
    console.info('Retrieving car info')
    return getCarInfo();
  })
  .then((data) => {
    console.info("Registering entities");
    if(data){
      if(data.items){
        data.items.forEach(({ code, value }) => {
          if (sensorTopics.hasOwnProperty(code)) {
            var { description, unit, device_class, entity_type, icon, actionable } = sensorTopics[code];

            register(entityType = EntityType[entity_type.toUpperCase()], code = code, name = description, unit = unit, device_class = device_class, icon = icon, actionable = actionable);
            sendMessage(code, value);
          }
        });

        //Engine status
        const engineStatus = {
          code: "hyEngSts",
          description: "Estado do Motor",
          entity_type: EntityType.SENSOR,
          value: `${data.staticImageUrl}`,
          icon: "mdi:engine",
        };

        register(entityType = EntityType[engineStatus.entity_type.toUpperCase()], code = engineStatus.code, name = engineStatus.description, unit = null, device_class = null, icon = engineStatus.icon, actionable = null);

        if(data.hasOwnProperty(engineStatus.code)){
          sendMessage(engineStatus.code, data.hyEngSts);        
        }

        console.info("Activating actionables and linked entities");
        ActionableAndLink.execute();
      }
    }
    else{
      console.info("¡¡¡No data found. Check your configuration!!!");
    }
  })
  .then(() => {
    console.info("Retrieving car data");
    return getCarData();
  })
  .then((data) => {
    if(data.staticImageUrl){
      console.info("Registering static entities");
      const staticEntities = {
        image: {
          description: "Imagem do veículo",
          entity_type: EntityType.SENSOR,
          value: `${data.staticImageUrl}`,
          icon: "mdi:image",
        },
        model: {
          description: "Modelo do veículo",
          entity_type: EntityType.SENSOR,
          value: `${data.appShowSeriesName} ${data.powerType}`,
          icon: "mdi:car-estate",
        },
        color: {
          description: "Cor do veículo",
          entity_type: EntityType.SENSOR,
          value: `${data.color}`,
          icon: "mdi:palette",
        },
        tankCapacity: {
          description: "Capacidade do tanque",
          entity_type: EntityType.SENSOR,
          value: `${String(data.tankCapacity)}`,
          icon: "mdi:gas-station",
        },
      }

      Object.keys(staticEntities).forEach((code) => {
        var { description, entity_type, value, icon } = staticEntities[code];

        register(entityType = entity_type, code = code, name = description, unit = null, device_class = null, icon = icon, actionable = null);
          
        sendMessage(code, value);
      });

      const isDeviceTrackerEnabled = Boolean(DEVICE_TRACKER_ENABLED === 'true');
      if(isDeviceTrackerEnabled){
        storage.setItem('simIccid', data.simIccid);
        storage.setItem('imsi', data.imsi);

        var desc = `${data.appShowSeriesName} ${data.powerType} - ${data.color}`;
        register(EntityType.DEVICE_TRACKER, code = "DeviceTracker", name = desc);
        console.info('Device tracker registered')
      }
    }
  })
  .then(() => {
    console.info(getCurrentDateTime() + ' - ***STARTUP PROCESS FINISHED***')
    storage.setItem('Startup', "false");
  })
  .catch((e) => {
    console.error(`***Error on startup process: ${e.message}`);
    process.exit(0);
  });

const updateState = () => getCarInfo()
  .then((data) => {
    const attributes = {};
    var slugify = require("slugify");
   
    try{
        if(data){
          if(data.items){
            console.log(getCurrentDateTime() + " - Updating status");
            data.items.forEach(({ code, value }) => {
              var sensorValue = value;
              if (sensorTopics.hasOwnProperty(code)) {
                sendMessage(code, sensorValue);
              }
              
              if (attributeTopics.hasOwnProperty(code)) {
                attributes[slugify(attributeTopics[code].description.toLowerCase(), "_")] = String(value);
              }
            });

            const isDeviceTrackerEnabled = Boolean(DEVICE_TRACKER_ENABLED === 'true');
            if(isDeviceTrackerEnabled){
              attributes['simIccid'] = storage.getItem('simIccid');
              attributes['imsi'] = storage.getItem('imsi');
              attributes['icon'] = "mdi:car-electric-outline";

              sendDeviceTrackerUpdate(String(data.latitude), String(data.longitude), attributes);
            }

            if(data.hasOwnProperty("hyEngSts")){
              sendMessage("hyEngSts", data.hyEngSts);        
            }
          }
        }
        else
          console.log(getCurrentDateTime() + " - Failed to update status");
    } catch (e) {
      console.error(`***Error updating information: ${e.message}`);
      process.exit(0);
    }
  });

setInterval(async () => updateState(), (REFRESH_TIME || 1) * 1000);