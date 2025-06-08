const storage = require("./storage");

const LogType = {
  INFO: "info",
  ERROR: "error",
  WARNING: "warning",
  DEBUG: "debug",
  CRITICAL: "critical",
  FATAL: "fatal",
};

function getCurrentDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

function isTokenExpired(token) {
  const [, payloadBase64] = token.split('.');
  const decodedJson = Buffer.from(payloadBase64, 'base64').toString();
  const decoded = JSON.parse(decodedJson)
  const { exp } = decoded;
  const expired = (Date.now() >= exp * 1000)
  return expired
};

function printLog(logType, message){

  if (logType && logType === LogType.ERROR) {
    let errorControl = parseInt(storage.getItem("errorControl") || "0", 10);
    let lastError1 = storage.getItem("lastError1") || "";
    let lastError2 = storage.getItem("lastError2") || "";
    let lastError3 = storage.getItem("lastError3") || "";

    if ([lastError1, lastError2, lastError3].includes(message)) {
      errorControl++;
      storage.setItem("errorControl", errorControl);
      if (errorControl > 3) {
        
        let errorSequence = parseInt(storage.getItem("ErrorSequence") || "0", 10);
        if (errorSequence === 0) {
          storage.setItem("ErrorSequence", "1");
            console.error(getCurrentDateTime() + " | !!! Sequential errors. Holding back messages. Please review the messages and restart the integration if required !!!");
        }
        else {
          errorSequence++;
          storage.setItem("ErrorSequence", errorSequence);
        }

        return;
      }
    } else {      
      errorControl = 1;
      storage.setItem("errorControl", errorControl);
      if (lastError2 === "" && lastError1 !== "") {
        storage.setItem("lastError2", message);
      }
      else if (lastError3 === "" && lastError1 !== "") {
        storage.setItem("lastError3", message);
      }
      else {
        storage.setItem("lastError1", message);
        storage.removeItem("lastError2");
        storage.removeItem("lastError3");
      }
    }
  }
  else {
    storage.removeItem("errorControl");
    storage.removeItem("ErrorSequence");
    storage.removeItem("lastError1");
    storage.removeItem("lastError2");
    storage.removeItem("lastError3");
  }

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
};

module.exports = {isTokenExpired, getCurrentDateTime, LogType, printLog };