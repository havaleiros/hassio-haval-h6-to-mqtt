const md5 = require("md5");
const axios = require("./axios");
const fs = require("fs");

const storage = require("./storage");
const { sensorTopics, attributeTopics } = require("./map");
const { register, sendMessage, checkConnection, registerDeviceTracker, sendDeviceTrackerUpdate } = require("./mqtt");
const validationSchema = require('./schema')
const { isTokenExpired } = require('./utils')

require("dotenv").config();

const { USERNAME, PASSWORD, PRESSURE_UNIT, TIME_REFRESH } = process.env;

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
    var { description, unit, device_class } = sensorTopics[code];
    if (device_class === "pressure" && PRESSURE_UNIT === "psi") {
      unit = "psi";
    }
    register(code, description, unit, device_class);
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
    console.info('Check MQTT Parameters')
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
    
    storage.setItem('image', data.staticImageUrl);
    storage.setItem('model', `${data.appShowSeriesName} ${data.powerType}`);
    storage.setItem('color', data.color);
    storage.setItem('simIccid', data.simIccid);
    storage.setItem('imsi', data.imsi);    

    registerDeviceTracker();
    console.info('Device tracker registered')
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
            attributes[slugify(attributeTopics[code].description.toLowerCase(), "_")] = value;
          }
        });    
        attributes['image'] = storage.getItem('image');
        attributes['model'] = storage.getItem('model');
        attributes['color'] = storage.getItem('color');
        attributes['simIccid'] = storage.getItem('simIccid');
        attributes['imsi'] = storage.getItem('imsi');
        attributes['icon'] = "mdi:car-electric-outline";

        sendDeviceTrackerUpdate(String(data.latitude), String(data.longitude), attributes);
        console.info('Update device tracker')
    } catch (e) {
      console.error(e);
      process.exit(0);
    }
  });

setInterval(async () => updateState(), (TIME_REFRESH || 1) * 60000);
