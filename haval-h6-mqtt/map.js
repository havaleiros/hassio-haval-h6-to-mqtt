const sensorTopics = {
  2103010: {
    description: "Quilometragem Total",
    unit: "km",
    device_class: "distance",
    entity_type: "sensor",
    state_class: "total",
    icon: "mdi:counter",
  },
  2013021: {
    description: "Estado de Carga (SoC)",
    unit: "%",
    device_class: "battery",
    entity_type: "sensor",
    state_class: "measurement",
    actionable: {
                  action: "chargingLogs",
                  description: "Histórico de carregamento",
                  entity_type: "button",
                  icon: "mdi:clipboard-text-clock",
                  parent_attributes: "Y",
                  link_type: "press", //(sync: sincroniza os status, toggle: invertido, press: acionamento sem sincronização)
                }
  },
  2011007: {
    description: "Autonomia Combustão",
    unit: "km",
    device_class: "distance",
    entity_type: "sensor",
    state_class: "measurement",
  },
  2011501: {
    description: "Autonomia EV",
    unit: "km",
    device_class: "distance",
    entity_type: "sensor",
    state_class: "measurement",
  },
  2101002: {
    description: "Pressão do Pneu Dianteiro Direito",
    unit: "psi",
    device_class: "pressure",
    entity_type: "sensor",
    state_class: "measurement",
    formula: "Math.floor(parseInt(value) * 0.145038)",
    pressure_threshold_min: 35,
    pressure_threshold_max: 39,
  },
  2101001: {
    description: "Pressão do Pneu Dianteiro Esquerdo",
    unit: "psi",
    device_class: "pressure",
    entity_type: "sensor",
    state_class: "measurement",
    formula: "Math.floor(parseInt(value) * 0.145038)",
    pressure_threshold_min: 35,
    pressure_threshold_max: 39,
  },
  2101004: {
    description: "Pressão do Pneu Traseiro Direito",
    unit: "psi",
    device_class: "pressure",
    entity_type: "sensor",
    state_class: "measurement",
    formula: "Math.floor(parseInt(value) * 0.145038)",
    pressure_threshold_min: 35,
    pressure_threshold_max: 39,
  },
  2101003: {
    description: "Pressão do Pneu Traseiro Esquerdo",
    unit: "psi",
    device_class: "pressure",
    entity_type: "sensor",
    state_class: "measurement",
    formula: "Math.floor(parseInt(value) * 0.145038)",
    pressure_threshold_min: 35,
    pressure_threshold_max: 39,
  },
  2101006: {
    description: "Temperatura do Pneu Dianteiro Direito",
    unit: "°C",
    device_class: "temperature",
    entity_type: "sensor",
    state_class: "measurement",
  },
  2101005: {
    description: "Temperatura do Pneu Dianteiro Esquerdo",
    unit: "°C",
    device_class: "temperature",
    entity_type: "sensor",
    state_class: "measurement",
  },
  2101008: {
    description: "Temperatura do Pneu Traseiro Direito",
    unit: "°C",
    device_class: "temperature",
    entity_type: "sensor",
    state_class: "measurement",
  },
  2101007: {
    description: "Temperatura do Pneu Traseiro Esquerdo",
    unit: "°C",
    device_class: "temperature",
    entity_type: "sensor",
    state_class: "measurement",
  },
  2013022: {
    description: "Tempo de Carga",
    unit: "min",
    device_class: "duration",
    entity_type: "sensor",
  },
  2017002: {
    description: "Nível de Combustível",
    unit: "L",
    device_class: "volume",
    entity_type: "sensor",
    state_class: "total",
  },
  2013005: {
  	description: "Estado de Carga 12V",
    unit: '%',
    device_class: "battery",
    entity_type: "sensor",
    icon: "mdi:car-battery",
    state_class: "measurement",
    alert_level: "80",
    critical_level: "50"
  },
  2041142: {
    description: "Estado da Carga",
    device_class: "None",
    entity_type: "sensor",
    icon: "mdi:ev-station",
    state_disconnected: "0",
    state_charging: "1",
    state_finished: "3",
    state_waiting: "5",
    actionable: {
                  action: "stopCharging",
                  description: "Interromper carregamento",
                  entity_type: "button",
                  icon: "mdi:ev-plug-type2",
                  link_type: "press", //(sync: sincroniza os status, toggle: invertido, press: acionamento sem sincronização)
                }
  },
  2210005: {
    description: "Posição do Teto Solar", //(3: Fechado >3 posição do teto solar em %)
    device_class: "None",
    entity_type: "sensor",
    icon: "mdi:shield-sun",
    state_closed: "3",
    actionable: [
                  {
                    action: "skyWindowOpen",
                    description: "Abrir teto solar",
                    entity_type: "button",
                    icon: "mdi:emoticon-cool-outline",
                    link_type: "press",
                  },
                  {
                    action: "skyWindowClose",
                    description: "Fechar teto solar",
                    entity_type: "button",
                    icon: "mdi:emoticon-cool",
                    link_type: "press",
                  }
                ]
  },  
  2210001: {
    description: "Vidro Dianteiro Esquerdo",
    device_class: "None",
    entity_type: "sensor",
    icon: "mdi:car-windshield-outline",
    state_closed: "1",
    state_open: "2",
    state_partially_open: "3",
    actionable: [
                  {
                    action: "windowsOpen",
                    description: "Abrir os vidros",
                    entity_type: "button",
                    icon: "mdi:car-windshield-outline",
                    link_type: "press"
                  },
                  {
                    action: "windowsClose",
                    description: "Fechar os vidros",
                    entity_type: "button",
                    icon: "mdi:car-windshield",
                    link_type: "press"
                  }
                ]

  },
  2210002: {
    description: "Vidro Dianteiro Direito",
    device_class: "None",
    entity_type: "sensor",
    icon: "mdi:car-windshield-outline",
    state_closed: "1",
    state_open: "2",
    state_partially_open: "3"
  },
  2210003: {
    description: "Vidro Traseiro Esquerdo",
    device_class: "None",
    entity_type: "sensor",
    icon: "mdi:car-windshield-outline",
    state_closed: "1",
    state_open: "2",
    state_partially_open: "3"
  },
  2210004: {
    description: "Vidro Traseiro Direito",
    device_class: "None",
    entity_type: "sensor",
    icon: "mdi:car-windshield-outline",
    state_closed: "1",
    state_open: "2",
    state_partially_open: "3"
  },
  2013023: {
    description: "Agendamento de Carga",
    device_class: "None",
    entity_type: "binary_sensor",
    icon: "mdi:calendar-clock",
  },
  2042082: {
    description: "Estado do Controle de Carga",
    device_class: "battery_charging",
    entity_type: "binary_sensor",
    icon: "mdi:ev-plug-ccs2",
    state_connected: "1",
    state_disconnected: "0"
  },
  2202001: {
    description: "Estado do Ar Condicionado",
    device_class: "cold",
    entity_type: "binary_sensor",
    icon: "mdi:air-conditioner",
    state_on: "1",
    state_off: "0",
    actionable: {
                  action: "airConditioner",
                  description: "Ativação do ar condicionado",
                  entity_type: "button",
                  icon: "mdi:fan-clock",
                  link_type: "press", //(sync: sincroniza os status, toggle: invertido, press: acionamento sem sincronização)
                }
  },
  2202099: {
    description: "Estado do Purificador de Ar",
    device_class: "None",
    entity_type: "binary_sensor",
    icon: "mdi:air-filter",
    state_on: "1",
    state_off: "0",
  },
  2208001: {
    description: "Estado da Trava",
    device_class: "lock",
    entity_type: "binary_sensor",    
    icon: "mdi:car-door-lock",
    state_open: "1",
    state_closed: "0",
    actionable: [
                  {
                  action: "doorsOpen",
                  description: "Abrir as portas",
                  entity_type: "button",
                  icon: "mdi:car-door",
                  link_type: "press"
                  },
                  {
                  action: "doorsClose",
                  description: "Fechar as portas",
                  entity_type: "button",
                  icon: "mdi:car-door-lock",
                  link_type: "press"
                  }
                ]
  },
  2206001: {
    description: "Porta-Malas",
    device_class: "door",
    entity_type: "binary_sensor",
    icon: "mdi:car-back",
    state_open: "1",
    state_closed: "0",
    actionable: [
                  {
                  action: "trunkOpen",
                  description: "Abrir porta-malas",
                  entity_type: "button",
                  icon: "mdi:car-door",
                  link_type: "press"
                  },
                  {
                  action: "trunkClose",
                  description: "Fechar porta-malas",
                  entity_type: "button",
                  icon: "mdi:car-door-lock",
                  link_type: "press"
                  }
                ]
  },
  2206002: {
    description: "Porta Dianteira Esquerda",
    device_class: "door",
    entity_type: "binary_sensor",
    icon: "mdi:car-door",
    state_open: "1",
    state_closed: "0",
  },
  2206003: {
    description: "Porta Traseira Esquerda",
    device_class: "door",
    entity_type: "binary_sensor",
    icon: "mdi:car-door",
    state_open: "1",
    state_closed: "0",
  },
  2206004: {
    description: "Porta Dianteira Direita",
    device_class: "door",
    entity_type: "binary_sensor",
    icon: "mdi:car-door",
    state_open: "1",
    state_closed: "0",
  },
  2206005: {
    description: "Porta Traseira Direita",
    device_class: "door",
    entity_type: "binary_sensor",
    icon: "mdi:car-door",
    state_open: "1",
    state_closed: "0",
  },
  2078020: {
    description: "Filtragem do Ar do Cockpit",
    device_class: "None",
    entity_type: "binary_sensor",
    icon: "mdi:air-filter",
    state_on: "1",
    state_off: "0",
  },
  2222001: {
   	description: "Estado do Desembaçador Dianteiro", //Tank
    device_class: "None",
    entity_type: "binary_sensor",
    icon: "mdi:car-defrost-front",
  },
  2210032: {
  	description: "Estado do Desembaçador Traseiro", //Tank
    device_class: "None",
    entity_type: "binary_sensor",
    icon: "mdi:car-defrost-rear",
  },
  2201001: {
  	description: "Temperatura da cabine", //Tank
    unit: "°C",
    device_class: "temperature",
    entity_type: "sensor",
    state_class: "measurement",
    icon: "mdi:temperature-celsius",
  },
  2060016: {
  	description: "Aquecimento do volante", //Tank
    device_class: "None",
    entity_type: "binary_sensor",
    icon: "mdi:steering",
  },
  2220001: {
  	description: "Aquecimento do banco do motorista", //Tank
    device_class: "None",
    entity_type: "binary_sensor",
    icon: "mdi:car-seat-heater",
  },
  2220002: {
  	description: "Aquecimento do banco do passageiro", //Tank
    device_class: "None",
    entity_type: "binary_sensor",
    icon: "mdi:car-seat-heater",
  },
  2042071: {
  	description: "Temperatura das baterias", //Tank
    unit: "°C",
    device_class: "temperature",
    entity_type: "sensor",
    state_class: "measurement",
    icon: "mdi:car-seat-heater",
  },
  2012687: {
  	description: "Aquecimento da cabine", //Tank
    device_class: "None",
    entity_type: "binary_sensor",
    icon: "mdi:heating-coil",
  },
};

const attributeTopics = {
  2310001: {
    description: "Autorização do GPS", //(1: Autorizado 0: Não Autorizado)
    unit: "-",
    value: 1,
  },
  2102002: {
    description: "Pressão do Pneu Dianteiro Direito",
    unit: "-",
    value: 0,
  },
  2102001: {
    description: "Pressão do Pneu Dianteiro Esquerdo",
    unit: "-",
    value: 0,
  },
  2102004: {
    description: "Pressão do Pneu Traseiro Direito",
    unit: "-",
    value: 0,
  },
  2102003: {
    description: "Pressão do Pneu Traseiro Esquerdo",
    unit: "-",
    value: 0,
  },
  2102008: {
    description: "Temperatura do Pneu Dianteiro Direito",
    unit: "-",
    value: 0,
  },
  2102007: {
    description: "Temperatura do Pneu Dianteiro Esquerdo",
    unit: "-",
    value: 0,
  },
  2102010: {
    description: "Temperatura do Pneu Traseiro Direito",
    unit: "-",
    value: 0,
  },
  2102009: {
    description: "Temperatura do Pneu Traseiro Esquerdo",
    unit: "-",
    value: 0,
  },
  2210010: {
    description: "Aprendizado do Vidro Dianteiro Direito",
    unit: "-",
    value: 1,
  },
  2210011: {
    description: "Aprendizado do Vidro Dianteiro Esquerdo",
    unit: "-",
    value: 1,
  },
  2210012: {
    description: "Aprendizado do Vidro Traseiro Direito",
    unit: "-",
    value: 1,
  },
  2210013: {
    description: "Aprendizado do Vidro Traseiro Esquerdo",
    unit: "-",
    value: 1,
  },
  4105008: {
    description: "Potência do sinal de rede móvel",
    unit: "-",
    value: 0,
  }
};

//const notUsedTopics = {
  // 2204007: {
  //   description: "Estado do Farol", //(1: Ligado 0: Desligado)
  //   unit: "-",
  //   value: 0,
  // },
  // 2204010: {
  //   description: "Sinal de Setas Direita", //(1: Ligado 0: Desligado)
  //   unit: "-",
  //   value: 0,
  // },
  // 2204009: {
  //   description: "Sinal de Setas Esquerda", //(1: Ligado 0: Desligado)
  //   unit: "-",
  //   value: 0,
  // },
  // 2212001: {
  // 	description: "Estado do Capô",
  // 	unit: "null",
  // 	value: 0,
  // },
  // 2016001: {
  // 	description: "EngState",
  // 	unit: "-",
  // 	value: 0,
  // },
  // 2011002: {
  // 	description: "VehSpd",
  // 	unit: "Km",
  // 	device_class: "distance",
  // },
//};

module.exports = {
  sensorTopics,
  attributeTopics,
};
