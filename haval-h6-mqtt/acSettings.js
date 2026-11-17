// A/C temperature/duration and air purifier duration as Home Assistant number entities (MQTT discovery).
// Values live in retained MQTT state topics, so they survive add-on/HA restarts; the add-on options
// (AC_TEMPERATURE / AC_DURATION_MINUTES) are only the initial values when nothing is retained yet.
// Note: one global set of values (not per VIN); fine for a single car.
const mqtt = require("mqtt");
const { LogType, printLog } = require("./utils");

const SETTINGS = {
  ac_temperature: { name: "Temperatura do A/C", min: 16, max: 32, unit: "°C", icon: "mdi:thermometer", env: "AC_TEMPERATURE", def: 18 },
  ac_duration_minutes: { name: "Duração do A/C", min: 1, max: 30, unit: "min", icon: "mdi:timer-outline", env: "AC_DURATION_MINUTES", def: 15 },
  purifier_duration_minutes: { name: "Duração do purificador", min: 1, max: 30, unit: "min", icon: "mdi:timer-cog-outline", env: "PURIFIER_DURATION_MINUTES", def: 20 },
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

// Self-check: node acSettings.js
if (require.main === module) {
  const assert = require("assert");
  const t = SETTINGS.ac_temperature, d = SETTINGS.ac_duration_minutes;
  assert.strictEqual(parse("22", t), 22);
  assert.strictEqual(parse("21.6", t), 22);
  assert.strictEqual(parse("16", t), 16);
  assert.strictEqual(parse("32", t), 32);
  assert.strictEqual(parse("15", t), null);
  assert.strictEqual(parse("33", t), null);
  assert.strictEqual(parse("abc", t), null);
  assert.strictEqual(parse("", t), null);
  assert.strictEqual(parse(undefined, t), null);
  assert.strictEqual(parse("null", d), null);
  assert.strictEqual(parse("1", d), 1);
  assert.strictEqual(parse("31", d), null);
  assert.deepStrictEqual(Object.keys(get()), ["temperature", "duration", "purifierDuration"]);
  assert.strictEqual(get().purifierDuration, "20");
  assert.strictEqual(parse("30", SETTINGS.purifier_duration_minutes), 30);
  assert.strictEqual(parse("31", SETTINGS.purifier_duration_minutes), null);
  console.log("acSettings self-check OK");
}
