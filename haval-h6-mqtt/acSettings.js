// A/C temperature/duration and air purifier duration as Home Assistant number entities (MQTT discovery).
// Values live in retained MQTT state topics, so they survive add-on/HA restarts; the add-on options
// (AC_TEMPERATURE / AC_DURATION_MINUTES) are only the initial values when nothing is retained yet.
// Note: one global set of values (not per VIN); fine for a single car.
const mqtt = require("mqtt");
const { LogType, printLog } = require("./utils");

const SETTINGS = {
  ac_temperature: { name: "Temperatura do A/C", min: 17, max: 31, unit: "°C", icon: "mdi:thermometer", env: "AC_TEMPERATURE", def: 23 },
  ac_duration_minutes: { name: "Duração do A/C", min: 5, max: 30, unit: "min", icon: "mdi:timer-outline", env: "AC_DURATION_MINUTES", def: 10 },
  purifier_duration_minutes: { name: "Duração do purificador", min: 5, max: 30, unit: "min", icon: "mdi:timer-cog-outline", env: "PURIFIER_DURATION_MINUTES", def: 10 },
};

// Integer within the setting's range, else null.
const parse = (value, s) => {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n >= s.min && n <= s.max ? n : null;
};

const values = {};
for (const [key, s] of Object.entries(SETTINGS)) values[key] = parse(process.env[s.env], s) ?? s.def;

const get = () => ({
  temperature: String(values.ac_temperature),
  duration: String(values.ac_duration_minutes),
  purifierDuration: String(values.purifier_duration_minutes),
});

function start(vin) {
  const { MQTT_HOST, MQTT_PASS, MQTT_USER } = process.env;
  const v = vin.toLowerCase();
  const stateTopic = (key) => `gwmbrasil_${v}/${key}/state`;
  const setTopic = (key) => `gwmbrasil_${v}/${key}/set`;
  const restored = new Set();
  let initialised = false;

  const client = mqtt.connect(MQTT_HOST, { username: MQTT_USER, password: MQTT_PASS });

  client.on("connect", () => {
    const topics = [];
    for (const [key, s] of Object.entries(SETTINGS)) {
      const config = {
        unique_id: `gwmbrasil_${v}_${key}`,
        default_entity_id: `number.gwmbrasil_${v}_${key}`,
        name: s.name,
        icon: s.icon,
        unit_of_measurement: s.unit,
        min: s.min,
        max: s.max,
        step: 1,
        mode: "slider",
        state_topic: stateTopic(key),
        command_topic: setTopic(key),
        device: { identifiers: [vin.toUpperCase()], name: vin.toUpperCase(), model: "BR", manufacturer: "GWM" },
      };
      client.publish(`homeassistant/number/gwmbrasil_${v}_${key}/config`, JSON.stringify(config), { retain: true });
      topics.push(stateTopic(key), setTopic(key));
    }

    client.subscribe(topics, (err) => {
      if (err) return printLog(LogType.ERROR, `***Error subscribing to A/C settings topics: ${err.message}`);
      if (initialised) return;
      initialised = true;
      // Retained values arrive right after the subscription is acknowledged; give them a few seconds,
      // then publish the option value for any setting that has none yet.
      setTimeout(() => {
        for (const key of Object.keys(SETTINGS)) {
          if (!restored.has(key)) client.publish(stateTopic(key), String(values[key]), { retain: true });
        }
        printLog(LogType.STARTUP, `    A/C settings in use: ${values.ac_temperature} °C, ${values.ac_duration_minutes} min, purifier ${values.purifier_duration_minutes} min (restored from MQTT: ${[...restored].join(", ") || "none"})`);
      }, 5000);
    });
  });

  client.on("message", (topic, message) => {
    for (const [key, s] of Object.entries(SETTINGS)) {
      const isState = topic === stateTopic(key);
      if (!isState && topic !== setTopic(key)) continue;
      const n = parse(message.toString(), s);
      if (n === null) {
        printLog(LogType.ERROR, `***Ignoring invalid ${key} value "${message.toString()}" (allowed ${s.min}-${s.max})`);
        return;
      }
      values[key] = n;
      if (isState) restored.add(key);
      else {
        client.publish(stateTopic(key), String(n), { retain: true });
        printLog(LogType.INFO, `A/C setting ${key} set to ${n}`);
      }
      return;
    }
  });

  client.on("error", (e) => printLog(LogType.ERROR, `***Error on MQTT [acSettings] connection: ${e.message}`));
}

module.exports = { start, get, parse, SETTINGS };
