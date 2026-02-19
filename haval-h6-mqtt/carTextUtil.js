const axios = require("axios");
const { LogType, printLog } = require('./utils');

const UserMessages = (type) => ({
        NO_ALERTS: type === "text" ? "Não há alertas neste momento." : "NO_ALERTS",        
        ERR_FORMATTING_ADDRESS: type === "text" ? "Erro ao formatar endereço." : "ERR_FORMATTING_ADDRESS",
        ERR_GENERATE_RESPONSE: type === "text" ? "Desculpe, houve um erro ao gerar a resposta." : "ERR_GENERATE_RESPONSE",
        ALERT_HIGH_VOLTAGE_DISCONNECT: type === "text" ? "A bateria de alta tensão do veículo já está totalmente carregada e o carregador deve ser desconectado." : "ALERT_HIGH_VOLTAGE_DISCONNECT",
        SUNROOF_OPEN: type === "text" ? "O teto solar está aberto." : "SUNROOF_OPEN",
        UNLOCKED: type === "text" ? "A trava das portas não está acionada e o veículo pode ser aberto." : "UNLOCKED",
        ENGINE_ON_AND_UNLOCKED: type === "text" ? "O motor do carro está ligado e a trava das portas não está acionada. Verifique se o veículo não foi esquecido ligado." : "ENGINE_ON_AND_UNLOCKED",
        FUEL_LOW: type === "text" ? "Nível de combustível abaixo de 15 litros. Recomenda-se abastecer." : "FUEL_LOW",
        AC_ON_WITH_ENGINE_OFF: type === "text" ? "O ar-condicionado ou a ventilação do veículo estão ligados. Verifique. O veículo não está ligado, isto pode drenar a bateria de 12 volts." : "AC_ON_WITH_ENGINE_OFF",
        SERVICE_PREFIX: type === "text" ? "Seu veículo está dentro do limite padrão de quilometragem para agendar a revisão." : "REVIEW_PREFIX",

        VEHICLE_CHARGING_TIME: (mins) => {
            const minuteValue = parseInt(mins, 10);
            const hours = Math.floor(minuteValue / 60);
            const minutes = minuteValue % 60;

            if (type === "text") {              
              const startString  = "O veículo está carregando e o tempo aproximado para carga total é de ";
              if (minuteValue < 60) {
                  return `${startString}${minuteValue} minutos.`;
              } else {                  
                  return `${startString}${hours}h${minutes > 0 ? ` e ${minutes}min` : ''}.`;
              }
            }
            else if (type === "code") return `VEHICLE_CHARGING_TIME@${minuteValue < 60 ? `${minuteValue}min` : `${hours}h${minutes > 0 ? ` e ${minutes}min` : ''}`}`;
        },
        WINDOW_OPEN: (desc) => type === "code" ? `WINDOW_OPEN@${desc}` : `O ${desc} está aberto.`,
        DOOR_OPEN: (desc) => type === "code" ? `DOOR_OPEN@${desc}` : `A ${desc} está aberta.`,
        TRUNK_OPEN: (desc) => type === "code" ? `TRUNK_OPEN@${desc}` : `O ${desc} está aberto.`,
        BATTERY_12V_CRITICAL: (val) => type === "code" ? `BATTERY_12V_CRITICAL@${val}` : `Alerta: A carga da bateria de 12 volts está em ${val}%. Nível crítico! Ligue o motor o quanto antes para evitar a imobilização do veículo!`,
        BATTERY_12V_ALERT: (val) => type === "code" ? `BATTERY_12V_ALERT@${val}` : `Atenção: A carga da bateria de 12 volts está em ${val}%. Nível de alerta.`,
        TIRE_PRESSURE: (desc, psi, tempValue, tempUnit) =>
                type === "code" ? `TIRE_PRESSURE@${desc}@${psi}@${tempValue}${tempUnit}` : `A ${desc} está em ${psi} psi com temperatura de ${tempValue}${tempUnit}.`,
        TIRE_PRESSURE_DEFAULTS: (min, max) => type === "code" ? `TIRE_PRESSURE_DEFAULTS@${min}@${max}` : `A pressão dos pneus recomendada pela montadora é entre ${min} e ${max} psi.`,
        SERVICE_WITH_TOLERANCE: (tolerance) => type === "code" ? `SERVICE_WITH_TOLERANCE@${tolerance}` : `Veículo no limite para revisão. Restam ${tolerance} km antes da perda da garantia.`
});

function getVehicleStatusHardAnalysis(content){
        let statusMessage = [];
        const status = JSON.parse(content);
        const msgs = UserMessages("code");

        if(status && status.vidro_dianteiro_esquerdo){
                if(status.estado_de_carga_soc){
                        if(status.estado_de_carga_soc.value === 100 && status.estado_da_carga.value !== status.estado_da_carga.state_disconnected)
                                statusMessage.push(msgs.ALERT_HIGH_VOLTAGE_DISCONNECT);
                        
                        if(status.estado_da_carga && status.estado_da_carga.value === status.estado_da_carga.state_charging && status.tempo_de_carga.value !== '1022')
                                statusMessage.push(msgs.VEHICLE_CHARGING_TIME(status.tempo_de_carga.value));
                }

                const checkWindowStatus = (windowStatus) => {
                        if (windowStatus.value !== windowStatus.state_closed) {
                                statusMessage.push(msgs.WINDOW_OPEN(windowStatus.description));
                        }
                };

                checkWindowStatus(status.vidro_dianteiro_esquerdo);
                checkWindowStatus(status.vidro_dianteiro_direito);
                checkWindowStatus(status.vidro_traseiro_esquerdo);
                checkWindowStatus(status.vidro_traseiro_direito);
                
                if(status.posicao_do_teto_solar && status.posicao_do_teto_solar.value !== status.posicao_do_teto_solar.state_closed)
                        statusMessage.push(msgs.SUNROOF_OPEN);

                const checkDoorStatus = (doorStatus) => {
                        if (doorStatus.value !== doorStatus.state_closed) {
                                statusMessage.push(msgs.DOOR_OPEN(doorStatus.description));
                        }
                };

                checkDoorStatus(status.porta_dianteira_direita);
                checkDoorStatus(status.porta_dianteira_esquerda);
                checkDoorStatus(status.porta_traseira_direita);
                checkDoorStatus(status.porta_traseira_esquerda);

                if(status.portamalas && status.portamalas.value !== status.portamalas.state_closed)
                        statusMessage.push(msgs.TRUNK_OPEN(status.portamalas.description));

                if(status.estado_de_carga_12v){
                        const carga12vValue = parseInt(status.estado_de_carga_12v.value, 10);
                        if (carga12vValue < parseInt(status.estado_de_carga_12v.critical_level, 10)) {
                                statusMessage.push(msgs.BATTERY_12V_CRITICAL(carga12vValue));
                        } else if (carga12vValue < parseInt(status.estado_de_carga_12v.alert_level, 10)) {
                                statusMessage.push(msgs.BATTERY_12V_ALERT(carga12vValue));
                        }
                }

                if(status.estado_da_trava && status.estado_da_trava.value === status.estado_da_trava.state_open)
                        statusMessage.push(msgs.UNLOCKED);

                if(status.estado_da_trava && status.estado_da_trava.value === status.estado_da_trava.state_open && status.estado_do_motor.value === status.estado_do_motor.state_on)
                        statusMessage.push(msgs.ENGINE_ON_AND_UNLOCKED);

                if(status.nivel_de_combustivel && parseInt(status.nivel_de_combustivel.value,10) <= 15)
                        statusMessage.push(msgs.FUEL_LOW);
                
                if(status.estado_do_ar_condicionado && status.estado_do_ar_condicionado.value === status.estado_do_ar_condicionado.state_on && status.estado_do_motor.value === status.estado_do_motor.state_off)
                        statusMessage.push(msgs.AC_ON_WITH_ENGINE_OFF);

                let tireAlertCount = 0;
                const checkTirePressure = (tirePressure, tireTemperature) => {
                        const psiPressure = Math.floor(parseInt(tirePressure.value) * 0.145038);
                        if (psiPressure < tirePressure.pressure_threshold_min || psiPressure > tirePressure.pressure_threshold_max) {
                                statusMessage.push(msgs.TIRE_PRESSURE(tirePressure.description, psiPressure, tireTemperature.value, tireTemperature.unit));
                                tireAlertCount++;
                        }
                };

                checkTirePressure(status.pressao_do_pneu_dianteiro_direito, status.temperatura_do_pneu_dianteiro_direito);
                checkTirePressure(status.pressao_do_pneu_dianteiro_esquerdo, status.temperatura_do_pneu_dianteiro_esquerdo);
                checkTirePressure(status.pressao_do_pneu_traseiro_esquerdo, status.temperatura_do_pneu_traseiro_esquerdo);
                checkTirePressure(status.pressao_do_pneu_traseiro_direito, status.temperatura_do_pneu_traseiro_direito);

                if(tireAlertCount > 0) {
                        statusMessage.push(msgs.TIRE_PRESSURE_DEFAULTS(status.pressao_do_pneu_dianteiro_direito.pressure_threshold_min, status.pressao_do_pneu_dianteiro_direito.pressure_threshold_max));
                }

                if(status.quilometragem_total){
                        let km = status.quilometragem_total.value;
                        if((km % 12000 >= 11000) || (km % 12000 > 0 && km % 12000 < 1000)) {
                                const tolerance = km % 12000 >= 1000 ? 13000 - km % 12000 : 1000 - km % 12000;
                                statusMessage.push(msgs.SERVICE_WITH_TOLERANCE(tolerance));
                        }
                }
        }

        if (statusMessage.length === 0)
                statusMessage.push(msgs.NO_ALERTS);

        return statusMessage.join("\n");
}

async function getformattedAddress(lat, lon) {
        const endpoint = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
        
        try {
          const response = await axios.get(endpoint, { headers: {"User-Agent": "haval-mqtt"} });  
          const address = response?.data?.address;  
          if (!address) return null;
  
          const parts = [];  
          if (address.road) parts.push(address.road); else if (response?.data?.name) parts.push(data.name);
          if (address.suburb) parts.push(address.suburb);
          if (address.city_district) parts.push(address.city_district);
          if (address.city) parts.push(address.city);
          if (address.postcode) parts.push(address.postcode);
  
          return parts.join(", ");
        }
        catch (e) {
          printLog(LogType.ERROR, UserMessages("text").ERR_FORMATTING_ADDRESS);
          return null;
        }
}

module.exports = { getVehicleStatusHardAnalysis, getformattedAddress, UserMessages };