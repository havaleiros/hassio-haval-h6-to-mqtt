const mqtt = require("mqtt");
var slugify = require("slugify");
const carConnector = require("./carConnector");
const storage = require("./storage");
const { LogType, printLog } = require('./utils');

const prefix = 'gwmbrasil';
require("dotenv").config();

const { MQTT_HOST, MQTT_PASS, MQTT_USER, PIN } = process.env;

const EntityType = {
  SENSOR: "sensor",
  BINARY_SENSOR: "binary_sensor",
  INPUT_TEXT: "input_text",
  IMAGE: "image",
  DEVICE_TRACKER: "device_tracker",
  SWITCH: "switch",
  BUTTON: "button",
  SELECT: "select",
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
          if (err) printLog(LogType.ERROR, `***MQTT connection error: ${err.message}`);
          client.end();
      });
    });
  },
  async remove(entityType, _prefix, vin, code) {    
    var topic = `homeassistant/${entityType.toLowerCase()}/${_prefix}_${vin.toLowerCase()}${code ? "_" + code.toLowerCase() : ""}/config`;
    mqttModule.sendMqtt(topic, null, { retain: false });

    topic = `homeassistant/${entityType.toLowerCase()}/${_prefix}_${vin.toLowerCase()}${code ? "_" + code : ""}/config`;
    mqttModule.sendMqtt(topic, null, { retain: false });

    var legacyTopic = `homeassistant/sensor/${_prefix}_${vin.toLowerCase()}${code ? "_" + code.toLowerCase() : ""}/config`;
    mqttModule.sendMqtt(legacyTopic, null, { retain: false });

    legacyTopic = `homeassistant/sensor/${_prefix}_${vin.toLowerCase()}${code ? "_" + code : ""}/config`;
    mqttModule.sendMqtt(legacyTopic, null, { retain: false });    
  },  
  async register(entityType, vin, code, entity_name, unit = null, device_class = "None", icon = null, actionable = false, initial_value = null, state_class = null) {

    const slugName = slugify(entity_name.toLowerCase(), "_");
    var topic = `homeassistant/${entityType.toLowerCase()}/${prefix}_${vin.toLowerCase()}_${code.toLowerCase()}/config`;

    let payload = {
      unique_id: `${prefix}_${vin.toLowerCase()}_${slugName}`,
      default_entity_id: `${prefix}_${vin.toLowerCase()}_${slugName}`,
      name: entity_name,
      device: {
        "identifiers": [`${vin.toUpperCase()}`],
        "name": `${vin.toUpperCase()}`,
        "model": "BR",
        "manufacturer": "GWM",
      }
    };

    if(entityType === EntityType.IMAGE){
      payload.url_topic = `${prefix}_${vin.toLowerCase()}/${code.toLowerCase()}/state`;
    }
    if ([EntityType.SENSOR, EntityType.BINARY_SENSOR].includes(entityType)) {
      if(device_class !== "None") payload.device_class = device_class;
      payload.state_topic = `${prefix}_${vin.toLowerCase()}/${code.toLowerCase()}/state`;

      if(entityType === EntityType.BINARY_SENSOR){
        payload.payload_on = "1";
        payload.payload_off = "0";
      }
    }
    
    if ([EntityType.SENSOR, EntityType.BINARY_SENSOR, EntityType.SWITCH, EntityType.BUTTON, EntityType.SELECT].includes(entityType) && icon) {
      payload.icon = icon;
    }

    if (entityType === EntityType.SENSOR && unit !== null && !["-", " ", "_", "", "None", "null"].includes(unit)) {
      payload.unit_of_measurement = unit;
    }

    if (entityType === EntityType.SENSOR && state_class !== null && !["-", " ", "_", "", "None", "null"].includes(unit)) {
      payload.state_class = state_class;
      payload.json_attributes_topic = `homeassistant/${entityType.toLowerCase()}/${prefix}_${vin.toLowerCase()}_${code.toLowerCase()}/attributes`;
    }

    if (entityType === EntityType.DEVICE_TRACKER) {
      topic = `homeassistant/device_tracker/${prefix}_${vin.toLowerCase()}/config`;      
      payload.unique_id = `${prefix}_${vin.toLowerCase()}`;
      payload.default_entity_id = `${prefix}_${vin.toLowerCase()}`;
      payload.json_attributes_topic = `homeassistant/device_tracker/${prefix}_${vin.toLowerCase()}/attributes`;
    }

    if (entityType === EntityType.SWITCH) {      
      topic = `homeassistant/switch/${prefix}_${vin.toLowerCase()}_${code.toLowerCase()}/config`;
      payload.command_topic = `homeassistant/switch/${prefix}_${vin.toLowerCase()}_${code.toLowerCase()}/state`;
      payload.state_topic = `homeassistant/switch/${prefix}_${vin.toLowerCase()}_${code.toLowerCase()}/state`;
      payload.optimistic = 'true';
      payload.payload_on = 'ON';
      payload.payload_off = 'OFF';
    }

    if (entityType === EntityType.BUTTON) {      
      topic = `homeassistant/button/${prefix}_${vin.toLowerCase()}_${code.toLowerCase()}/config`;
      payload.command_topic = `homeassistant/button/${prefix}_${vin.toLowerCase()}_${code.toLowerCase()}/press`;
      payload.payload_press = 'PRESS';
    }

    if (entityType === EntityType.SELECT) {
      topic = `homeassistant/select/${code.toLowerCase()}/config`;
      payload.command_topic = `homeassistant/select/${code.toLowerCase()}/state`;
      payload.state_topic = `homeassistant/select/${code.toLowerCase()}/state`;
      payload.options = initial_value;
      payload.unique_id = `${code.toLowerCase()}`;
      payload.default_entity_id = `${code.toLowerCase()}`;
    }

    mqttModule.sendMqtt(topic, JSON.stringify(payload), { retain: true });

    if (!Array.isArray(actionable) && String(actionable) !== "Y") actionable = [actionable];
    
    if (String(actionable) !== "Y"){
      actionable.forEach((actionableItem) => {
        if(actionableItem && PIN){
          if(actionableItem.entity_type){
            let topicToMonitorParent = payload.state_topic ? payload.state_topic : payload.command_topic;
            topicsToSubscribe[`${entityType}_${vin.toLowerCase()}_${code.toLowerCase()}`] = { topic: topicToMonitorParent };
            topicsAndActions[`${actionableItem.entity_type}_${vin.toLowerCase()}_${code.toLowerCase()}_${actionableItem.action.toLowerCase()}`] = { 
              action: actionableItem.action, 
              topic_to_monitor_parent: topicToMonitorParent, 
              topic_to_monitor_actionable: "", 
              parent_attributes: actionableItem.parent_attributes && actionableItem.parent_attributes === "Y" ? payload.json_attributes_topic : "",
              link_type: actionableItem.link_type,
              vin: vin };

            mqttModule.register(EntityType[actionableItem.entity_type.toUpperCase()], 
                                vin,
                                `${code.toLowerCase()}_${actionableItem.action.toLowerCase()}`,
                                actionableItem.description,
                                null,
                                "None",
                                actionableItem.icon,
                                "Y",
                                null,
                                null);
          }      
        }
      });
    }
    else if (String(actionable) === "Y"){
      if(topicsAndActions[`${entityType}_${vin.toLowerCase()}_${code.toLowerCase()}`] && payload.command_topic){
          topicsToSubscribe[`${entityType}_${vin.toLowerCase()}_${code.toLowerCase()}`] = { topic: payload.command_topic };
          topicsAndActions[`${entityType}_${vin.toLowerCase()}_${code.toLowerCase()}`].topic_to_monitor_actionable = payload.command_topic;
          topicsAndActions[`${entityType}_${vin.toLowerCase()}_${code.toLowerCase()}`].topic_to_update = payload.command_topic;
      }
    }    

    storage.setItem('topicsAndActions', JSON.stringify(topicsAndActions));
    storage.setItem('topicsToSubscribe', JSON.stringify(topicsToSubscribe));
  },
  sendDeviceTrackerUpdate(vin, latitude, longitude, attributes) {
    const json_attributes_topic = `homeassistant/device_tracker/${prefix}_${vin.toLowerCase()}/attributes`;
    const gpsData = {
      longitude: Number(longitude),
      latitude: Number(latitude),
      gps_accuracy: 60
    }

    const attributesPayload = Object.assign({}, gpsData, attributes);

    mqttModule.sendMqtt(json_attributes_topic, JSON.stringify(attributesPayload), { retain: true });
  },
  sendMessage(vin, code, value) {
    const topic = `${prefix}_${vin.toLowerCase()}/${code.toLowerCase()}/state`;

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
              printLog(LogType.ERROR, `***Error subscribing to topic [${String(topicsToSubscribe[key].topic)}]: ${err.message}`);
            }
          });
        });

        client.on('message', async (topic, message) => {
          let messageValue = message.toString().toUpperCase();

          Object.keys(topicsAndActions).forEach(async function(key) {
            if (topic === String(topicsAndActions[key].topic_to_monitor_actionable)){
              if(storage.getItem('Startup') == "true") return;

                const actions = {
                  airConditioner: async () => {
                    return await carConnector.carUtil.airConditioner(carConnector.Actions.AirCon.TURN_ON, topicsAndActions[key].vin);
                  },
                  engineOn: async () => {
                    return await carConnector.carUtil.engine(carConnector.Actions.Engine.TURN_ON, topicsAndActions[key].vin);
                  },
                  engineOff: async () => {
                    return await carConnector.carUtil.engine(carConnector.Actions.Engine.TURN_OFF, topicsAndActions[key].vin);
                  },
                  trunkOpen: async () => {
                    return await carConnector.carUtil.trunk(carConnector.Actions.Doors.OPEN, topicsAndActions[key].vin);
                  },
                  trunkClose: async () => {
                    return await carConnector.carUtil.trunk(carConnector.Actions.Doors.CLOSE, topicsAndActions[key].vin);
                  },
                  doorsOpen: async () => {
                    return await carConnector.carUtil.doors(carConnector.Actions.Doors.OPEN, topicsAndActions[key].vin);
                  },
                  doorsClose: async () => {
                    return await carConnector.carUtil.doors(carConnector.Actions.Doors.CLOSE, topicsAndActions[key].vin);
                  },
                  windowsOpen: async () => {
                    return await carConnector.carUtil.windows(carConnector.Actions.Windows.OPEN, topicsAndActions[key].vin);
                  },
                  windowsClose: async () => {
                    return await carConnector.carUtil.windows(carConnector.Actions.Windows.CLOSE, topicsAndActions[key].vin);
                  },
                  skyWindowOpen: async () => {
                    return await carConnector.carUtil.skyWindow(carConnector.Actions.SkyWindow.OPEN, topicsAndActions[key].vin);
                  },
                  skyWindowClose: async () => {
                    return await carConnector.carUtil.skyWindow(carConnector.Actions.SkyWindow.CLOSE, topicsAndActions[key].vin);
                  },
                  chargingLogs: async () => {
                    const list = await carConnector.carData.getChargingLogs(topicsAndActions[key].vin);
                    if(list && list.length > 0 && topicsAndActions[key].parent_attributes){
                      const json_attributes_topic = topicsAndActions[key].parent_attributes;
                      
                      const last_update = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', });
                      const attributesPayload = {
                        charging_logs: list,
                        last_update: last_update
                      };
                      mqttModule.sendMqtt(json_attributes_topic, JSON.stringify(attributesPayload), { retain: true });
                    }
                    else{
                      mqttModule.sendMqtt(json_attributes_topic, JSON.stringify({ charging_logs: "", last_update: last_update }), { retain: true });
                    }
                  },
                  stopCharging: async () => {
                    return await carConnector.carUtil.stopCharging(topicsAndActions[key].vin);               
                  },
                };

                const SendStatusMessage = (vin, data) => {
                  try {
                    if(data && data.message){
                      const formattedMessage = data.message.replace(/(\r\n|\n|\r)/g, " | ");
                      mqttModule.sendMessage(vin, "status_message", formattedMessage);
                    }
                  } catch (e) {
                    printLog(LogType.ERROR, `***Error formatting status message: ${e.message}`);
                  }
                };
                
                const action = actions[String(topicsAndActions[key].action)];
                  if (action && String(messageValue) === (String(topicsAndActions[key].link_type) === "press" ? 'PRESS' : 'ON')) {
                  try {
                    const data = await action();
                    if (data && !data.result && !data.running && !data.actualState && !data.lockRequired) {
                      throw new Error(data.message)
                    }

                    if(data) SendStatusMessage(topicsAndActions[key].vin, data);

                  } catch (e) {
                    printLog(LogType.ERROR, `***Error executing action [${String(topicsAndActions[key].action)}]***: ${e.message}`);
                    SendStatusMessage(topicsAndActions[key].vin, `Erro executando comando \"${String(topicsAndActions[key].action)}\".`);
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
                printLog(LogType.ERROR, `***Error executing the parent and child status sync/toggle.***`)
                printLog(LogType.ERROR, `Parent topic: ${String(topicsAndActions[key].topic_to_monitor_parent)}`);
                printLog(LogType.ERROR, `Child topic: ${String(topicsAndActions[key].topic_to_update)}`);
                printLog(LogType.ERROR, e.message);
              }
            }
          });
        });
    });

    client.on('error', (e) => {
      printLog(LogType.ERROR, `***Error on MQTT [ActionableAndLink] connection: ${e.message}` );
    });
  }
}

module.exports = { mqttModule, EntityType, ActionableAndLink };