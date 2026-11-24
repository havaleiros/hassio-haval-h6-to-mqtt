const fs = require("fs");
const crypto = require("crypto");
const axios = require("axios");
const https = require("https");
const md5 = require("md5");
const slugify = require("slugify");
const storage = require("./storage");
const carTextUtil = require("./carTextUtil");
const { isTokenExpired, LogType, printLog } = require('./utils');
const { signRequest } = require("./signing");
const { sensorTopics } = require("./map");

const { USERNAME, PASSWORD, PIN } = process.env;
const VERIFY_CODE_FILE = "/config/haval_h6_verify_code.txt";

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
    apiLoginBase: "https://br-h5-gateway.gwmcloud.com/app-api/api/v2.0",
    apiH5Base: "https://br-h5-gateway.gwmcloud.com/app-api/api/v1.0",
};

const APP_HEADERS = {
    rs: "2",
    terminal: "GW_APP_GWM",
    brand: "6",
    language: "pt_BR",
    systemtype: "2",
    regioncode: "BR",
    country: "BR",
    appid: "6",
    enterpriseid: "CC01",
    channel: "APP",
    cver: "1.4.2",
    "User-Agent": "okhttp/4.9.3",
    accept: "application/json",
};

const UserMessages = {
    PIN_NOT_CONFIGURED: "PIN para comandos remotos não configurado. Não é possível executar comandos sem o PIN configurado no aplicativo MY GWM.",
    COMMAND_ALREADY_EXECUTING: (description) => `O comando remoto \"${description}\" ainda está em execução. Por favor, aguarde seu término antes de solicitar um novo comando.`,
    COMMAND_SUCCESS: (functionName) => `Comando remoto para ${functionName} enviado com sucesso.`,
    COMMAND_FAILED: (functionName) => `Falha no acionamento do comando remoto para ${functionName}. Por favor, tente novamente ou reporte o erro na comunidade.`,
    SYSTEM_BUSY: "Já há um comando remoto em execução e o sistema está ocupado. Aguarde e tente novamente em breve.",
    COMMAND_NOT_EXECUTED: (functionName) => `Comando remoto para ${functionName} não executado. Já é o estado atual e não há como executar novamente.`,
    VEHICLE_LOCKED_REQUIRED: (functionName) => `O comando de ${functionName} somente pode ser executado se o veículo estiver trancado. Por favor, tranque-o antes de executar este comando.`,
    CHARGING_SCHEDULE_REVERSAL: "Reversão da solução de contorno para paralizar o carregamento solicitado com sucesso.",
    ERROR_SENDING_COMMAND: "Ocorreu um erro ao enviar o comando para o veículo.",
    ERROR_RETRIEVING_CAR_DATA: "Erro ao obter as informações do veículo",
    ERROR_EXECUTING_COMMAND: (preposition, functionName) => `Ocorreu um erro no acionamento ${preposition} ${functionName}.`,
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

const path = require("path");
const { VERIFY_CODE } = process.env;

const OTP_MIN_REISSUE_COOLDOWN_MS = 10 * 60 * 1000;
const OTP_ERROR_COOLDOWN_MS = 30 * 60 * 1000;
const AUTH_RETRY_COOLDOWN_MS = 5 * 60 * 1000;

let _loginHttpsAgent = null;
let _vehicleHttpsAgent = null;
let _authInFlight = null;
let _otpRequestedThisRun = false;
let _awaitingOtp = false;
let _authBlockedUntil = 0;
let _authBlockedReason = "";
let headers = {};

function getNormalizedAccount() {
    return String(USERNAME || "").trim().toLowerCase();
}

function getOrCreateDeviceId() {
    let deviceid = storage.getItem("deviceid");
    if (!deviceid || !/^[0-9a-f]{32}$/.test(deviceid)) {
        deviceid = crypto.randomBytes(16).toString("hex");
        storage.setItem("deviceid", deviceid);
    }
    return deviceid;
}

function getLoginHttpsAgent() {
    if (!_loginHttpsAgent) {
        _loginHttpsAgent = new https.Agent();
    }
    return _loginHttpsAgent;
}

function getVehicleHttpsAgent() {
    if (_vehicleHttpsAgent) {
        return _vehicleHttpsAgent;
    }
    let certData = "";
    let certKey = "";
    let ca = "";
    try {
        const certsDir = path.join(__dirname, "certs");
        certData = fs.readFileSync(path.join(certsDir, "gwm_general.cer"), { encoding: "utf8" });
        certKey = fs.readFileSync(path.join(certsDir, "gwm_general.key"), { encoding: "utf8" });
        ca = fs.readFileSync(path.join(certsDir, "gwm_root.cer"), { encoding: "utf8" });
    } catch (error) {
        printLog(LogType.ERROR, UserMessages.ERROR_READING_CERTIFICATES, error.message || error);
        return null;
    }

    // Send leaf certificate concatenated with intermediates (IOV APP General SubCA in gwm_root.cer)
    _vehicleHttpsAgent = new https.Agent({
        cert: `${certData.trim()}\n${ca.trim()}\n`,
        key: certKey,
        minVersion: "TLSv1.2",
        ciphers: "DEFAULT:@SECLEVEL=0",
        rejectUnauthorized: true,
    });
    return _vehicleHttpsAgent;
}

function isVerifyCodeAlreadyUsed(code) {
    if (!code) return true;
    const lastConsumed = storage.getItem("lastConsumedVerifyCode");
    const lastRejected = storage.getItem("lastRejectedVerifyCode");
    return Boolean((lastConsumed && lastConsumed === code) || (lastRejected && lastRejected === code));
}

function getPendingVerifyCode() {
    if (fs.existsSync(VERIFY_CODE_FILE)) {
        try {
            const fileRaw = fs.readFileSync(VERIFY_CODE_FILE, { encoding: "utf8" }).trim();
            if (fileRaw) {
                if (!isVerifyCodeAlreadyUsed(fileRaw)) {
                    return { code: fileRaw, fromFile: true };
                }
                clearPendingVerifyFile(true);
            }
        } catch (_) {
            // ignore read errors and fall back to env var
        }
    }

    if (VERIFY_CODE && !["null", "undefined"].includes(String(VERIFY_CODE).trim())) {
        const envRaw = String(VERIFY_CODE).trim();
        if (envRaw && !isVerifyCodeAlreadyUsed(envRaw)) {
            return { code: envRaw, fromFile: false };
        }
    }

    return null;
}

function clearPendingVerifyFile(fromFile) {
    if (fromFile && fs.existsSync(VERIFY_CODE_FILE)) {
        try {
            fs.unlinkSync(VERIFY_CODE_FILE);
        } catch (_) {
            // ignore cleanup errors
        }
    }
}

function resetAuthCooldowns() {
    storage.removeItem("verifyCodeRequestedAt");
    storage.removeItem("otpCooldownUntil");
    storage.removeItem("lastRejectedVerifyCode");
    _otpRequestedThisRun = false;
    _awaitingOtp = false;
    _authBlockedUntil = 0;
    _authBlockedReason = "";
}

function persistSessionTokens(data) {
    const accessToken = data.accessToken;
    const refreshToken = data.refreshToken || storage.getItem("refreshToken") || "";
    const gwId = data.gwId !== undefined && data.gwId !== null ? String(data.gwId) : (storage.getItem("gwId") || "");
    const account = getNormalizedAccount();
    if (account) storage.setItem("sessionAccount", account);
    if (accessToken) storage.setItem("accessToken", accessToken);
    if (refreshToken) storage.setItem("refreshToken", refreshToken);
    if (gwId) storage.setItem("gwId", gwId);
    return { accessToken, refreshToken, gwId };
}

function clearStoredSession(clearRefresh = false) {
    headers = {};
    storage.removeItem("accessToken");
    if (clearRefresh) {
        storage.removeItem("refreshToken");
    }
}

function ensureSessionAccount() {
    const currentAccount = getNormalizedAccount();
    if (!currentAccount) return;

    const storedAccount = (storage.getItem("sessionAccount") || "").trim().toLowerCase();
    if (!storedAccount) {
        storage.setItem("sessionAccount", currentAccount);
        return;
    }

    if (storedAccount !== currentAccount) {
        printLog(LogType.WARNING, `Conta GWM alterada (${storedAccount} -> ${currentAccount}). Limpando sessao anterior e gerando novo deviceId.`);
        clearStoredSession(true);
        storage.removeItem("gwId");
        storage.removeItem("deviceid");
        storage.removeItem("lastConsumedVerifyCode");
        resetAuthCooldowns();
        storage.setItem("sessionAccount", currentAccount);
    }
}

async function signedRequest({ method, url, data = undefined, extraHeaders = {}, httpsAgent }) {
    const bodyStr = data !== undefined && data !== null ? JSON.stringify(data) : undefined;
    const signHeaders = signRequest(method, url, bodyStr !== undefined ? bodyStr : null);
    const reqHeaders = {
        ...APP_HEADERS,
        ...extraHeaders,
        ...signHeaders,
    };
    if (bodyStr !== undefined) {
        reqHeaders["content-type"] = "application/json";
    }
    return axios({
        method,
        url,
        data: bodyStr,
        headers: reqHeaders,
        httpsAgent,
        timeout: 20000,
    });
}

async function refreshSession(deviceid) {
    const accessToken = storage.getItem("accessToken");
    const refreshToken = storage.getItem("refreshToken");
    const gwId = storage.getItem("gwId");
    if (!refreshToken) return null;

    const vehicleAgent = getVehicleHttpsAgent();
    if (!vehicleAgent) return null;

    try {
        const extraHeaders = {
            accessToken: accessToken || "",
            refreshToken,
            deviceId: deviceid,
            iccid: deviceid,
        };
        if (gwId) extraHeaders.gwId = gwId;

        const { data } = await signedRequest({
            method: "POST",
            url: `${Endpoints.apiH5Base}/userAuth/refreshToken`,
            data: {
                accessToken: accessToken || "",
                refreshToken,
                deviceId: deviceid,
            },
            extraHeaders,
            httpsAgent: vehicleAgent,
        });

        if (data && data.code === "000000" && data.data && data.data.accessToken) {
            resetAuthCooldowns();
            return persistSessionTokens(data.data);
        }
        printLog(LogType.WARNING, `Refresh token recusado (code=${data ? data.code : "unknown"}: ${data ? data.description : ""}). Limpando refreshToken e tentando novo login.`);
        if (data && data.code && data.code !== "000000") {
            storage.removeItem("refreshToken");
        }
        return null;
    } catch (err) {
        const status = err.response ? err.response.status : err.message;
        printLog(LogType.WARNING, `Falha ao renovar refreshToken (${status}). Tentando novo login.`);
        return null;
    }
}

async function loginWithAppPassword(deviceid) {
    const account = String(USERNAME || "").trim();
    const accountType = account.includes("@") ? "2" : "1";
    const loginAgent = getLoginHttpsAgent();

    const basePayload = {
        account,
        accountType,
        countryCode: "55",
        agreement: [1, 2],
        password: PASSWORD,
        deviceId: deviceid,
        appType: "0",
        pushToken: null,
        country: "BR",
    };

    const extraHeaders = {
        deviceId: deviceid,
        iccid: deviceid,
    };

    try {
        const pending = getPendingVerifyCode();

        if (_awaitingOtp && !pending) {
            const pausedErr = new Error("Verificacao de dispositivo pendente (308103). Aguardando codigo OTP em gwm_verify_code ou /config/haval_h6_verify_code.txt (sem novas chamadas a API GWM).");
            pausedErr.apiCode = "308103";
            pausedErr.isAuthPaused = true;
            throw pausedErr;
        }

        if (_authBlockedUntil > Date.now() && !pending) {
            const remainingSec = Math.ceil((_authBlockedUntil - Date.now()) / 1000);
            const pausedErr = new Error(`Autenticacao em pausa por ${remainingSec}s (${_authBlockedReason}).`);
            pausedErr.isAuthPaused = true;
            throw pausedErr;
        }

        let { data } = await signedRequest({
            method: "POST",
            url: `${Endpoints.apiLoginBase}/userAuth/loginWithPassword`,
            data: basePayload,
            extraHeaders,
            httpsAgent: loginAgent,
        });

        if (data && data.code === "308103") {
            if (!pending) {
                const storedCooldownUntil = Number(storage.getItem("otpCooldownUntil") || "0");
                const legacyLastReq = Number(storage.getItem("verifyCodeRequestedAt") || "0");
                const legacyCooldownUntil = legacyLastReq > 0 ? (legacyLastReq + OTP_MIN_REISSUE_COOLDOWN_MS) : 0;
                const otpCooldownUntil = Math.max(storedCooldownUntil, legacyCooldownUntil);

                if (!_otpRequestedThisRun && Date.now() >= otpCooldownUntil) {
                    const verifyReq = await signedRequest({
                        method: "POST",
                        url: `${Endpoints.apiLoginBase}/userAuth/getVerifyCode`,
                        data: {
                            type: "17",
                            account,
                            accountType,
                            countryCode: "55",
                            validCodeMode: 1,
                            operateCode: "",
                            captchaType: "",
                            captchaId: "",
                            token: "",
                        },
                        extraHeaders,
                        httpsAgent: loginAgent,
                    });
                    const now = Date.now();
                    _otpRequestedThisRun = true;
                    _awaitingOtp = true;
                    storage.setItem("verifyCodeRequestedAt", String(now));

                    const vCode = verifyReq.data ? verifyReq.data.code : "unknown";
                    const vDesc = verifyReq.data ? (verifyReq.data.description || "") : "";
                    if (vCode === "000000") {
                        storage.setItem("otpCooldownUntil", String(now + OTP_MIN_REISSUE_COOLDOWN_MS));
                        printLog(LogType.WARNING, "Codigo de verificacao (OTP) solicitado por e-mail (000000). Informe o codigo em gwm_verify_code (e reinicie) ou grave em /config/haval_h6_verify_code.txt. Nenhum novo OTP sera solicitado automaticamente enquanto o add-on permanecer em execucao.");
                    } else {
                        storage.setItem("otpCooldownUntil", String(now + OTP_ERROR_COOLDOWN_MS));
                        _authBlockedUntil = now + OTP_ERROR_COOLDOWN_MS;
                        _authBlockedReason = `getVerifyCode ${vCode}${vDesc ? `: ${vDesc}` : ""}`;
                        printLog(LogType.WARNING, `Falha ao solicitar OTP por e-mail (getVerifyCode code=${vCode}: ${vDesc}). Pausando novas solicitacoes de OTP por ${Math.round(OTP_ERROR_COOLDOWN_MS / 60000)} minutos.`);
                    }
                } else {
                    _awaitingOtp = true;
                    const waitMin = Math.max(1, Math.ceil((otpCooldownUntil - Date.now()) / 60000));
                    printLog(LogType.WARNING, `Verificacao de dispositivo pendente (308103). Um OTP ja foi solicitado recentemente; informe o codigo em gwm_verify_code ou /config/haval_h6_verify_code.txt (novo envio bloqueado por ~${waitMin} min).`);
                }
                const err308103 = new Error("Verificacao de dispositivo pendente (308103). Informe o codigo recebido por e-mail em gwm_verify_code ou /config/haval_h6_verify_code.txt.");
                err308103.apiCode = "308103";
                throw err308103;
            }

            const checkRes = await signedRequest({
                method: "POST",
                url: `${Endpoints.apiLoginBase}/userAuth/checkVerifyCode`,
                data: {
                    type: "17",
                    account,
                    accountType,
                    countryCode: "55",
                    validCodeMode: 1,
                    verifyCode: pending.code,
                },
                extraHeaders,
                httpsAgent: loginAgent,
            });

            if (!checkRes.data || checkRes.data.code !== "000000") {
                const desc = checkRes.data ? `${checkRes.data.code} - ${checkRes.data.description}` : "resposta invalida";
                storage.setItem("lastRejectedVerifyCode", pending.code);
                clearPendingVerifyFile(pending.fromFile);
                _awaitingOtp = true;
                printLog(LogType.WARNING, `Codigo de verificacao rejeitado pela GWM (${desc}). O codigo foi descartado para evitar tentativas repetidas; informe um novo codigo valido ou reinicie o add-on apos o intervalo de seguranca.`);
                const rejErr = new Error(`Codigo de verificacao rejeitado (${desc}).`);
                rejErr.apiCode = "308103";
                throw rejErr;
            }

            // Code validated/consumed by GWM backend: prevent infinite retries with the same code if login2 fails
            storage.setItem("lastConsumedVerifyCode", pending.code);
            clearPendingVerifyFile(pending.fromFile);

            const login2 = await signedRequest({
                method: "POST",
                url: `${Endpoints.apiLoginBase}/userAuth/loginWithPassword`,
                data: {
                    ...basePayload,
                    verifyCode: pending.code,
                    validCodeMode: "1",
                },
                extraHeaders,
                httpsAgent: loginAgent,
            });
            data = login2.data;
            if (data && data.code === "308103") {
                _awaitingOtp = true;
            }
        }

        if (data && data.code === "000000" && data.data && data.data.accessToken) {
            resetAuthCooldowns();
            return persistSessionTokens(data.data);
        }

        const errMsg = data ? `code=${data.code} description=${data.description}` : "empty response";
        if (!data || data.code !== "308103") {
            _authBlockedUntil = Date.now() + AUTH_RETRY_COOLDOWN_MS;
            _authBlockedReason = errMsg;
            printLog(LogType.WARNING, `Login recusado pela GWM (${errMsg}). Pausando novas tentativas de login por ${Math.round(AUTH_RETRY_COOLDOWN_MS / 60000)} minutos.`);
        }
        throw new Error(errMsg);
    } catch (err) {
        const detail = err.response ? `HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}` : err.message;
        if (!err.isAuthPaused && err.apiCode !== "308103" && _authBlockedUntil <= Date.now()) {
            _authBlockedUntil = Date.now() + AUTH_RETRY_COOLDOWN_MS;
            _authBlockedReason = detail;
        }
        if (err.isAuthPaused) {
            printLog(LogType.DEBUG, `---${UserMessages.ERROR_AUTHENTICATION_LOG}---`, detail);
        } else {
            printLog(LogType.ERROR, `---${UserMessages.ERROR_AUTHENTICATION_LOG}---`, detail);
        }
        throw new Error(UserMessages.ERROR_AUTHENTICATION);
    }
}

async function auth({ forceRefresh = false, forceRelogin = false } = {}) {
    if (_authInFlight) {
        return _authInFlight;
    }

    _authInFlight = (async () => {
        ensureSessionAccount();
        const deviceid = getOrCreateDeviceId();
        const storedAccess = storage.getItem("accessToken");
        const storedRefresh = storage.getItem("refreshToken");
        const storedGwId = storage.getItem("gwId") || "";

        if (!forceRefresh && !forceRelogin && storedAccess && !isTokenExpired(storedAccess, 300)) {
            return { accessToken: storedAccess, refreshToken: storedRefresh || "", gwId: storedGwId };
        }

        if (!forceRelogin && storedRefresh) {
            const refreshed = await refreshSession(deviceid);
            if (refreshed) return refreshed;
        }

        return loginWithAppPassword(deviceid);
    })();

    try {
        return await _authInFlight;
    } finally {
        _authInFlight = null;
    }
}

async function updateHeaders(forceRefresh = false, forceRelogin = false) {
    const vehicleAgent = getVehicleHttpsAgent();
    if (!vehicleAgent) return null;

    if (!forceRefresh && !forceRelogin && headers.accessToken && !isTokenExpired(headers.accessToken, 300)) {
        return headers;
    }

    const { accessToken, refreshToken, gwId } = await auth({ forceRefresh, forceRelogin });
    const deviceid = getOrCreateDeviceId();

    headers = {
        ...APP_HEADERS,
        accessToken,
        refreshToken: refreshToken || "",
        deviceId: deviceid,
        iccid: deviceid,
    };
    if (gwId) {
        headers.gwId = gwId;
    }
    return headers;
}

async function vehicleRequest(method, url, data = undefined) {
    const vehicleAgent = getVehicleHttpsAgent();
    if (!vehicleAgent) {
        throw new Error(UserMessages.ERROR_READING_CERTIFICATES);
    }

    let authHeaders = await updateHeaders(false, false);
    const execute = async (hdrs) => signedRequest({
        method,
        url,
        data,
        extraHeaders: hdrs,
        httpsAgent: vehicleAgent,
    });

    let res;
    try {
        res = await execute(authHeaders);
    } catch (err) {
        if (err.response && [401, 403].includes(err.response.status)) {
            clearStoredSession(false);
            authHeaders = await updateHeaders(true, false);
            res = await execute(authHeaders);
        } else {
            throw err;
        }
    }

    const code = res && res.data ? res.data.code : undefined;
    if (code === "570062") {
        printLog(LogType.WARNING, "Gateway retornou 570062 (token expirado/rejeitado). Renovando sessao e tentando novamente.");
        clearStoredSession(false);
        authHeaders = await updateHeaders(true, false);
        res = await execute(authHeaders);
    } else if (code === "607501") {
        printLog(LogType.WARNING, `Sessao encerrada por acesso simultaneo em outro dispositivo (607501). Evite manter o app My GWM aberto com a mesma conta. Pausando novas tentativas de login por ${Math.round(AUTH_RETRY_COOLDOWN_MS / 60000)} minutos.`);
        clearStoredSession(true);
        _authBlockedUntil = Date.now() + AUTH_RETRY_COOLDOWN_MS;
        _authBlockedReason = "sessao encerrada por acesso simultaneo (607501)";
    }

    return res;
}

async function getLastCommandResult(seqNo, vin) {
    try {
        const { data } = await vehicleRequest(
            "GET",
            `${Endpoints.apiVehicle}/vehicle/getRemoteCtrlResultT5?seqNo=${encodeURIComponent(seqNo)}&vin=${encodeURIComponent(vin)}`
        );

        if (data && data.data && data.description === "SUCCESS") {
            return {
                remoteType: data.data[0].remoteType,
                resultCode: data.data[0].resultCode,
            };
        }
        return null;
    } catch (e) {
        printLog(LogType.ERROR, `---${UserMessages.ERROR_RETRIEVING_COMMAND_STATUS}---`, e.message || e);
        return null;
    }
}

async function sendCmd(instructions, vin) {
    try {
        if (PIN === undefined || PIN === "") {
            const retData = { code: "9999", message: UserMessages.PIN_NOT_CONFIGURED };
            printLog(LogType.DEBUG, `sendCmd returning data: ${Buffer.from(JSON.stringify(retData)).toString('base64')}`);
            return retData;
        }

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
                if (!['6', '10'].includes(lastResult.resultCode)) {
                    const service = Object.values(Services).find(s => s.code === lastResult.remoteType);
                    const description = service ? service.description : UserMessages.UNKNOWN_COMMAND;
                    const retData = {
                        result: false,
                        message: `${UserMessages.COMMAND_ALREADY_EXECUTING(description)} - (${lastResult.resultCode})`,
                        running: true
                    };
                    printLog(LogType.DEBUG, `sendCmd returning data: ${Buffer.from(JSON.stringify(retData)).toString('base64')}`);
                    return retData;
                }
            }
        }

        const seqNo = require('crypto').randomUUID().replaceAll('-', '') + '1234';
        lastCommands[vin] = { seqNo, timestamp: currentTime };
        storage.setItem("lastCommands", JSON.stringify(lastCommands));

        const remoteType = 0;
        const securityPassword = md5(PIN);
        const type = 2;

        const res = await vehicleRequest(
            "POST",
            `${Endpoints.apiVehicle}/vehicle/T5/sendCmd`,
            {
                instructions,
                remoteType,
                securityPassword,
                seqNo,
                type,
                vin
            }
        );

        printLog(LogType.DEBUG, `sendCmd returning data: ${Buffer.from(JSON.stringify(res.data)).toString('base64')}`);
        return res.data;
    } catch (err) {
        printLog(LogType.ERROR, `---${UserMessages.ERROR_SENDING_COMMAND}---`, err.message || err);
        return {
            result: false,
            message: UserMessages.ERROR_SENDING_COMMAND
        };
    }
};

async function chargingSchedule(enable, vin) {
    try {
        if (PIN === undefined || PIN === "")
            return { code: "9999", message: UserMessages.PIN_NOT_CONFIGURED }

        const seqNo = require('crypto').randomUUID().replaceAll('-', '') + '1234';
        const startTimeAdd = 5 * 60 * 1000;
        const endTimeAdd = 6 * 60 * 1000;
        const startTime = new Date().getTime() + startTimeAdd;
        const endTime = new Date().getTime() + endTimeAdd;

        const body = {
            enable: enable,
            startTime: enable ? startTime : "",
            endTime: enable ? endTime : "",
            seqNo: seqNo,
            planType: "1",
            vin: vin
        };

        const res = await vehicleRequest(
            "POST",
            `${Endpoints.apiVehicle}/vehicleCharge/setChargingPlan?vin=${encodeURIComponent(vin)}`,
            body
        );

        return res.data;
    } catch (e) {
        printLog(LogType.ERROR, `---${UserMessages.ERROR_SETTING_CHARGING}---`, e.message || e);
        return false;
    }
}

function apiReturnHandle(returnData, functionName) {
    if (returnData && returnData.description === "SUCCESS") {
        return { result: true, message: UserMessages.COMMAND_SUCCESS(functionName.toString()) };
    }
    else if (returnData) {
        if (returnData.running === true || (returnData.code && returnData.code === "9999"))
            return { result: false, message: returnData.message };

        if (returnData.code && returnData.code === "REMOTE250502")
            return { result: false, message: UserMessages.SYSTEM_BUSY };

        if (returnData.result === false) {
            printLog(LogType.ERROR, `---${UserMessages.ERROR_EXECUTING_COMMAND("de", functionName.toString())}--- `, returnData);
            return { result: false, message: returnData.message, error: true };
        }
    }
    else {
        let errorCode = "";
        if (returnData && returnData.code)
            errorCode = returnData.code;
        printLog(LogType.INFO, `---${UserMessages.ERROR_EXECUTING_COMMAND("de", functionName.toString())}---`, errorCode);
        return { result: false, message: UserMessages.COMMAND_FAILED(functionName.toString()), error: true };
    }
}

const carData = {
    async getCarList() {
        try {
            const response = await vehicleRequest("GET", `${Endpoints.apiVehicle}/globalapp/vehicle/acquireVehicles`);
            printLog(LogType.DEBUG, `getCarList returning data: ${Buffer.from(JSON.stringify(response.data)).toString('base64')}`);
            return response;
        } catch (e) {
            const detail = e.response ? `HTTP ${e.response.status}: ${JSON.stringify(e.response.data)}` : e.message;
            printLog(LogType.ERROR, `---${UserMessages.ERROR_RETRIEVING_CAR_LIST}---`, detail);
            return null;
        }
    },
    async getCarInfo(vin) {
        try {
            const { data } = await vehicleRequest("GET", `${Endpoints.apiVehicle}/vehicle/getLastStatus?vin=${encodeURIComponent(String(vin).toUpperCase())}&flag=true`);
            if (!data || data.code !== "000000") {
                printLog(LogType.ERROR, `---${UserMessages.ERROR_RETRIEVING_CAR_DATA}---`, data ? `code=${data.code} description=${data.description}` : "empty response");
                return null;
            }
            printLog(LogType.DEBUG, `getCarInfo returning data: ${Buffer.from(JSON.stringify(data.data)).toString('base64')}`);
            return data.data;
        } catch (e) {
            const detail = e.response ? `HTTP ${e.response.status}: ${JSON.stringify(e.response.data)}` : e.message;
            printLog(LogType.ERROR, `---${UserMessages.ERROR_RETRIEVING_CAR_DATA}---`, detail);
            return null;
        }
    },
    async getStatus(vin, prefetchedData = null) {
        try {
            const data = prefetchedData || await carData.getCarInfo(vin);

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

                if (data.hasOwnProperty("hyEngSts")) {
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
            printLog(LogType.DEBUG, `getStatus returning data: ${Buffer.from(JSON.stringify(status)).toString('base64')}`);
            return status;
        } catch (e) {
            printLog(LogType.ERROR, `---${UserMessages.ERROR_RETRIEVING_CAR_STATUS}---`, e.message || e);
            return UserMessages.ERROR_RETRIEVING_CAR_STATUS
        }
    },
    async getChargingLogs(vin) {
        try {
            const body = {
                vin: vin.toUpperCase(),
                pageNum: "1",
                pageSize: "100",
                continuation: "0"
            };

            const chargingLogs = await vehicleRequest("POST", `${Endpoints.apiVehicle}/vehicleCharge/getChargeLogs`, body);

            if (chargingLogs && chargingLogs.data && chargingLogs.data.data && chargingLogs.data.data.list && chargingLogs.data.data.list.length > 0) {
                const formattedList = chargingLogs.data.data.list.map(({ startTime, endTime }) => {
                    const startDate = new Date(parseInt(startTime)).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
                    const endDate = new Date(parseInt(endTime)).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

                    const startTimeFormatted = new Date(parseInt(startTime)).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
                    const endTimeFormatted = new Date(parseInt(endTime)).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });

                    return `${startDate} ${startTimeFormatted} ~ ${endDate} ${endTimeFormatted}`;
                });

                printLog(LogType.DEBUG, `getChargingLogs returning data: ${Buffer.from(JSON.stringify(formattedList)).toString('base64')}`);
                return formattedList;
            }
            else
                return "";

        } catch (e) {
            printLog(LogType.ERROR, `---${UserMessages.ERROR_RETRIEVING_CHARGING_LOGS}---`, e.message || e);
            return "";
        }
    }
}

const carUtil = {
    async airConditioner(action, vin) {
        const actualStatus = await carData.getStatus(vin);
        let airConAction = "";

        if (actualStatus && actualStatus["estado_do_ar_condicionado"]) {
            if ((action === Actions.AirCon.TURN_OFF && actualStatus["estado_do_ar_condicionado"].value === States.AirCon.OFF)
                || (action === Actions.AirCon.TURN_ON && actualStatus["estado_do_ar_condicionado"].value === States.AirCon.ON)) {
                return { result: false, message: UserMessages.COMMAND_NOT_EXECUTED("ar-condicionado") };
            }
            if (actualStatus["estado_da_trava"].value !== States.Doors.CLOSED) {
                return { result: false, message: UserMessages.VEHICLE_LOCKED_REQUIRED("ar-condicionado") };
            }
            airConAction = action;
        }
        else
            airConAction = Actions.AirCon.TURN_OFF;

        try {
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
        } catch (e) {
            printLog(LogType.ERROR, UserMessages.ERROR_EXECUTING_COMMAND({ preposition: "do", functionName: "ar-condicionado" }), e);
            return { result: false, message: UserMessages.ERROR_EXECUTING_COMMAND({ preposition: "do", functionName: "ar-condicionado" }) };
        }
    },
    async engine(action, vin) {
        const actualStatus = await carData.getStatus(vin);
        if (actualStatus["estado_da_trava"].value !== States.Doors.CLOSED) {
            return { result: false, message: UserMessages.VEHICLE_LOCKED_REQUIRED("motor") };
        }

        if ((action === Actions.Engine.TURN_OFF && actualStatus["estado_do_motor"].value === States.Engine.OFF)
            || (action === Actions.Engine.TURN_ON && actualStatus["estado_do_motor"].value === States.Engine.ON)) {
            return { result: false, message: UserMessages.COMMAND_NOT_EXECUTED("motor") };
        }

        try {
            const engineData = await sendCmd({
                [Services.engine.code]: {
                    "operationTime": "15",
                    "switchOrder": action
                }
            }, vin);

            return apiReturnHandle(engineData, "motor");
        } catch (e) {
            printLog(LogType.ERROR, UserMessages.ERROR_EXECUTING_COMMAND({ preposition: "do", functionName: "motor" }), e);
            return { result: false, message: UserMessages.ERROR_EXECUTING_COMMAND({ preposition: "do", functionName: "motor" }), error: true };
        }
    },
    async windows_skyWindow(action, windowsOption, vin) {
        const actualStatus = await carData.getStatus(vin);
        let windowsAction = "";
        let skyWindowAction = "";

        if (windowsOption === Options.Windows.WINDOWS) {
            if (actualStatus
                && actualStatus["vidro_dianteiro_esquerdo"]
                && actualStatus["vidro_dianteiro_direito"]
                && actualStatus["vidro_traseiro_esquerdo"]
                && actualStatus["vidro_traseiro_direito"]) {

                const actualWindowsState = actualStatus["vidro_dianteiro_esquerdo"].value
                    + actualStatus["vidro_dianteiro_direito"].value
                    + actualStatus["vidro_traseiro_esquerdo"].value
                    + actualStatus["vidro_traseiro_direito"].value;

                if ((action === Actions.Windows.CLOSE && !actualWindowsState.includes(States.Windows.OPEN) && !actualWindowsState.includes(States.Windows.PARTIALLY_OPEN))
                    || (action === Actions.Windows.OPEN && actualWindowsState.includes(States.Windows.CLOSED))) {
                    return { result: false, message: UserMessages.COMMAND_NOT_EXECUTED("janelas") };
                }

                windowsAction = action;

                windowsAction = actualWindowsState.includes(States.Windows.OPEN) || actualWindowsState.includes(States.Windows.PARTIALLY_OPEN) ? Actions.Windows.CLOSE : Actions.Windows.OPEN;
            }
            else
                windowsAction = Actions.Windows.CLOSE;
        }

        if (windowsOption === Options.Windows.SKYWINDOW) {
            if (actualStatus && actualStatus["posicao_do_teto_solar"]) {
                if ((action === Actions.SkyWindow.CLOSE && actualStatus["posicao_do_teto_solar"].value === States.SkyWindow.CLOSED)
                    || (action === Actions.SkyWindow.OPEN && actualStatus["posicao_do_teto_solar"].value !== States.SkyWindow.CLOSED)) {
                    return { result: false, message: UserMessages.COMMAND_NOT_EXECUTED("teto solar") };
                }
                skyWindowAction = action;
            }
            else
                skyWindowAction = Actions.SkyWindow.CLOSE;
        }

        try {
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
        } catch (e) {
            printLog(LogType.ERROR, `---${UserMessages.ERROR_EXECUTING_COMMAND({ preposition: "das", functionName: Options.Windows.SKYWINDOW ? "teto solar" : "janelas" })}---`, e);
            return { result: false, message: UserMessages.ERROR_EXECUTING_COMMAND({ preposition: "das", functionName: Options.Windows.SKYWINDOW ? "teto solar" : "janelas" }), error: true };
        }
    },
    async windows(action, vin) {
        return this.windows_skyWindow(action, Options.Windows.WINDOWS, vin);
    },
    async skyWindow(action, vin) {
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
                    || (action === Actions.Doors.OPEN && lockState.value === States.Doors.OPEN)) {
                    return { result: false, message: UserMessages.COMMAND_NOT_EXECUTED(doorsOption === Options.Doors.TRUNK ? "porta-malas" : "portas") };
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
            printLog(LogType.ERROR, `---${UserMessages.ERROR_EXECUTING_COMMAND({ preposition: doorsOption === Options.Doors.TRUNK ? "do" : "das", functionName: doorsOption === Options.Doors.TRUNK ? "porta-malas" : "portas" })}---`, e);
            return { result: false, message: UserMessages.ERROR_EXECUTING_COMMAND({ preposition: doorsOption === Options.Doors.TRUNK ? "do" : "das", functionName: doorsOption === Options.Doors.TRUNK ? "porta-malas" : "portas" }), error: true };
        }
    },
    async doors(action, vin) {
        return this.doors_trunk(action, Options.Doors.DOORS, vin);
    },
    async trunk(action, vin) {
        return this.doors_trunk(action, Options.Doors.TRUNK, vin);
    },
    async stopCharging(vin) {
        await chargingSchedule(true, vin);
        setTimeout(async () => {
            await chargingSchedule(false, vin);
            printLog(LogType.INFO, `>>>${UserMessages.CHARGING_SCHEDULE_REVERSAL}<<<`);
        }, 2 * 60 * 1000);
    }
}

module.exports = { carData, carUtil, Actions, States, Options, auth, carTextUtil, UserMessages };