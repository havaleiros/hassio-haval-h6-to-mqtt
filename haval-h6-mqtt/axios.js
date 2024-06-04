const axios = require("axios");
const https = require("https");
const fs = require("fs");
const storage = require("./storage");

require("dotenv").config();

const { VIN } = process.env;

const certData = fs.readFileSync("./certs/gwm_general.cer", {
  encoding: "utf8",
});
const certKey = fs.readFileSync("./certs/gwm_general.key", {
  encoding: "utf8",
});
const ca = fs.readFileSync("./certs/gwm_root.cer", { encoding: "utf8" });

const httpsAgent = new https.Agent({
  cert: certData,
  ca: ca,
  key: certKey,
  rejectUnauthorized: false,
  ciphers: "DEFAULT:@SECLEVEL=0",
});

axios.defaults.httpsAgent = httpsAgent;

const apiVehicleEndpoint =
  "https://br-app-gateway.gwmcloud.com/app-api/api/v1.0";

axios.sendCmd = async (
  instructions,
  remoteType,
  securityPassword,
  seqNo,
  type
) => {
  var res;
  try {
    let options = {
      headers,
    };
    const res = await axios.post(
      `${apiVehicleEndpoint}/vehicle/T5/sendCmd`,
      {
        instructions,
        remoteType,
        securityPassword,
        seqNo,
        type,
        vin: VIN,
      },
      options
    );

    return res.data;
  } catch (err) {
    console.log("Error send cmd vehicles:", err, res);
    return false;
  }
};

axios.getCarInfo = (path) => {
  const headers = {
    rs: "2",
    terminal: "GW_APP_GWM",
    brand: "6",
    language: "pt_BR",
    systemtype: "2",
    regioncode: "BR",
    country: "BR",
    accessToken: storage.getItem("accessToken"),
    refreshToken: storage.getItem("refreshToken"),
  };

  return axios.get(`${apiVehicleEndpoint}/${path}`, {
    headers,
  });
};

module.exports = axios;
