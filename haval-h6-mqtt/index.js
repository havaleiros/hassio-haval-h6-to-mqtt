const md5 = require("md5");
const axios = require("./axios");
const fs = require("fs");

const storage = require("./storage");
const { sensorTopics, attributeTopics } = require("./map");
const { mqttModule, EntityType } = require('./mqttModule');
const { checkConnection, register, sendDeviceTrackerUpdate, sendMessage } = mqttModule;

const validationSchema = require('./schema')
const { isTokenExpired } = require('./utils')

require("dotenv").config();

const { USERNAME, PASSWORD, PRESSURE_UNIT, TIME_REFRESH, DEVICE_TRACKER_ENABLED } = process.env;

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
  } catch (err) {
    console.error("Authentication error", err);
    process.exit(0);
  }
};

const getCarInfo = async () => {
  try {
    await auth();
    const { data } = await axios.getCarInfo("vehicle/getLastStatus");
    return data.data;
  } catch (e) {
    console.error(e);
  }
};

const getCarData = async () => {
  try {
    await auth();
    const { data } = await axios.getCarInfo('vehicle/acquireVehicles');
    return data.data[0];
  } catch(e) {
    console.error(e);
  }
}

const registerEntities = async () => {
  console.info("Registering entities");
  Object.keys(sensorTopics).forEach((code) => {
    var { description, unit, device_class, entity_type } = sensorTopics[code];
    if (device_class === "pressure" && PRESSURE_UNIT === "psi") {
      unit = "psi";
    }
    register(EntityType[entity_type.toUpperCase()], code, description, unit, device_class);
  });
}

console.info("Flight check:");
if (fs.existsSync("./certs/gwm_general.cer")) {
  console.info("GWM general cert exists!");
}

if (fs.existsSync("./certs/gwm_general.key")) {
  console.info("GWM general key exists!");
}

if (fs.existsSync("./certs/gwm_root.cer!")) {
  console.info("GWM root exists");
}

validationSchema.validate(process.env)
  .then(() => {
    console.info('Check MQTT parameters')
    return checkConnection();
  })
  .then(() => {
    registerEntities();
    console.info('Register MQTT entities')
  })
  .then(() => {
    console.info("Retrieving car data");
    return getCarData();
  })
  .then((data) => {
    console.info('Car connected')
    
    console.info("Registering static entities");
    const staticEntities = {
      image: {
        description: "Imagem do veículo",
        entity_type: EntityType.IMAGE,
        value: `${data.staticImageUrl}`,
      },
      model: {
        description: "Model do veículo",
        entity_type: EntityType.SENSOR,
        value: `${data.appShowSeriesName} ${data.powerType}`,
      },
      color: {
        description: "Cor do veículo",
        entity_type: EntityType.SENSOR,
        value: `${data.color}`,
      },
      tankCapacity: {
        description: "Capacidade do tanque",
        entity_type: EntityType.SENSOR,
        value: `${String(data.tankCapacity)}`,
      },
    }

    Object.keys(staticEntities).forEach((code) => {
      var { description, entity_type, value } = staticEntities[code];
      register(entityType = entity_type, code = code, description = description, unit = null, device_class = "None");
      sendMessage(code, value);
    });


    const isDeviceTrackerEnabled = Boolean(DEVICE_TRACKER_ENABLED === 'true');
    if(isDeviceTrackerEnabled){
      storage.setItem('simIccid', data.simIccid);
      storage.setItem('imsi', data.imsi);

      registerDeviceTracker();
      console.info('Device tracker registered')
    }
  })
  .then(() => {
    console.info('***STARTUP PROCESS FINISHED***')
    console.info('Waiting for the first state update cycle...')

  })
  .catch((e) => {
    console.error(e);
    process.exit(0);
  });

const updateState = () => getCarInfo()
  .then((data) => {
    const attributes = {};
    var slugify = require("slugify");

    console.info("Update entities state and attributes");
    try{
        data.items.forEach(({ code, value }) => {      
          if (sensorTopics.hasOwnProperty(code)) {
            if (sensorTopics[code].device_class === "pressure" && PRESSURE_UNIT === "psi") {
              value = Math.round(value * 0.1450377);
            }
            sendMessage(code, value);
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
          console.info('Update device tracker')
        }
    } catch (e) {
      console.error(e);
      process.exit(0);
    }
  });

setInterval(async () => updateState(), (TIME_REFRESH || 1) * 60000);
