const axios = require("axios");
const { LogType, printLog } = require('./utils');

const { OPENAI_TOKEN, GEMINI_TOKEN, GEOCODE_API_KEY } = process.env;

const GptProfile = {
    VEHICLE_STATUS: `Você irá analisar um JSON com informações de status sobre um veículo. Para a pressão de pneus, sempre converta o valor recebido para psi ao invés de kPa.
Grande parte dos valores tem também seus atributos de estado, informando o que o elemento [value] significa. Alguns são auto-explicativos.

Considere alertar só e somente só se um dos critérios abaixo for atendido. Não repita o status ou informe se estiver tudo ok. Somente emita os alertas.
- A pressão de algum dos pneus estiver abaixo de 35 psi. Neste caso, informe também a temperatura do pneu em questão, que também será fornecida.
- Se o valor da "Quilometragem Total" estiver dentro da faixa de 2.000 acima ou abaixo de um múltiplo de 12.000 (12.000, 24.000, 36.000, 48.000, 60.000 e assim por diante), alerte para a revisão do veículo. Não alerte se a quilometragem não atender a estes critérios.
- Se o valor do "Nível de Combustível" estiver abaixo de 15 litros, notifique para que faça o abastecimento.
- Se o valor do "Estado de Carga 12V" estiver perto do nível de alerta ou do nível crítico (informados em elementos do próprio objeto), informe para que o veículo seja ligado para recarregar a bateria de baixa tensão ou bateria de 12 volts.
- Se o "Estado da Carga" for igual a [state_finished], mas o valor de "Estado de Controle de Carga" for igual a [state_connected], informe que a bateria de alta tensão do veículo já está totalmente carregada e que o carregador deve ser desconectado.
- Se o "Estado da Trava", "Porta-Malas", "Porta Dianteira Esquerda", "Porta Traseira Esquerda", "Porta Dianteira Direita" ou "Porta Traseira Direita" for igual ao seu respectivo valor [state_open], informe que a trava está destrancada ou que a respectiva porta está aberta.
- Se o "Estado do Ar Condicionado" ou "Estado do Purificador de Ar" for igual ao seu respectivo valor [state_on], informe que o ar-condicionado está ligado.`,
    LOCALIZATION: 'Ao receber dados de latitude e longitude, avalie se você pode retornar o endereço iniciando por "Seu veículo está próximo ao endereço {local}". Você também pode receber o endereço completo. Após, informe algo sobre a região, pesquisando na internet algo atual sobre o lugar, em um texto muito curto somente para dar contexto do local à quem pergunta. Se não conseguir encontrar o endereço, informe isto, mas não invente uma localização.', 
    REPHRASE: 'Reescreva o texto de forma a ser mais coeso e resumido, agregado e inteligível. Não utilize emojis e foque somente em saídas de texto.'
}

const UserMessages = {
        NO_ALERTS: "Não há alertas neste momento.",
        REVIEW_PREFIX: "Seu veículo está dentro do limite padrão de quilometragem para agendar a revisão.",
        ERROR_OPENAI_CALL: "---Erro ao chamar o assistente OpenAI---",
        ERROR_GEMINI_CALL: "---Erro ao chamar o assistente Gemini---",
        ERROR_FORMATTING_ADDRESS: "Erro ao formatar endereço.",
        ERROR_GENERATE_RESPONSE: "Desculpe, houve um erro ao gerar a resposta.",
        ALERT_HIGH_VOLTAGE_DISCONNECT: "A bateria de alta tensão do veículo já está totalmente carregada e o carregador deve ser desconectado.",
        VEHICLE_CHARGING_TIME: (mins) => {
                const minValue = parseInt(mins, 10);
                const startString  = "O veículo está carregando e o tempo aproximado para carga total é de ";
                if (minValue < 60) {
                        return `${startString}${minValue} minutos.`;
                } else {
                        const hours = Math.floor(minValue / 60);
                        const minutes = minValue % 60;
                        return `${startString}${hours}h${minutes > 0 ? ` e ${minutes}min` : ''}.`;
                }
        },
        WINDOW_OPEN: (desc) => `O ${desc} está aberto.`,
        SUNROOF_OPEN: "O teto solar está aberto.",
        DOOR_OPEN: (desc) => `A ${desc} está aberta.`,
        TRUNK_OPEN: (desc) => `O ${desc} está aberto.`,
        BATTERY_12V_CRITICAL: (val) => `Alerta: A carga da bateria de 12 volts está em ${val}%. Nível crítico! Ligue o motor o quanto antes para evitar a imobilização do veículo!`,
        BATTERY_12V_ALERT: (val) => `Atenção: A carga da bateria de 12 volts está em ${val}%. Nível de alerta.`,
        UNLOCKED: "A trava das portas não está acionada e o veículo pode ser aberto.",
        ENGINE_ON_AND_UNLOCKED: "O motor do carro está ligado e a trava das portas não está acionada. Verifique se o veículo não foi esquecido ligado.",
        FUEL_LOW: "Nível de combustível abaixo de 15 litros. Recomenda-se abastecer.",
        AC_ON_WITH_ENGINE_OFF: "O ar-condicionado ou a ventilação do veículo estão ligados. Verifique. O veículo não está ligado, isto pode drenar a bateria de 12 volts.",
        TIRE_PRESSURE: (desc, psi, tempValue, tempUnit, min, max) =>
                `A ${desc} está em ${psi} psi com temperatura de ${tempValue}${tempUnit}. A pressão dos pneus recomendada pela montadora é entre ${min} e ${max} psi.`,
        REVIEW_WITH_TOLERANCE: (tolerance) =>
                `Seu veículo está dentro do limite padrão de quilometragem para agendar a revisão. Você ainda tem ${tolerance} quilômetros de tolerância antes da perda da garantia caso ainda não tenha feito a revisão programada.`
};

async function getChatGPTResponse(agentProfile, request) {

        if(!OPENAI_TOKEN || request === UserMessages.NO_ALERTS || request.startsWith(UserMessages.REVIEW_PREFIX))
                return request;
        
        try {
            const token = OPENAI_TOKEN;
            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: agentProfile},
                        { role: 'user', content: request }
                    ],
                    max_tokens: 150
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
    
            return response.data.choices[0].message.content;
        } catch (error) {
            printLog(LogType.ERROR, UserMessages.ERROR_OPENAI_CALL, error);
            return UserMessages.ERROR_GENERATE_RESPONSE;
        }
}

async function getGeminiResponse(agentProfile, request) {

        if(!GEMINI_TOKEN || request === UserMessages.NO_ALERTS || request.startsWith(UserMessages.REVIEW_PREFIX))
                return request;

        const token = GEMINI_TOKEN;
        try {
                const prompt = `${agentProfile}

                                                ${request}`;

                const result = await axios.post(
                        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${token}`,
                        {
                                contents: [
                                { parts: [
                                        {text: prompt}
                                ] }
                                ]
                        },
                        {
                                headers: {
                                'Content-Type': 'application/json'
                                }
                        }
                        );

                return result.data.candidates[0].content.parts[0].text;
        } catch (error) {
                printLog(LogType.ERROR, UserMessages.ERROR_GEMINI_CALL, error);
                return UserMessages.ERROR_GENERATE_RESPONSE;
        }
}

function getVehicleStatusHardAnalysis(content){
        let statusMessage = [];
        const status = JSON.parse(content);

        if(status && status.vidro_dianteiro_esquerdo){
                if(status.estado_de_carga_soc){
                        if(status.estado_de_carga_soc.value === 100 && status.estado_da_carga.value !== status.estado_da_carga.state_disconnected)
                                statusMessage.push(UserMessages.ALERT_HIGH_VOLTAGE_DISCONNECT);
                        
                        if(status.estado_da_carga && status.estado_da_carga.value === status.estado_da_carga.state_charging && status.tempo_de_carga.value !== '1022')
                                statusMessage.push(UserMessages.VEHICLE_CHARGING_TIME(status.tempo_de_carga.value));
                }

                const checkWindowStatus = (windowStatus) => {
                        if (windowStatus.value !== windowStatus.state_closed) {
                                statusMessage.push(UserMessages.WINDOW_OPEN(windowStatus.description));
                        }
                };

                checkWindowStatus(status.vidro_dianteiro_esquerdo);
                checkWindowStatus(status.vidro_dianteiro_direito);
                checkWindowStatus(status.vidro_traseiro_esquerdo);
                checkWindowStatus(status.vidro_traseiro_direito);
                
                if(status.posicao_do_teto_solar && status.posicao_do_teto_solar.value !== status.posicao_do_teto_solar.state_closed)
                        statusMessage.push(UserMessages.SUNROOF_OPEN);


                const checkDoorStatus = (doorStatus) => {
                        if (doorStatus.value !== doorStatus.state_closed) {
                                statusMessage.push(UserMessages.DOOR_OPEN(doorStatus.description));
                        }
                };

                checkDoorStatus(status.porta_dianteira_direita);
                checkDoorStatus(status.porta_dianteira_esquerda);
                checkDoorStatus(status.porta_traseira_direita);
                checkDoorStatus(status.porta_traseira_esquerda);

                if(status.portamalas && status.portamalas.value !== status.portamalas.state_closed)
                        statusMessage.push(UserMessages.TRUNK_OPEN(status.portamalas.description));

                if(status.estado_de_carga_12v){
                        const carga12vValue = parseInt(status.estado_de_carga_12v.value, 10);
                        if (carga12vValue < parseInt(status.estado_de_carga_12v.critical_level, 10)) {
                                statusMessage.push(UserMessages.BATTERY_12V_CRITICAL(carga12vValue));
                        } else if (carga12vValue < parseInt(status.estado_de_carga_12v.alert_level, 10)) {
                                statusMessage.push(UserMessages.BATTERY_12V_ALERT(carga12vValue));
                        }
                }

                if(status.estado_da_trava && status.estado_da_trava.value === status.estado_da_trava.state_open)
                        statusMessage.push(UserMessages.UNLOCKED);

                if(status.estado_da_trava && status.estado_da_trava.value === status.estado_da_trava.state_open && status.estado_do_motor.value === status.estado_do_motor.state_on)
                        statusMessage.push(UserMessages.ENGINE_ON_AND_UNLOCKED);

                if(status.nivel_de_combustivel && parseInt(status.nivel_de_combustivel.value,10) <= 15)
                        statusMessage.push(UserMessages.FUEL_LOW);
                
                if(status.estado_do_ar_condicionado && status.estado_do_ar_condicionado.value === status.estado_do_ar_condicionado.state_on && status.estado_do_motor.value === status.estado_do_motor.state_off)
                        statusMessage.push(UserMessages.AC_ON_WITH_ENGINE_OFF);

                const checkTirePressure = (tirePressure, tireTemperature) => {
                        const psiPressure = Math.floor(parseInt(tirePressure.value) * 0.145038);
                        if (psiPressure < tirePressure.pressure_threshold_min || psiPressure > tirePressure.pressure_threshold_max) {
                                statusMessage.push(UserMessages.TIRE_PRESSURE(tirePressure.description, psiPressure, tireTemperature.value, tireTemperature.unit, tirePressure.pressure_threshold_min, tirePressure.pressure_threshold_max));
                        }
                };

                checkTirePressure(status.pressao_do_pneu_dianteiro_direito, status.temperatura_do_pneu_dianteiro_direito);
                checkTirePressure(status.pressao_do_pneu_dianteiro_esquerdo, status.temperatura_do_pneu_dianteiro_esquerdo);
                checkTirePressure(status.pressao_do_pneu_traseiro_esquerdo, status.temperatura_do_pneu_traseiro_esquerdo);
                checkTirePressure(status.pressao_do_pneu_traseiro_direito, status.temperatura_do_pneu_traseiro_direito);

                if(status.quilometragem_total){
                        let km = status.quilometragem_total.value;
                        if((km % 12000 >= 11000) || (km % 12000 > 0 && km % 12000 < 1000)) {
                                const tolerance = km % 12000 >= 1000 ? 13000 - km % 12000 : 1000 - km % 12000;
                                statusMessage.push(UserMessages.REVIEW_WITH_TOLERANCE(tolerance));
                        }
                }
        }

        if (statusMessage.length === 0)
                statusMessage.push(UserMessages.NO_ALERTS);

        return statusMessage.join("\n");
}

async function getformattedAddress(latitude, longitude) {
        let formatted_address = '';
        if(GEOCODE_API_KEY){
                const geocodeData = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?language=pt-BR&location_type=ROOFTOP&latlng=${latitude},${longitude}&key=${GEOCODE_API_KEY}`);
                
                try{
                        if(geocodeData){
                                formatted_address = geocodeData.data.results[0].formatted_address.toString().replace(', Brasil','');
                        }
                }
                catch{
                        printLog(LogType.ERROR, UserMessages.ERROR_FORMATTING_ADDRESS);
                        if(geocodeData && geocodeData.data && geocodeData.data.error_message)
                                printLog(LogType.ERROR, geocodeData.data.error_message);
                }
        }
        return formatted_address;
}

module.exports = { getChatGPTResponse, getGeminiResponse, getVehicleStatusHardAnalysis, GptProfile, getformattedAddress, UserMessages };