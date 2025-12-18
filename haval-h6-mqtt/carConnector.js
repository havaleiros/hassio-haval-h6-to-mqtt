const fs = require("fs");
const axios = require("axios");
const https = require("https");
const md5 = require("md5");
const slugify = require("slugify");
const storage = require("./storage");
const carTextUtil = require("./carTextUtil");
const { isTokenExpired, LogType, printLog, formatMessage } = require('./utils');
const { sensorTopics } = require("./map");
const { error } = require("console");

const { USERNAME, PASSWORD, PIN } = process.env;

const Actions = {
    Doors: { OPEN: "1", CLOSE: "2" },
    Windows: { OPEN: "3", CLOSE: "0" },
    SkyWindow: { OPEN: "10", CLOSE: "0" },
    AirCon: { TURN_ON: "1", TURN_OFF: "2" },
    Engine: { TURN_ON: "1", TURN_OFF: "2" },
};

const States = {
    Doors: { OPEN: "1", CLOSED: "0" },
    Windows: { OPEN: "2", PARTIALLY_OPEN: "3", CLOSED: "0" },
    SkyWindow: { CLOSED: "3" },
    AirCon: { ON: "1", OFF: "0" },
    Engine: { ON: "1", OFF: "0" },
};

const Options = {
    Doors: { DOORS: "Doors", TRUNK: "Trunk" },
    Windows: { WINDOWS: "Windows", SKYWINDOW: "SkyWindow" },
    AirCon: { AIRCONDITIONING: "AirConditioning", HEATEDSEATS: "HeatedSeats", STEERINGWHEELHEAT: "SteeringWheelHeat", WINDSHIELDHEAT: "WindshieldHeat", UVC: "UVC", SEATVENTILATION: "SeatVentilation" },
};

const Endpoints = {
    apiVehicle: "https://br-app-gateway.gwmcloud.com/app-api/api/v1.0",
    apiLogin: "https://br-front-service.gwmcloud.com/br-official-commerce/br-official-gateway/pc-api/api/v1.0/userAuth/loginAccount"
};

const UserMessages = {
    PIN_NOT_CONFIGURED: "PIN para comandos remotos não configurado. Não é possível executar comandos sem o PIN configurado no aplicativo MY GWM.",
    COMMAND_ALREADY_EXECUTING: "O comando remoto \"{{description}}\" ainda está em execução. Por favor, aguarde seu término antes de solicitar um novo comando.",
    COMMAND_SUCCESS: "Comando remoto para {{functionName}} enviado com sucesso.",
    COMMAND_FAILED: "Falha no acionamento do comando remoto para {{functionName}}. Por favor, tente novamente ou reporte o erro na comunidade.",
    SYSTEM_BUSY: "Já há um comando remoto em execução e o sistema está ocupado. Aguarde e tente novamente em breve.",
    COMMAND_NOT_EXECUTED: "Comando remoto para {{functionName}} não executado. Já é o estado atual e não há como executar novamente.",
    VEHICLE_LOCKED_REQUIRED: "O comando de {{functionName}} somente pode ser executado se o veículo estiver trancado. Por favor, tranque-o antes de executar este comando.",    
    CHARGING_SCHEDULE_REVERSAL: "Reversão da solução de contorno para paralizar o carregamento solicitado com sucesso.",
    ERROR_SENDING_COMMAND: "Ocorreu um erro ao enviar o comando para o veículo.",
    ERROR_RETRIEVING_CAR_DATA: "Erro ao obter as informações do veículo",
    ERROR_EXECUTING_COMMAND: "Ocorreu um erro no acionamento {{preposition}} {{functionName}}.",
    ERROR_STOPPING_CHARGING: "Erro ao parar o carregamento do veículo.",
    ERROR_SETTING_CHARGING: "Erro ao criar um agendamento de carregamento.",
    ERROR_AUTHENTICATION: "Erro de autenticação. Por favor, verifique suas credenciais.",
    ERROR_AUTHENTICATION_LOG: "Erro de autenticação",
    ERROR_RETRIEVING_CAR_DATA: "Erro ao obter os dados do veículo.",
    ERROR_RETRIEVING_CAR_LIST: "Erro ao obter a lista de veículos registrados.",
    ERROR_RETRIEVING_CAR_STATUS: "Erro ao obter o status do veículo.",
    ERROR_RETRIEVING_COMMAND_STATUS: "Erro ao obter o status do último comando.",
    ERROR_FORMATTING_ADDRESS: "Não foi possível definir o endereço formatado para a localização atual.", 
    ERROR_READING_CERTIFICATES: "Erro ao ler os arquivos de certificado.",
    ERROR_RETRIEVING_CHARGING_LOGS: "Erro ao obter os registros de recarga.",
    UNKNOWN_COMMAND: "Comando desconhecido",    
};

const Services = {
    engineHev: { code: "0x37", description: "Hybrid Engine Control" },
    awayMode: { code: "0x35", description: "Away Mode Activation" },
    chargIn: { code: "0x01", description: "Carregamento" },
    diagnose: { code: "0x02", description: "Diagnóstico do veículo" },
    engine: { code: "0x03", description: "Acionamento do motor" },
    airCon: { code: "0x04", description: "Controle do ar condicionado" },
    lockCmdCode: { code: "0x05", description: "Controle de trava das portas" },
    searching: { code: "0x06", description: "Encontrar veículo" },
    light: { code: "0x07", description: "Controle de luzes" },
    window: { code: "0x08", description: "Controle das janelas" },
    backdoor: { code: "0x09", description: "Controle do porta-malas" },
    batPreheat: { code: "0x10", description: "Pré-aquecimento da bateria" },
    pluggedIn: { code: "0x18", description: "Status de carregamento" },
    activeHeat: { code: "0x18", description: "Aquecimento ativo" },
    cabinClean: { code: "0x11", description: "Limpeza do ar da cabine" },
    idleCharging: { code: "0x12", description: "Controle de espera de carregamento" },
    seat: { code: "0x0A", description: "Controle de ventilação e aquecimento dos bancos" },
    defrostCode: { code: "0x0B", description: "Controle de degelo" },
    clearAir: { code: "0x0C", description: "Controle de purificação do ar" },
    locationAuthorization: { code: "0xCF", description: "Autorização de localização" },
    removeWarning: { code: "0x16", description: "Remover avisos" },
    steeringWheelHeat: { code: "0x19", description: "Aquecimento do volante" },
    acFrontWinHeat: { code: "0x2A", description: "Aquecimento do para-brisas" },
    acUVCDisinfectionLight: { code: "0x25", description: "Luz de desinfecção UV" },
    chargingControl: { code: "0x01", description: "Controle de carregamento" },
    uvSanitizer: { code: "0x1F", description: "Sanitizador UV" },
    slindingDoor: { code: "0x22", description: "Controle da porta deslizante" },
};

async function auth() {
  let { accessToken, refreshToken } = "";

  accessToken = storage.getItem("accessToken");
  refreshToken = storage.getItem("refreshToken");

  if (accessToken && !isTokenExpired(accessToken))
    return { accessToken, refreshToken };

  const deviceid = storage.getItem("deviceid") ? storage.getItem("deviceid") : md5(Math.random().toString());
  storage.setItem("deviceid", deviceid);

  const params = { deviceid, password: md5(PASSWORD), account: USERNAME };

  const userHeaders = {
    appid: "6",
    brand: "6",
    brandid: "CCZ001",
    country: "BR",
    devicetype: "0",
    enterpriseid: "CC01",
    gwid: "",
    language: "pt_BR",
    rs: "5",
    terminal: "GW_PC_GWM",
  };
  
  try {
    const { data } = await axios.post(Endpoints.apiLogin, params, { headers: userHeaders });

    if (data.description === "SUCCESS") {
      Object.keys(data.data).forEach((key) => {
        if(key === "accessToken")
            accessToken = data.data[key];

        if(key === "refreshToken")
            refreshToken = data.data[key];
      });
      return { accessToken, refreshToken };
    }
    throw data;
  } catch (err) {
    printLog(LogType.ERROR, `---${UserMessages.ERROR_AUTHENTICATION_LOG}---`, err);
    throw new Error(UserMessages.ERROR_AUTHENTICATION);
  }
};

let headers = {}

async function updateHeaders() {
    if (headers.accessToken && axios.defaults.httpsAgent)
        return;
    let { certData, certKey, ca } = "";
    try {
        certData = fs.readFileSync("./certs/gwm_general.cer", { encoding: "utf8" });
        certKey = fs.readFileSync("./certs/gwm_general.key", { encoding: "utf8" });
        ca = fs.readFileSync("./certs/gwm_root.cer", { encoding: "utf8" });
    }
    catch (error) {
        printLog(LogType.ERROR, UserMessages.ERROR_READING_CERTIFICATES, error);
        return null;
    }

    const httpsAgent = new https.Agent({
        cert: certData,
        ca: ca,
        key: certKey,
        rejectUnauthorized: false,
        ciphers: "DEFAULT:@SECLEVEL=0",
    });

    axios.defaults.httpsAgent = httpsAgent;

    const { accessToken, refreshToken } = await auth();

    headers = {
        rs: "2",
        terminal: "GW_APP_GWM",
        brand: "6",
        language: "pt_BR",
        systemtype: "2",
        regioncode: "BR",
        country: "BR",
        accessToken: accessToken,
        refreshToken: refreshToken
    };
}

async function getLastCommandResult(seqNo, vin) {
    try {
        const { data } = await axios.get(
            `${Endpoints.apiVehicle}/vehicle/getRemoteCtrlResultT5?seqNo=${seqNo}&vin=${vin}`,
            { headers }
        );

        if (data && data.data && data.description === "SUCCESS") {
            return {
                remoteType: data.data[0].remoteType,
                resultCode: data.data[0].resultCode,
            };
        }
        return null;
    } catch (e) {
        printLog(LogType.ERROR, `---${UserMessages.ERROR_RETRIEVING_COMMAND_STATUS}---`, e);
        return null;
    }
}

async function sendCmd (instructions, vin) {
    try {
        if(PIN === undefined)
            return { code:"9999", description: UserMessages.PIN_NOT_CONFIGURED }

        const currentTime = Date.now();
        const _timeout = 60000;

        let lastCommands = {};
        try {
            lastCommands = JSON.parse(storage.getItem("lastCommands") || "{}");
        } catch (e) {
            lastCommands = {};
        }
        if (!lastCommands[vin])
            lastCommands[vin] = { seqNo: null, timestamp: null };

        const lastCommand = lastCommands[vin];

        if (lastCommand.seqNo && (currentTime - lastCommand.timestamp) < _timeout) {
            let lastResult = {};
            lastResult = await getLastCommandResult(lastCommand.seqNo, vin);

            if (lastResult) {
                if(!['6', '10'].includes(lastResult.resultCode)) {
                    const service = Object.values(Services).find(s => s.code === lastResult.remoteType);
                    const description = service ? service.description : UserMessages.UNKNOWN_COMMAND;
                    return {
                        result: false,
                        message: formatMessage(UserMessages.COMMAND_ALREADY_EXECUTING, {description}),
                        running: true
                    };
                }
            }
        }

        const seqNo = require('crypto').randomUUID().replaceAll('-', '') + '1234';
        lastCommands[vin] = { seqNo, timestamp: currentTime };
        storage.setItem("lastCommands", JSON.stringify(lastCommands));

        const options = { headers };    
        const remoteType = 0;
        const securityPassword = md5(PIN);
        const type = 2;

        await updateHeaders();

        const res = await axios.post(
            `${Endpoints.apiVehicle}/vehicle/T5/sendCmd`,
            {
                instructions,
                remoteType, 
                securityPassword,
                seqNo,
                type,
                vin
            },
            options
        );

        return res.data;
    } catch (err) {
        printLog(LogType.ERROR, `---${UserMessages.ERROR_SENDING_COMMAND}---`, err);
        return {
            result: false,
            message: UserMessages.ERROR_SENDING_COMMAND
        };
    }
};

async function chargingSchedule(enable, vin) {
    try {
        if(PIN === undefined)
            return { code:"9999", description: UserMessages.PIN_NOT_CONFIGURED }
    
        const seqNo = require('crypto').randomUUID().replaceAll('-', '') + '1234';  
        const startTimeAdd = 5 * 60 * 1000;
        const endTimeAdd = 6 * 60 * 1000;
        const startTime = new Date().getTime() + startTimeAdd;
        const endTime = new Date().getTime() + endTimeAdd;
    
        let options = {
        headers,
        };   
    
        const body = {
            enable: enable,
            startTime: enable ? startTime : "",
            endTime: enable ? endTime : "",
            seqNo: seqNo,
            planType: "1",
            vin: vin
        };
    
        const res = await axios.post(
            `${Endpoints.apiVehicle}/vehicleCharge/setChargingPlan?vin=${vin}`,
            body,
            options
        );
    
        return res.data;
    } catch (e) {
        printLog(LogType.ERROR, `---${UserMessages.ERROR_SETTING_CHARGING}---`, e);
        return false;
    }
}

function apiReturnHandle(returnData, functionName){
    if(returnData && returnData.description === "SUCCESS") {
        return { result: true, message: formatMessage(UserMessages.COMMAND_SUCCESS, {functionName: functionName.toString()}) };
    }
    else if(returnData) {
        if(returnData.running === true){
            return { result: false, message: returnData.message};
        }
        if(returnData.code && returnData.code === "REMOTE250502"){
            return { result: false, message: UserMessages.SYSTEM_BUSY};
        }
        if(returnData.result === false){
            printLog(LogType.ERROR, `---${formatMessage(UserMessages.ERROR_EXECUTING_COMMAND, {preposition: "de", functionName: functionName.toString()})}--- `, returnData);
            return { result: false, message: returnData.message, error: true};
        }
    }
    else{
        let errorCode = "";
        if(returnData.code)
            errorCode = returnData.code;
        printLog(LogType.INFO, `---${formatMessage(UserMessages.ERROR_EXECUTING_COMMAND, {preposition: "de", functionName: functionName.toString()})}---`, errorCode);
        return { result: false, message: formatMessage(UserMessages.COMMAND_FAILED, {preposition: "de", functionName: functionName.toString()}), error: true};
    }
}

const carData = {
    async getCarList() {
        try {
            await updateHeaders();
            return await axios.get(`${Endpoints.apiVehicle}/globalapp/vehicle/acquireVehicles`, { headers });
            
        } catch(e) {
            printLog(LogType.ERROR, `---${UserMessages.ERROR_RETRIEVING_CAR_DATA}---`, e.Message);
        }
    },
    async getCarInfo(vin) {
        try {
            await updateHeaders();
            const { data } = await axios.get(`${Endpoints.apiVehicle}/vehicle/getLastStatus?vin=${String(vin).toUpperCase()}&flag=true`, { headers });
            return data.data;
        } catch (e) {
            printLog(LogType.ERROR, `---${UserMessages.ERROR_RETRIEVING_CAR_LIST}---`, e.Message);
        }
    },    
    async getStatus(vin) {        
        try{
            await updateHeaders();
            const data = await carData.getCarInfo(vin);

            let status = {};

            if (data && data.items) {
                data.items.forEach(({ code, value }) => {
                    if (sensorTopics.hasOwnProperty(code)) {
                        const topicInfo = sensorTopics[code];
                        status[slugify(topicInfo.description.replace(/[\(\)-]/g, '').toLowerCase(), "_")] = {
                            ...topicInfo,
                            value: value
                        };
                    }
                });

                if(data.hasOwnProperty("hyEngSts")) {
                    const topicInfo = {
                                        code: "hyEngSts",
                                        description: "Estado do Motor",
                                        entity_type: "sensor",
                                        value: `${data.hyEngSts ? data.hyEngSts : '0'}`,
                                        icon: "mdi:engine",
                                        state_on: "1",
                                        state_off: "0"
                                      };
                    status[slugify(topicInfo.description.replace(/[\(\)-]/g, '').toLowerCase(), "_")] = { 
                        ...topicInfo, 
                        value: `${data.hyEngSts}` 
                    };
                }
            }
            return status;
        }catch(e){
            printLog(LogType.ERROR, `---${UserMessages.ERROR_RETRIEVING_CAR_STATUS}---`, e);
            return UserMessages.ERROR_RETRIEVING_CAR_STATUS
        }
    },
    async getChargingLogs(vin) {
      try {
        await updateHeaders();

        const body = {
          vin: vin.toUpperCase(),
          pageNum: "1",
          pageSize: "100",
          continuation: "0"    
        };
    
        const chargingLogs = await axios.post(`${Endpoints.apiVehicle}/vehicleCharge/getChargeLogs`, body, { headers });
        
        if(chargingLogs && chargingLogs.data && chargingLogs.data.data.list && chargingLogs.data.data.list.length > 0) {
          const formattedList = chargingLogs.data.data.list.map(({ startTime, endTime }) => {
            const startDate = new Date(startTime).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', });
            const endDate = new Date(endTime).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', });
          
            const startTimeFormatted = new Date(startTime).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', });
            const endTimeFormatted = new Date(endTime).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', });
          
            return `${startDate} ${startTimeFormatted} ~ ${endDate} ${endTimeFormatted}`;
          });
          
          return formattedList;
        }
        else
          return "";

      } catch (e) {
        printLog(LogType.ERROR, `---${UserMessages.ERROR_RETRIEVING_CHARGING_LOGS}---`, e.message);
        return "";
      }
    }
}

const carUtil = {
    async airConditioner(action, vin) {
        const actualStatus = await carData.getStatus(vin);
        let airConAction = "";

        if(actualStatus && actualStatus["estado_do_ar_condicionado"]){
            if((action === Actions.AirCon.TURN_OFF && actualStatus["estado_do_ar_condicionado"].value === States.AirCon.OFF)
             ||(action === Actions.AirCon.TURN_ON  && actualStatus["estado_do_ar_condicionado"].value === States.AirCon.ON)){
                return { result: false, message: formatMessage(UserMessages.COMMAND_NOT_EXECUTED, {functionName: "ar-condicionado"})};
            }
            if(actualStatus["estado_da_trava"].value !== States.Doors.CLOSED) {
                return { result: false, message: formatMessage(UserMessages.VEHICLE_LOCKED_REQUIRED, {functionName: "ar-condicionado"})};
            }
            airConAction = action;
        }
        else
            airConAction = Actions.AirCon.TURN_OFF;

        try{
            const acData = await sendCmd({
                                          [Services.airCon.code]: {
                                              "airConditioner": {
                                                  "operationTime": "15",
                                                  "switchOrder": airConAction,
                                                  "temperature": "18"
                                              }
                                          }
                                         }, vin);

            return apiReturnHandle(acData, "ar-condicionado");
        }catch(e){
            printLog(LogType.ERROR, formatMessage(UserMessages.ERROR_EXECUTING_COMMAND, {preposition: "do",  functionName: "ar-condicionado" }), e);
            return { result: false, message: formatMessage(UserMessages.ERROR_EXECUTING_COMMAND, {preposition: "do",  functionName: "ar-condicionado" }) };
        }
    },
    async engine(action, vin) {
        const actualStatus = await carData.getStatus(vin);
        if(actualStatus["estado_da_trava"].value !== States.Doors.CLOSED) {
            return { result: false, message: formatMessage(UserMessages.VEHICLE_LOCKED_REQUIRED, {functionName: "motor"})};
        }

        if((action === Actions.Engine.TURN_OFF && actualStatus["estado_do_motor"].value === States.Engine.OFF)
         ||(action === Actions.Engine.TURN_ON  && actualStatus["estado_do_motor"].value === States.Engine.ON)){
            return { result: false, message: formatMessage(UserMessages.COMMAND_NOT_EXECUTED, {functionName: "motor"})};
        }

        try{
            const engineData = await sendCmd({
                                          [Services.engine.code]: {
                                              "operationTime": "15",
                                              "switchOrder": action
                                          }
                                         }, vin);

            return apiReturnHandle(engineData, "motor");
        }catch(e){
            printLog(LogType.ERROR, formatMessage(UserMessages.ERROR_EXECUTING_COMMAND, {preposition: "do",  functionName: "motor" }), e);
            return { result: false, message: formatMessage(UserMessages.ERROR_EXECUTING_COMMAND, {preposition: "do",  functionName: "motor" }), error: true };
        }
    },
    async windows_skyWindow(action, windowsOption, vin) {
        const actualStatus = await carData.getStatus(vin);
        let windowsAction = "";
        let skyWindowAction = "";

        if(windowsOption === Options.Windows.WINDOWS){
            if(actualStatus 
               && actualStatus["vidro_dianteiro_esquerdo"]
               && actualStatus["vidro_dianteiro_direito"]
               && actualStatus["vidro_traseiro_esquerdo"]
               && actualStatus["vidro_traseiro_direito"]) {

                const actualWindowsState =  actualStatus["vidro_dianteiro_esquerdo"].value
                                          + actualStatus["vidro_dianteiro_direito"].value
                                          + actualStatus["vidro_traseiro_esquerdo"].value
                                          + actualStatus["vidro_traseiro_direito"].value;

                if ((action === Actions.Windows.CLOSE && !actualWindowsState.includes(States.Windows.OPEN) && !actualWindowsState.includes(States.Windows.PARTIALLY_OPEN))
                  ||(action === Actions.Windows.OPEN  && actualWindowsState.includes(States.Windows.CLOSED))){
                    return { result: false, message: formatMessage(UserMessages.COMMAND_NOT_EXECUTED, {functionName: "janelas"})};
                }

                windowsAction = action;

                windowsAction = actualWindowsState.includes(States.Windows.OPEN) || actualWindowsState.includes(States.Windows.PARTIALLY_OPEN) ? Actions.Windows.CLOSE : Actions.Windows.OPEN;
            }
            else
                windowsAction = Actions.Windows.CLOSE;
        }        

        if(windowsOption === Options.Windows.SKYWINDOW){
            if(actualStatus && actualStatus["posicao_do_teto_solar"]){
                if ((action === Actions.SkyWindow.CLOSE && actualStatus["posicao_do_teto_solar"].value === States.SkyWindow.CLOSED)
                  ||(action === Actions.SkyWindow.OPEN  && actualStatus["posicao_do_teto_solar"].value !== States.SkyWindow.CLOSED)){
                    return { result: false, message: formatMessage(UserMessages.COMMAND_NOT_EXECUTED, {functionName: "teto solar"})};
                }
                skyWindowAction = action;
            }
            else
                skyWindowAction = Actions.SkyWindow.CLOSE;
        }

        try{
            const windowData = await sendCmd({
                                              [Services.window.code]: {
                                                  "switchOrder": "0",
                                                  "window": {
                                                      "leftFront": windowsAction,
                                                      "leftBack": windowsAction,
                                                      "rearFront": windowsAction,
                                                      "rearBack": windowsAction,
                                                      "skyLight": skyWindowAction
                                                  }
                                              }
                                             }, vin);
            
            return apiReturnHandle(windowData, windowsOption === Options.Windows.SKYWINDOW ? "teto solar" : "janelas");
        }catch(e){
            printLog(LogType.ERROR, `---${formatMessage(UserMessages.ERROR_EXECUTING_COMMAND, {preposition: "das",  functionName: Options.Windows.SKYWINDOW ? "teto solar" : "janelas" })}---`, e);
            return { result: false, message: formatMessage(UserMessages.ERROR_EXECUTING_COMMAND, {preposition: "das",  functionName: Options.Windows.SKYWINDOW ? "teto solar" : "janelas" }), error: true};
        }
    },
    async windows(action, vin) {
        return this.windows_skyWindow(action, Options.Windows.WINDOWS, vin);
    },
    async skyWindow(action) {
        return this.windows_skyWindow(action, Options.Windows.SKYWINDOW, vin);
    },
    async doors_trunk(action, doorsOption, vin) {
        const actualStatus = await carData.getStatus(vin);
        let doorsAction = "";
        const serviceCode = doorsOption === Options.Doors.TRUNK ? Services.backdoor.code : Services.lockCmdCode.code;

        if (actualStatus) {
            const lockState = doorsOption === Options.Doors.TRUNK ? actualStatus["portamalas"] : actualStatus["estado_da_trava"];

            if (lockState) {
            if ((action === Actions.Doors.CLOSE && lockState.value === States.Doors.CLOSED)
             || (action === Actions.Doors.OPEN  && lockState.value === States.Doors.OPEN)) {
                return { result: false, message: formatMessage(UserMessages.COMMAND_NOT_EXECUTED, {functionName: doorsOption === Options.Doors.TRUNK ? "porta-malas" : "portas"})};
            }
            doorsAction = action;
            } else {
            doorsAction = Actions.Doors.CLOSE;
            }
        } else {
            doorsAction = Actions.Doors.CLOSE;
        }

        try {
            const doorData = await sendCmd({
                                            [serviceCode]: {
                                                "operationTime": "0",
                                                "switchOrder": doorsAction
                                            }
                                           }, vin);

            return apiReturnHandle(doorData, doorsOption === Options.Doors.TRUNK ? "porta-malas" : "portas");
        } catch (e) {
            printLog(LogType.ERROR, `---${formatMessage(UserMessages.ERROR_EXECUTING_COMMAND, {preposition: doorsOption === Options.Doors.TRUNK ? "do" : "das",  functionName: doorsOption === Options.Doors.TRUNK ? "porta-malas" : "portas" })}---`, e);
            return { result: false, message: formatMessage(UserMessages.ERROR_EXECUTING_COMMAND, {preposition: doorsOption === Options.Doors.TRUNK ? "do" : "das",  functionName: doorsOption === Options.Doors.TRUNK ? "porta-malas" : "portas" }), error: true };
        }
    },
    async doors(action, vin) {
        return this.doors_trunk(action, Options.Doors.DOORS, vin);
    },
    async trunk(action, vin) {
        return this.doors_trunk(action, Options.Doors.TRUNK, vin);
    },
    async stopCharging(vin) {
        await chargingSchedule(true);
        setTimeout(async () => { 
            await chargingSchedule(false, vin);
            printLog(LogType.INFO, `>>>${UserMessages.CHARGING_SCHEDULE_REVERSAL}<<<`);
        }, 2 * 60 * 1000);
    }
}

module.exports = { carData, carUtil, Actions, States, Options, auth, carTextUtil, UserMessages };