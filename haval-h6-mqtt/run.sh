#!/usr/bin/with-contenv bashio
set +u

export REFRESH_TIME=$(bashio::config 'refresh_time')
export USERNAME=$(bashio::config 'gwm_username')
export PASSWORD=$(bashio::config 'gwm_password')
export VIN=$(bashio::config 'gwm_vin')
export PIN=$(bashio::config 'gwm_pin')
export MQTT_HOST=$(bashio::config 'mqtt_server')
export MQTT_USER=$(bashio::config 'mqtt_user')
export MQTT_PASS=$(bashio::config 'mqtt_pass')
export DEVICE_TRACKER_ENABLED=$(bashio::config 'device_tracker_enabled')
bashio::log.info "Username: ${USERNAME}."
bashio::log.info "VIN: ${VIN}."
bashio::log.info "Refresh time: ${REFRESH_TIME}."

bashio::log.info "Starting service."
npm run start
