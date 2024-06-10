# Changelog

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