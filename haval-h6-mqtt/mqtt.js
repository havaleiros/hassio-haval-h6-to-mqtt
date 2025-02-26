const mqtt = require("mqtt");
var slugify = require("slugify");
const { commands } = require("./axios");
const storage = require("./storage");
const prefix = "haval";

require("dotenv").config();

const { MQTT_HOST, MQTT_PASS, MQTT_USER, VIN, PIN } = process.env;

const EntityType = {
  SENSOR: "sensor",
  BINARY_SENSOR: "binary_sensor",
  INPUT_TEXT: "input_text",
  IMAGE: "image",
  DEVICE_TRACKER: "device_tracker",
  SWITCH: "switch",
  BUTTON: "button",
};

let topicsAndActions = JSON.parse(storage.getItem('topicsAndActions')) || {};
let topicsToSubscribe = JSON.parse(storage.getItem('topicsToSubscribe')) || {};

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
          if (err) console.error(err);
          client.end();
      });
    });
  },
  remove(entityType, code) {
    var payload = "";
    var topic = `homeassistant/${entityType.toLowerCase()}/${prefix}_${VIN.toLowerCase()}_${code}/config`;
    mqttModule.sendMqtt(topic, JSON.stringify(payload), { retain: true });

    var legacyTopic = `homeassistant/sensor/${prefix}_${VIN.toLowerCase()}_${code}/config`;
    mqttModule.sendMqtt(legacyTopic, JSON.stringify(payload), { retain: true });
  },  
  register(entityType, code, name, unit = null, device_class = "None", icon = null, actionable) {
    
    mqttModule.remove(entityType, code);
    mqttModule.remove(entityType, "None");
    
    const slugName = slugify(name.toLowerCase(), "_");
    var topic = `homeassistant/${entityType.toLowerCase()}/${prefix}_${VIN.toLowerCase()}_${code}/config`;

    let payload = {
      unique_id: `${prefix}_${VIN.toLowerCase()}_${slugName}`,
      object_id: `${prefix}_${VIN.toLowerCase()}_${slugName}`,
      name      
    };

    if(entityType === EntityType.IMAGE){
      payload.url_topic = `${prefix}_${VIN.toLowerCase()}/${code}/state`;
    }
    if ([EntityType.SENSOR, EntityType.BINARY_SENSOR].includes(entityType)) {
      if(device_class !== "None") payload.device_class = device_class;
      payload.state_topic = `${prefix}_${VIN.toLowerCase()}/${code}/state`;

      if(entityType === EntityType.BINARY_SENSOR){
        payload.payload_on = "1";
        payload.payload_off = "0";
      }
    }
    
    if ([EntityType.SENSOR, EntityType.BINARY_SENSOR, EntityType.SWITCH, EntityType.BUTTON].includes(entityType) && icon) {
      payload.icon = icon;
    }

    if (entityType === EntityType.SENSOR && unit !== null && !["-", " ", "_", "", "None", "null"].includes(unit)) {
      payload.unit_of_measurement = unit;
    }

    if (entityType === EntityType.DEVICE_TRACKER) {
      topic = `homeassistant/device_tracker/${prefix}_${VIN.toLowerCase()}/config`;
      payload.name = `${prefix}_${VIN.toLowerCase()}`;
      payload.unique_id = `${prefix}_${VIN.toLowerCase()}`;
      payload.object_id = `${prefix}_${VIN.toLowerCase()}`;
      payload.json_attributes_topic = `homeassistant/device_tracker/${prefix}_${VIN.toLowerCase()}/attributes`;
    }

    if (entityType === EntityType.SWITCH) {      
      topic = `homeassistant/switch/${prefix}_${VIN.toLowerCase()}_${code.toLowerCase()}/config`;
      payload.command_topic = `homeassistant/switch/${prefix}_${VIN.toLowerCase()}_${code.toLowerCase()}/set`;
      payload.optimistic = 'true';
      payload.payload_on = 'ON';
      payload.payload_off = 'OFF';
    }

    if (entityType === EntityType.BUTTON) {      
      topic = `homeassistant/button/${prefix}_${VIN.toLowerCase()}_${code.toLowerCase()}/config`;
      payload.command_topic = `homeassistant/button/${prefix}_${VIN.toLowerCase()}_${code.toLowerCase()}/press`;
      payload.payload_press = 'PRESS';
    }

    mqttModule.sendMqtt(topic, JSON.stringify(payload), { retain: true });

    if(actionable && PIN){
      if(actionable.entity_type){
        let topicToMonitorParent = payload.state_topic ? payload.state_topic : payload.command_topic;
        topicsToSubscribe[`${entityType}_${VIN.toLowerCase()}_${code}`] = { topic: topicToMonitorParent };
        topicsAndActions[`${actionable.entity_type}_${VIN.toLowerCase()}_${code}_${actionable.action.toLowerCase()}`] = { 
          action: actionable.action, 
          topic_to_monitor_parent: topicToMonitorParent, 
          topic_to_monitor_actionable: "", 
          topic_to_update: "", 
          link_type: actionable.link_type };

        mqttModule.register(entityType = EntityType[actionable.entity_type.toUpperCase()], 
                            code = `${code}_${actionable.action.toLowerCase()}`,
                            name = actionable.description,
                            unit = null,
                            device_class = "None",
                            icon = actionable.icon,
                            actionable = "Y");
      }
      else if (String(actionable) === "Y"){
        if(topicsAndActions[`${entityType}_${VIN.toLowerCase()}_${code}`] && payload.command_topic){
          topicsToSubscribe[`${entityType}_${VIN.toLowerCase()}_${code}`] = { topic: payload.command_topic };
          topicsAndActions[`${entityType}_${VIN.toLowerCase()}_${code}`].topic_to_monitor_actionable = payload.command_topic;
          topicsAndActions[`${entityType}_${VIN.toLowerCase()}_${code}`].topic_to_update = payload.command_topic;
        }
      }
    }

    storage.setItem('topicsAndActions', JSON.stringify(topicsAndActions));
    storage.setItem('topicsToSubscribe', JSON.stringify(topicsToSubscribe));
  },
  sendDeviceTrackerUpdate(latitude, longitude, attributes) {
    const json_attributes_topic = `homeassistant/device_tracker/${prefix}_${VIN.toLowerCase()}/attributes`;
    const gpsData = {
      longitude: Number(longitude),
      latitude: Number(latitude),
      gps_accuracy: 60
    }

    const attributesPayload = Object.assign({}, gpsData, attributes);

    mqttModule.sendMqtt(json_attributes_topic, JSON.stringify(attributesPayload), { retain: true });
  },
  sendMessage(code, value) {
    const topic = `${prefix}_${VIN.toLowerCase()}/${code}/state`;

    mqttModule.sendMqtt(topic, String(value), { retain: true });
  },
};

const ActionableAndLink = {
  execute() {
    const client = mqttModule.connect();

    client.on('connect', () => {
        Object.keys(topicsToSubscribe).forEach(function(key) {

          client.subscribe(String(topicsToSubscribe[key].topic), (err) => {
            if (err) {
              console.error(`***Error subscribing to topic [${String(topicsToSubscribe[key].topic)}]: `, err);
            }
          });
        });

        client.on('message', async (topic, message) => {
          let messageValue = message.toString().toUpperCase();

          Object.keys(topicsAndActions).forEach(async function(key) {
            if (topic === String(topicsAndActions[key].topic_to_monitor_actionable)){
              if(storage.getItem('Startup') == "true") return;

              if(String(topicsAndActions[key].action) === "airConditioner" && ["ON", "PRESS", "TRUE"].includes(messageValue)){
                try {
                  let acData = await commands.airConditioner(PIN, VIN, true);
                  console.info("Command airConditioner executed: ", acData);
                } catch(e){
                  console.error(`***Error executing action [${String(topicsAndActions[key].action)}]***`);
                  console.error(e.message);
                }
              }
            }
            else if (topic === String(topicsAndActions[key].topic_to_monitor_parent) && topicsAndActions[key].link_type && ["sync", "toggle"].includes(String(topicsAndActions[key].link_type))){
              try {
                if(messageValue === "0" || messageValue === "OFF" || messageValue === "FALSE"){
                  mqttModule.sendMqtt(String(topicsAndActions[key].topic_to_update), 
                                      String(topicsAndActions[key].link_type) === "sync" ? 'OFF' : String(topicsAndActions[key].link_type) === "toggle" ? 'ON' : 'OFF',
                                      { retain: false });
                }
                else{
                  mqttModule.sendMqtt(String(topicsAndActions[key].topic_to_update), 
                                      String(topicsAndActions[key].link_type) === "sync" ? 'ON' : String(topicsAndActions[key].link_type) === "toggle" ? 'OFF' : 'ON', 
                                      { retain: false });              
                }
              }
              catch(e){
                console.error(`***Error executing the parent and child status sync/toggle.***`)
                console.error(`Parent topic: `, String(topicsAndActions[key].topic_to_monitor_parent));
                console.error(`Child topic: `, String(topicsAndActions[key].topic_to_update));
                console.error(e.message);
              }
            }
          });
        });
    });

    client.on('error', (e) => {
      console.error('***Error on MQTT [ActionableAndLink] connection:', e.message);
    });
  }
}

module.exports = { mqttModule, EntityType, ActionableAndLink };