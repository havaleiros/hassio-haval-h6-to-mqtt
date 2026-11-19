const fs = require("fs");
const path = require("path");
const { LocalStorage } = require("node-localstorage");

function resolveStorageDir() {
  if (process.env.STORAGE_PATH) {
    return process.env.STORAGE_PATH;
  }
  const haConfigDir = "/config";
  if (fs.existsSync(haConfigDir)) {
    try {
      fs.accessSync(haConfigDir, fs.constants.W_OK);
      const persistentDir = path.join(haConfigDir, "haval_h6_mqtt_storage");
      fs.mkdirSync(persistentDir, { recursive: true });
      return persistentDir;
    } catch (_) {
      // Fallback to container-local storage if /config is not writable
    }
  }
  return "./storage";
}

module.exports = new LocalStorage(resolveStorageDir());
