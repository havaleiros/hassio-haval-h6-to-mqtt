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
  },
  2101001: {
    description: "Pressão do Pneu Dianteiro Esquerdo",
    unit: "psi",
    device_class: "pressure",
    entity_type: "sensor",
    state_class: "measurement",
    formula: "Math.floor(parseInt(value) * 0.145038)",
  },
  2101004: {
    description: "Pressão do Pneu Traseiro Direito",
    unit: "psi",
    device_class: "pressure",
    entity_type: "sensor",
    state_class: "measurement",
    formula: "Math.floor(parseInt(value) * 0.145038)",
  },
  2101003: {
    description: "Pressão do Pneu Traseiro Esquerdo",
    unit: "psi",
    device_class: "pressure",
    entity_type: "sensor",
    state_class: "measurement",
    formula: "Math.floor(parseInt(value) * 0.145038)",
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
    state_class: "measurement",
  },
  2013005: {
  	description: "Estado de Carga 12V",
    unit: '%',
    device_class: "battery",
    entity_type: "sensor",
    icon: "mdi:car-battery",
    state_class: "measurement",
  },
  2041142: {
    description: "Estado da Carga", //(0:Desconectado 1:Carregando 3:Finalizado 5:Aguardando liberação)
    device_class: "None",
    entity_type: "sensor",
    icon: "mdi:ev-station",
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
  },  
  2210001: {
    description: "Vidro Dianteiro Esquerdo", //(1: Fechado 2: Aberto 3: Entreaberto)
    device_class: "None",
    entity_type: "sensor",
    icon: "mdi:car-windshield-outline",
  },
  2210002: {
    description: "Vidro Dianteiro Direito", //(1: Fechado 2: Aberto 3: Entreaberto)
    device_class: "None",
    entity_type: "sensor",
    icon: "mdi:car-windshield-outline",
  },
  2210003: {
    description: "Vidro Traseiro Esquerdo", //(1: Fechado 2: Aberto 3: Entreaberto)
    device_class: "None",
    entity_type: "sensor",
    icon: "mdi:car-windshield-outline",
  },
  2210004: {
    description: "Vidro Traseiro Direito", //(1: Fechado 2: Aberto 3: Entreaberto)
    device_class: "None",
    entity_type: "sensor",
    icon: "mdi:car-windshield-outline",
  },
  2013023: {
    description: "Agendamento de Carga",
    device_class: "None",
    entity_type: "binary_sensor",
    icon: "mdi:calendar-clock",
  },
  2042082: {
    description: "Estado do Controle de Carga", //(1: Conectado 0: Desconectado)
    device_class: "battery_charging",
    entity_type: "binary_sensor",
    icon: "mdi:ev-plug-ccs2",
  },
  2202001: {
    description: "Estado do Ar Condicionado", //(1: Ligado 0: Desligado)
    device_class: "cold",
    entity_type: "binary_sensor",
    icon: "mdi:air-conditioner",
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
  },
  2208001: {
    description: "Estado da Trava", //(1: Destravado 0: Travado)
    device_class: "lock",
    entity_type: "binary_sensor",    
    icon: "mdi:car-door-lock",
  },
  2206001: {
    description: "Porta-Malas", //(1: Aberto 0: Fechado)
    device_class: "door",
    entity_type: "binary_sensor",
    icon: "mdi:car-back",
  },
  2206002: {
    description: "Porta Dianteira Esquerda", //(1: Aberta 0: Fechada)
    device_class: "door",
    entity_type: "binary_sensor",
    icon: "mdi:car-door",
  },
  2206003: {
    description: "Porta Traseira Esquerda", //(1: Aberta 0: Fechada)
    device_class: "door",
    entity_type: "binary_sensor",
    icon: "mdi:car-door",
  },
  2206004: {
    description: "Porta Dianteira Direita", //(1: Aberta 0: Fechada)
    device_class: "door",
    entity_type: "binary_sensor",
    icon: "mdi:car-door",
  },
  2206005: {
    description: "Porta Traseira Direita", //(1: Aberta 0: Fechada)
    device_class: "door",
    entity_type: "binary_sensor",
    icon: "mdi:car-door",
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
  //2078020: {
  //  description: "Filtragem do Ar do Cockpit", //(1: Ligado 0: Desligado)
  //  device_class: "None",
  //  entity_type: "sensor",
  //},
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
  // 2222001: {
  // 	description: "Estado do Desembaçador Dianteiro",
  // 	unit: "null",
  // 	value: 0,
  // },
  // 2210032: {
  // 	description: "Estado do Desembaçador Traseiro",
  // 	unit: "null",
  // 	value: 0,
  // },
  // 2212001: {
  // 	description: "Estado do Capô",
  // 	unit: "null",
  // 	value: 0,
  // },
  // 2201001: {
  // 	description: "Temperatura da cabine",
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
  // 4105008: {
  // 	description: "networkSignalStrength",
  // 	unit: "-",
  // 	device_class: "None",
  // },
//};

module.exports = {
  sensorTopics,
  attributeTopics,
};
