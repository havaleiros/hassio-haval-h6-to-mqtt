#!/usr/bin/with-contenv bashio
set +u

export REFRESH_TIME=$(bashio::config 'refresh_time')
export USERNAME=$(bashio::config 'gwm_username')
export PASSWORD=$(bashio::config 'gwm_password')
export VIN=$(bashio::config 'gwm_vin')
export PIN=$(bashio::config 'gwm_pin')
if bashio::config.has_value 'gwm_verify_code'; then
  export VERIFY_CODE=$(bashio::config 'gwm_verify_code')
else
  export VERIFY_CODE=""
fi
export MQTT_HOST=$(bashio::config 'mqtt_server')
export MQTT_USER=$(bashio::config 'mqtt_user')
export MQTT_PASS=$(bashio::config 'mqtt_pass')
export DEVICE_TRACKER_ENABLED=$(bashio::config 'device_tracker_enabled')
export LOG_LEVEL=$(bashio::config 'log_level')
if bashio::config.has_value 'ac_temperature'; then
  export AC_TEMPERATURE=$(bashio::config 'ac_temperature')
else
  export AC_TEMPERATURE="23"
fi
if bashio::config.has_value 'ac_duration_minutes'; then
  export AC_DURATION_MINUTES=$(bashio::config 'ac_duration_minutes')
else
  export AC_DURATION_MINUTES="10"
fi
if bashio::config.has_value 'purifier_duration_minutes'; then
  export PURIFIER_DURATION_MINUTES=$(bashio::config 'purifier_duration_minutes')
else
  export PURIFIER_DURATION_MINUTES="10"
fi
bashio::log.info "Username: ${USERNAME}."
bashio::log.info "VIN: ${VIN}."
bashio::log.info "Refresh time: ${REFRESH_TIME}."
bashio::log.info "Log Level: ${LOG_LEVEL}."
bashio::log.info "A/C initial values: ${AC_TEMPERATURE} °C, ${AC_DURATION_MINUTES} min, Purifier: ${PURIFIER_DURATION_MINUTES} min."

bashio::log.info "Starting service."
npm run start
