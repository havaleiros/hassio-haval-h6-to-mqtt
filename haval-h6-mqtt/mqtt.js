const mqtt = require("mqtt");
var slugify = require("slugify");

require("dotenv").config();

const { MQTT_HOST, MQTT_PASS, MQTT_USER, VIN } = process.env;

const EntityType = {
  SENSOR: "sensor",
  BINARY_SENSOR: "binary_sensor",
  INPUT_TEXT: "input_text",
  IMAGE: "image",
  DEVICE_TRACKER: "device_tracker"
};

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
      client.publish(topic, payload, options, (err) => {
          if (err) console.log(err);
          client.end();
      });
    });
  },
  register(entityType, code, name, unit = null, device_class = "None", icon = null) {
    const slugName = slugify(name.toLowerCase(), "_");
    var topic = `homeassistant/${entityType.toLowerCase()}/haval_${VIN.toLowerCase()}_${code}/config`;

    let payload = {
      unique_id: `haval_${VIN.toLowerCase()}_${slugName}`,
      object_id: `haval_${VIN.toLowerCase()}_${slugName}`,
      name      
    };

    if(entityType === EntityType.IMAGE){
      payload.url_topic = `haval_${VIN.toLowerCase()}/${code}/state`;
    }
    if ((entityType === EntityType.SENSOR || entityType === EntityType.BINARY_SENSOR)) {
      if(device_class !== "None") payload.device_class = device_class;
      payload.state_topic = `haval_${VIN.toLowerCase()}/${code}/state`;

      if(entityType === EntityType.BINARY_SENSOR){
        payload.payload_on = "1";
        payload.payload_off = "0";
      }

      if(icon !== null)
        payload.icon = icon;
    }

    if (entityType === EntityType.SENSOR && unit !== null && !["-", " ", "_"].includes(unit)) {
      payload.unit_of_measurement = unit;
    }

    if (entityType === EntityType.DEVICE_TRACKER) {
      topic = `homeassistant/device_tracker/haval_${VIN.toLowerCase()}/config`;
      payload.name = `haval_${VIN.toLowerCase()}`;
      payload.unique_id = `haval_${VIN.toLowerCase()}`;
      payload.object_id = `haval_${VIN.toLowerCase()}`;
      payload.json_attributes_topic = `homeassistant/device_tracker/haval_${VIN.toLowerCase()}/attributes`;
    }

    mqttModule.sendMqtt(topic, JSON.stringify(payload), { retain: true });
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

module.exports = { mqttModule, EntityType };
