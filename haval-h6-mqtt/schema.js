const yup = require('yup');

module.exports = yup.object({
  MQTT_HOST: yup.string().matches(/^mqtt:\/\/[a-zA-Z0-9.-]+(:\d+)?\/?$/).required('MQTT Host is missing'),
  MQTT_PASS: yup.string(),
  MQTT_USER: yup.string().required(),
  VIN: yup.string().required(),
  USERNAME: yup.string().required('Username from myGWM app'),
  PASSWORD: yup.string().required('Password from myGWM app'),
  PRESSURE_UNIT: yup.string(),
  DEVICE_TRACKER_ENABLED: yup.boolean()
});
