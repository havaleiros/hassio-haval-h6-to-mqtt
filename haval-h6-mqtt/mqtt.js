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
  sendMqtt(topic, payload, options){
    const client = mqttModule.connect();

    client.on("connect", () => {
      client.publish(
        topic,
        payload,
        options,
        (err) => {
          if (err) console.log(err);
          client.end();
        }
      );
    });
  },
  register(code, name, unit, device_class) {
    const slugName = slugify(name.toLowerCase(), "_");
    const topic = `homeassistant/sensor/haval_${VIN.toLowerCase()}_${code}/config`;

    let payload = {        
      unique_id: `haval_${VIN.toLowerCase()}_${slugName}`,
      object_id: `haval_${VIN.toLowerCase()}_${slugName}`,
      name,
      state_topic: `haval_${VIN.toLowerCase()}/${code}/state`
    };

    if (device_class !== "None") {
      payload.device_class = device_class;
    }

    if (unit !== null && !["-", " ", "_"].includes(unit)) {
      payload.unit_of_measurement = unit;
    }

    mqttModule.sendMqtt(topic,JSON.stringify(payload),{ retain: true });
  },
  registerDeviceTracker() {
    const configTopic = `homeassistant/device_tracker/haval_${VIN.toLowerCase()}/config`;
    const configPayload = {
      name: `haval_${VIN.toLowerCase()}`,
      unique_id: `haval_${VIN.toLowerCase()}`,
      json_attributes_topic: `homeassistant/device_tracker/haval_${VIN.toLowerCase()}/attributes`
    };
  
    mqttModule.sendMqtt(configTopic, JSON.stringify(configPayload), { retain: true });
  },  
  sendDeviceTrackerUpdate(latitude, longitude, attributes) {
    const json_attributes_topic = `homeassistant/device_tracker/haval_${VIN.toLowerCase()}/attributes`;
    const gpsData = {
      longitude: Number(longitude),
      latitude: Number(latitude),
      gps_accuracy: 60
    }

    const attributesPayload = Object.assign({}, gpsData, attributes);

    mqttModule.sendMqtt(json_attributes_topic, JSON.stringify(attributesPayload), { retain: true });
  },  
  sendMessage(code, value) {
    const topic = `haval_${VIN.toLowerCase()}/${code}/state`;

    mqttModule.sendMqtt(topic, String(value), { retain: true });
  },
};

module.exports = mqttModule;
