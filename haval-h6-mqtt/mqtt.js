const axios = require("./axios");
const mqtt = require("mqtt");
const md5 = require("md5");
const storage = require("./storage");
var slugify = require("slugify");

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
    var topic = `homeassistant/${entityType.toLowerCase()}/haval_${VIN.toLowerCase()}_${code}/config`;
    mqttModule.sendMqtt(topic, JSON.stringify(payload), { retain: true });

    var legacyTopic = `homeassistant/sensor/haval_${VIN.toLowerCase()}_${code}/config`;
    mqttModule.sendMqtt(legacyTopic, JSON.stringify(payload), { retain: true });
  },  
  register(entityType, code, name, unit = null, device_class = "None", icon = null, actionable) {
    
    mqttModule.remove(entityType, code);
    mqttModule.remove(entityType, "None");
    
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
    if ([EntityType.SENSOR, EntityType.BINARY_SENSOR].includes(entityType)) {
      if(device_class !== "None") payload.device_class = device_class;
      payload.state_topic = `haval_${VIN.toLowerCase()}/${code}/state`;

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
      topic = `homeassistant/device_tracker/haval_${VIN.toLowerCase()}/config`;
      payload.name = `haval_${VIN.toLowerCase()}`;
      payload.unique_id = `haval_${VIN.toLowerCase()}`;
      payload.object_id = `haval_${VIN.toLowerCase()}`;
      payload.json_attributes_topic = `homeassistant/device_tracker/haval_${VIN.toLowerCase()}/attributes`;
    }

    if (entityType === EntityType.SWITCH) {      
      topic = `homeassistant/switch/haval_${VIN.toLowerCase()}_${code.toLowerCase()}/config`;
      payload.command_topic = `homeassistant/switch/haval_${VIN.toLowerCase()}_${code.toLowerCase()}/set`;
      payload.optimistic = 'true';
      payload.payload_on = 'ON';
      payload.payload_off = 'OFF';
    }

    if (entityType === EntityType.BUTTON) {      
      topic = `homeassistant/button/haval_${VIN.toLowerCase()}_${code.toLowerCase()}/config`;
      payload.command_topic = `homeassistant/button/haval_${VIN.toLowerCase()}_${code.toLowerCase()}/press`;
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

const ActionableAndLink = {
  execute() {
    const client = mqttModule.connect();

    client.on('connect', () => {
        Object.keys(topicsToSubscribe).forEach(function(key) {

          client.subscribe(String(topicsToSubscribe[key].topic), (err) => {
            if (err) {
              console.error(`Error subscribing to topic [${String(topicsToSubscribe[key].topic)}]: `, err);
            }
          });
        });

        client.on('message', async (topic, message) => {  
          let messageValue = message.toString().toUpperCase();

          Object.keys(topicsAndActions).forEach(async function(key) {
            if (topic === String(topicsAndActions[key].topic_to_monitor_actionable)){
              if(storage.getItem('Startup') == "true") return;

              if(String(topicsAndActions[key].action) === "airConditioner" && ["ON", "PRESS", "TRUE"].includes(messageValue)){
                let seqNo = require('crypto').randomUUID().replaceAll('-', '') + '1234';
                try {
                  let acData = await axios.sendCmd({
                                        "0x04": {
                                          "airConditioner": {
                                            "operationTime": "15",
                                            "switchOrder": "1",
                                            "temperature": "18"
                                          }
                                        }
                                      },
                                      0,
                                      md5(PIN),
                                      seqNo,
                                      2,
                                      VIN
                                    );
                  console.info("Command airConditioner executed: ", acData);
                } catch(e){
                  console.error(`***Error executing action [${String(topicsAndActions[key].action)}]***`);
                  console.error(e);
                }
              }
            }
            else if (topic === String(topicsAndActions[key].topic_to_monitor_parent) && topicsAndActions[key].link_type && ["sync", "toggle"].includes(String(topicsAndActions[key].link_type))){
              try {
                if(messageValue === "0" || messageValue === "OFF" || messageValue === "FALSE"){                  
                  mqttModule.sendMqtt(String(topicsAndActions[key].topic_to_update), 
                                      String(topicsAndActions[key].link_type) === "sync" ? 'OFF' : String(topicsAndActions[key].link_type) === "toggle" ? 'ON' : 'OFF',
                                      { retain: true });
                }
                else{
                  mqttModule.sendMqtt(String(topicsAndActions[key].topic_to_update), 
                                      String(topicsAndActions[key].link_type) === "sync" ? 'ON' : String(topicsAndActions[key].link_type) === "toggle" ? 'OFF' : 'ON', 
                                      { retain: true });              
                }
              }
              catch(e){
                console.error(`***Error executing the parent and child status sync/toggle.***`)
                console.error(`Parent topic: `, String(topicsAndActions[key].topic_to_monitor_parent));
                console.error(`Child topic: `, String(topicsAndActions[key].topic_to_update));
                console.error(e);
              }
            }
          });
        });
    });

    client.on('error', (err) => {
      console.error('MQTT [ActionableAndLink] connection error:', err);
    });
  }
}

module.exports = { mqttModule, EntityType, ActionableAndLink };