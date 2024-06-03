const md5 = require("md5");
const axios = require("./axios");
const fs = require("fs");

const storage = require("./storage");
const { configTopics } = require("./map");
const { register, sendMessage, checkConnection } = require("./mqtt");

require("dotenv").config();

const { USERNAME, PASSWORD, TIME_REFRESH } = process.env;

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

  if (storage.getItem("accessToken")) {
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
    console.error("Auth error", err);
    return err;
  }
};

const getCarInfo = async () => {
  await auth();

  try {
    const { data } = await axios.getCarInfo("vehicle/getLastStatus");
    return data.data.items;
  } catch (e) {
    console.error(e);
  }
};

console.info("Flight check:");
if (fs.existsSync("./certs/gwm_general.cer")) {
  console.info("gwm general cert exists!");
}

if (fs.existsSync("./certs/gwm_general.key")) {
  console.info("gwm general key exists!");
}

if (fs.existsSync("./certs/gwm_root.cer!")) {
  console.info("gwm root exists");
}
auth()
  .then(() => {
    console.info("login works!");
    return getCarInfo();
  })
  .then(() => {
    console.info("car connected!");
    return checkConnection();
  })
  .then(() => {
    console.info("mqtt connected!");
  })
  .catch((e) => {
    console.error(e);
    process.exit(0);
  });

console.info("Registering entities");
Object.keys(configTopics).forEach((code) => {
  const { description, unit, device_class } = configTopics[code];
  register(code, description, unit, device_class);
});

setInterval(async () => {
  auth()
    .then(() => getCarInfo())
    .then((data) => {
      console.info("Update entities state!");
      data.forEach(({ code, value }) => {
        sendMessage(code, value);
      });
    });
}, (TIME_REFRESH || 1) * 60000);
