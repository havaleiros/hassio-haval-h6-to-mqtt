const axios = require("axios");
const https = require("https");
const fs = require("fs");
const storage = require("./storage");
const md5 = require("md5");
const chrgFn = require('./axios_add.js');

require("dotenv").config();

const certData = fs.readFileSync("./certs/gwm_general.cer", { encoding: "utf8" });
const certKey = fs.readFileSync("./certs/gwm_general.key", { encoding: "utf8" });
const ca = fs.readFileSync("./certs/gwm_root.cer", { encoding: "utf8" });

const httpsAgent = new https.Agent({
  cert: certData,
  ca: ca,
  key: certKey,
  rejectUnauthorized: false,
  ciphers: "DEFAULT:@SECLEVEL=0",
});

axios.defaults.httpsAgent = httpsAgent;

const apiVehicleEndpoint = "https://br-app-gateway.gwmcloud.com/app-api/api/v1.0";

const headers = {
  rs: "2",
  terminal: "GW_APP_GWM",
  brand: "6",
  language: "pt_BR",
  systemtype: "2",
  regioncode: "BR",
  country: "BR",
  get accessToken(){return storage.getItem("accessToken");},
  get refreshToken(){return storage.getItem("refreshToken");}
};

axios.sendCmd = async (instructions, remoteType, securityPassword, seqNo, type, vin) => {
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
        vin
      },
      options
    );

    return res.data;
  } catch (e) {
    console.log("Error send vehicles command: ", e.message);
    return false;
  }
};

axios.getCarInfo = (path, vin) => {
  const vinQuery = vin ? `?vin=${String(vin).toUpperCase()}&flag=true` : '';  
  return axios.get(`${apiVehicleEndpoint}/${path}${vinQuery}`, {
    headers,
  });
};

const commands = {
  async airConditioner(PIN, VIN, ON) {
    let seqNo = require('crypto').randomUUID().replaceAll('-', '') + '1234';
    
    try {
      return await axios.sendCmd({
                            "0x04": {
                              "airConditioner": {
                                "operationTime": "15",
                                "switchOrder": ON ? "1" : "2",
                                "temperature": "18"
                              }
                            }
                          },
                          0,
                          md5(PIN),
                          seqNo,
                          2,
                          VIN.toUpperCase()
                        );
      
      } catch(e){
        console.error(`***Error executing action airConditioner***`);
        console.error(e.message);
      }
  },
  chrgFn
}

module.exports = { axios, commands };