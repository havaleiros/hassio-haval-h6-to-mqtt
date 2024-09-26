const yup = require('yup');

module.exports = yup.object({
  REFRESH_TIME: yup.string().required('Time interval for querying the API and updating data for entities created by this integration'),
  MQTT_HOST: yup.string().matches(/^mqtt:\/\/[a-zA-Z0-9.-]+(:\d+)?\/?$/).required('MQTT Host is missing'),
  MQTT_PASS: yup.string('MQTT password configured in your broker'),
  MQTT_USER: yup.string().required('MQTT user configured in your broker'),
  USERNAME: yup.string().required('Username from myGWM app'),
  PASSWORD: yup.string().required('Password from myGWM app'),
  VIN: yup.string().required('Vehicle identification number.'),
  PIN: yup.string('PIN code from myGWM application'),
  DEVICE_TRACKER_ENABLED: yup.boolean()
});
