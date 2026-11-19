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
bashio::log.info "Username: ${USERNAME}."
bashio::log.info "VIN: ${VIN}."
bashio::log.info "Refresh time: ${REFRESH_TIME}."
bashio::log.info "Log Level: ${LOG_LEVEL}."

bashio::log.info "Starting service."
npm run start
