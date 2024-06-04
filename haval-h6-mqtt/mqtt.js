const mqtt = require("mqtt");
var slugify = require("slugify");

require("dotenv").config();

const { MQTT_HOST, MQTT_PASS, MQTT_USER, VIN } = process.env;

const mqttModule = {
  connect() {
    return mqtt.connect(MQTT_HOST, {
      password: MQTT_PASS,
      username: MQTT_USER,
    });
  },
  checkConnection() {
    return new Promise((resolve, reject) => {
      const client = mqttModule.connect();
      client.on("connect", resolve);
      client.on("error", reject);
      client.end();
    });
  },
  register(code, name, unit, device_class) {
    const client = mqttModule.connect();
    const slugName = slugify(name.toLowerCase(), "_");
    const topic = `homeassistant/sensor/haval_${code}/config`;

    client.on("connect", () => {
      client.publish(
        topic,
        JSON.stringify({
          device_class,
          unique_id: `haval_${VIN}_${slugName}`,
          object_id: `haval_${VIN}_${slugName}`,
          name,
          unit_of_measurement: unit,
          state_topic: `haval/${code}/state`
        }),
        (err) => {
          if (err) console.log(err);
          client.end();
        }
      );
    });
  },
  sendMessage(code, value) {
    const client = mqttModule.connect();

    client.on("connect", () => {
      client.publish(
        `haval/${code}/state`,
        String(value),
        { retain: true },
        (err) => {
          if (err) console.log(err);
          client.end();
        }
      );
    });
  },
};

module.exports = mqttModule;
