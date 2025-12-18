const yup = require('yup');

module.exports = yup.object({
  REFRESH_TIME: yup.string().required('Time interval for querying the API and updating data for entities created by this integration'),
  MQTT_HOST: yup.string().matches(/^mqtt:\/\/[a-zA-Z0-9.-]+(:\d+)?\/?$/).required('MQTT Host is missing'),
  MQTT_PASS: yup.string('MQTT password configured in your broker'),
  MQTT_USER: yup.string('MQTT user configured in your broker'),
  USERNAME: yup.string().required('Username from "My GWM" app'),
  PASSWORD: yup.string().required('Password from "My GWM" app'),
  VIN: yup.string().required('Vehicle identification number.'),
  PIN: yup.string('PIN code from "My GWM" application'),
  OPENAI_TOKEN: yup.string('OpenAI API token for advanced features'),
  GEMINI_TOKEN: yup.string('Gemini API token for advanced features'),
  GEOCODE_API_KEY: yup.string('Google Geocode API key for reverse geocoding (latitude/longitude to address)'),
  DEVICE_TRACKER_ENABLED: yup.boolean()
});
