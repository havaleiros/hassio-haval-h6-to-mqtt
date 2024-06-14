# Changelog

## 0.0.10
- Replace sensors by binary_sensors for doors and renamed them.
- *Alert*: Renaming sensors will make some previous sensors unavailable, and any customized dashboards must be updated.
- New Dashboard for Home Assistant.
- *See README for more information*.
- Add icons for sensors without device_class and binary_sensors.
- Entities are created only if the related value exists in the API response.
- Add a config option to deactivate the device_tracker.
- Removed the configs for pressure unit and data path.

## 0.0.9
- Bugfix: Fix unhandled number value from API when creating device tracker attributes
- Fixes in the map.js file

## 0.0.8
- Attributes related to Aircon, doors and window position moved from device tracker attributes to standalone sensors.
- Updated README to add the information about hidden MQTT password setting.

## 0.0.7
- Add device_tracker entity and attributes.
- Modified the map.js file to segregate sensors, attributes and unused items.
- Added the method [sendMqtt], [registerDeviceTracker] and [sendDeviceTrackerUpdate] to mqtt.js.
- Updated index.js to update information related to device_tracker and its attributes.

## 0.0.6
- Consolidated initial version by @paulovitin