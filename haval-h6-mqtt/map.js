const configTopics = {
  2103010: {
    description: "Quilometragem Total",
    unit: "Km",
    device_class: "distance",
  },
  2013021: {
    description: "Estado de Carga (SoC)",
    unit: "%",
    device_class: "battery",
  },
  2011007: {
    description: "Autonomia Combustão",
    unit: "km",
    device_class: "distance",
  },
  2011501: {
    description: "Autonomia HEV",
    unit: "km",
    device_class: "distance",
  },
  2101002: {
    description: "Pressão do Pneu Dianteiro Direito",
    unit: "PSI",
    device_class: "pressure",
  },
  2101001: {
    description: "Pressão do Pneu Dianteiro Esquerdo",
    unit: "PSI",
    device_class: "pressure",
  },
  2101004: {
    description: "Pressão do Pneu Traseiro Direito",
    unit: "PSI",
    device_class: "pressure",
  },
  2101003: {
    description: "Pressão do Pneu Traseiro Esquerdo",
    unit: "PSI",
    device_class: "pressure",
  },
  2101006: {
    description: "Temperatura do Pneu Dianteiro Direito",
    unit: "°C",
    device_class: "temperature",
  },
  2101005: {
    description: "Temperatura do Pneu Dianteiro Esquerdo",
    unit: "°C",
    device_class: "temperature",
  },
  2101008: {
    description: "Temperatura do Pneu Traseiro Direito",
    unit: "°C",
    device_class: "temperature",
  },
  2101007: {
    description: "Temperatura do Pneu Traseiro Esquerdo",
    unit: "°C",
    device_class: "temperature",
  },
  2013022: {
    description: "Tempo de Carga",
    unit: "min",
    device_class: "duration",
  },
  2013023: {
    description: "Agendamento de Carga",
    device_class: "None",
  },
  2041142: {
    description: "Estado da Carga",
    device_class: "None",
  },
  2017002: {
    description: "Nível de Combustível",
    unit: "L",
    device_class: "volume",
  },
  2013005: {
  	description: "Estado de Carga 12V",
  	unit: '%',
    device_class: "battery"
  },
  // 2208001: {
  // 	description: "Estado da Trava (1: Destravar 0: Travar)",
  // 	unit: "-",
  // 	value: 0,
  // },
  // 2202001: {
  // 	description: "Estado do Ar Condicionado (1: Ligado 0: Desligado)",
  // 	unit: "null",
  // 	value: 0,
  // },
  // 2078020: {
  // 	description: "Filtragem do Ar do Cockpit (1: Ligado 0: Desligado)",
  // 	unit: "null",
  // 	value: 0,
  // },
  // 2206002: {
  // 	description: "Estado da Porta Dianteira Direita (1: Aberta 0: Fechada)",
  // 	unit: "-",
  // 	value: 0,
  // },
  // 2206004: {
  // 	description: "Estado da Porta Dianteira Esquerda (1: Aberta 0: Fechada)",
  // 	unit: "-",
  // 	value: 0,
  // },
  // 2206003: {
  // 	description: "Estado da Porta Traseira Direita (1: Aberta 0: Fechada)",
  // 	unit: "-",
  // 	value: 0,
  // },
  // 2206005: {
  // 	description: "Estado da Porta Traseira Esquerda (1: Aberta 0: Fechada)",
  // 	unit: "-",
  // 	value: 0,
  // },
  // 2206001: {
  // 	description: "Estado do Porta-Malas (1: Aberto 0: Fechado)",
  // 	unit: "-",
  // 	value: 0,
  // },
  // 2210001: {
  // 	description: "Posição do Vidro Dianteiro Direito (1: Fechado 0: Aberto)",
  // 	unit: "-",
  // 	value: 1,
  // },
  // 2210002: {
  // 	description: "Posição do Vidro Dianteiro Esquerdo (1: Fechado 0: Aberto)",
  // 	unit: "-",
  // 	value: 1,
  // },
  // 2210003: {
  // 	description: "Posição do Vidro Traseiro Direito (1: Fechado 0: Aberto)",
  // 	unit: "-",
  // 	value: 1,
  // },
  // 2210004: {
  // 	description: "Posição do Vidro Traseiro Esquerdo (1: Fechado 0: Aberto)",
  // 	unit: "-",
  // 	value: 1,
  // },
  // 2210005: {
  // 	description: "Posição do Teto Solar (6: Aberto 3: Fechado)",
  // 	unit: "-",
  // 	value: 1,
  // },
  // 2042082: {
  // 	description: "Estado do Controle de Carga (1: Conectado 0: Desconectado)",
  // 	unit: "null",
  // 	value: 0,
  // },
  // 2204007: {
  // 	description: "Estado do Farol (1: Ligado 0: Desligado)",
  // 	unit: "-",
  // 	value: 0,
  // },
  // 2204010: {
  // 	description: "Sinal de Setas Direita (1: Ligado 0: Desligado)",
  // 	unit: "-",
  // 	value: 0,
  // },
  // 2204009: {
  // 	description: "Sinal de Setas Esquerda (1: Ligado 0: Desligado)",
  // 	unit: "-",
  // 	value: 0,
  // },
  // 2310001: {
  // 	description: "Autorização do GPS (1: Autorizado 0: Não Autorizado)",
  // 	unit: "null",
  // 	value: 1,
  // },
  // 2102002: {
  // 	description: "Estado da Pressão do Pneu Dianteiro Direito",
  // 	unit: "-",
  // 	value: 0,
  // },
  // 2102001: {
  // 	description: "Estado da Pressão do Pneu Dianteiro Esquerdo",
  // 	unit: "-",
  // 	value: 0,
  // },
  // 2102004: {
  // 	description: "Estado da Pressão do Pneu Traseiro Direito",
  // 	unit: "-",
  // 	value: 0,
  // },
  // 2102003: {
  // 	description: "Estado da Pressão do Pneu Traseiro Esquerdo",
  // 	unit: "-",
  // 	value: 0,
  // },
  // 2102008: {
  // 	description: "Estado da Temperatura do Pneu Dianteiro Direito",
  // 	unit: "-",
  // 	value: 0,
  // },
  // 2102007: {
  // 	description: "Estado da Temperatura do Pneu Dianteiro Esquerdo",
  // 	unit: "-",
  // 	value: 0,
  // },
  // 2102010: {
  // 	description: "Estado da Temperatura do Pneu Traseiro Direito",
  // 	unit: "-",
  // 	value: 0,
  // },
  // 2102009: {
  // 	description: "Estado da Temperatura do Pneu Traseiro Esquerdo",
  // 	unit: "-",
  // 	value: 0,
  // },
  // 2210010: {
  // 	description: "Estado de Aprendizado do Vidro Dianteiro Direito",
  // 	unit: "-",
  // 	value: 1,
  // },
  // 2210011: {
  // 	description: "Estado de Aprendizado do Vidro Dianteiro Esquerdo",
  // 	unit: "-",
  // 	value: 1,
  // },
  // 2210012: {
  // 	description: "Estado de Aprendizado do Vidro Traseiro Direito",
  // 	unit: "-",
  // 	value: 1,
  // },
  // 2210013: {
  // 	description: "Estado de Aprendizado do Vidro Traseiro Esquerdo",
  // 	unit: "-",
  // 	value: 1,
  // },
  // 2222001: {
  // 	description: "Estado do Desembaçador Dianteiro (Não Funcionando)",
  // 	unit: "null",
  // 	value: 0,
  // },
  // 2210032: {
  // 	description: "Estado do Desembaçador Traseiro (Não Funcionando)",
  // 	unit: "null",
  // 	value: 0,
  // },
  // 2202099: {
  // 	description: "Estado do Purificador de Ar (Não Funcionando)",
  // 	unit: "null",
  // 	value: 0,
  // },
  // 2212001: {
  // 	description: "Estado do Capô (Não Funcionando)",
  // 	unit: "null",
  // 	value: 0,
  // },
  // 2201001: {
  // 	description: "Temperatura do Ambiente (Não Funcionando)",
  // 	unit: "null",
  // 	value: 0,
  // },
  // 2016001: {
  // 	description: "Desconhecido (Não Funcionando)",
  // 	unit: "-",
  // 	value: 0,
  // },
  // 2011002: {
  // 	description: "Desconhecido_Nao_Funcionando",
  // 	unit: "Km",
  // 	device_class: "distance",
  // },
};

module.exports = {
  configTopics,
};
