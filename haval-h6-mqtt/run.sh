#!/usr/bin/with-contenv bashio
set +u

export USERNAME=$(bashio::config 'haval_username')
export PASSWORD=$(bashio::config 'haval_password')
export VIN=$(bashio::config 'haval_vin')
export MQTT_HOST=$(bashio::config 'mqtt_server')
export MQTT_USER=$(bashio::config 'mqtt_user')
export MQTT_PASS=$(bashio::config 'mqtt_pass')
export DEVICE_TRACKER_ENABLED=$(bashio::config 'device_tracker_enabled')
bashio::log.info "Username: ${USERNAME}."
bashio::log.info "VIN: ${VIN}."

bashio::log.info "Starting service."
npm run start
