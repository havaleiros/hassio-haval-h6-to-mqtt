const crypto = require("crypto");

// Signing profile for My GWM Brasil 1.4.2 (BR production gateway).
// Adapted from moryoav/ha-gwm-ev (commit f771372, MIT License).
// See THIRD_PARTY_NOTICES.md for attribution and license details.
const BRAZIL_GWM_AUTH = {
  name: "brazil-gwm-auth",
  prefix: "gwm",
  appKey: (process.env.GWM_APP_KEY || "9094558645").trim(),
  appSecret: (process.env.GWM_APP_SECRET || "ceffd90b9a8c8deeb82bc9963140aede").trim(),
};

function generateNonce() {
  return crypto.randomBytes(8).toString("hex");
}

function canonicalizeDartCurrentParameters(search, method, body) {
  const params = new Map();
  if (search) {
    const sp = new URLSearchParams(search);
    for (const [k, v] of sp.entries()) {
      params.set(k, v);
    }
  }
  if (method === "POST" && body !== undefined && body !== null) {
    params.set("json", body);
  }
  const sortedKeys = Array.from(params.keys()).sort();
  return sortedKeys
    .map((key) => `${key}=${String(params.get(key)).replace(/ /g, "")}`)
    .join("");
}

function signRequest(method, url, body = null, opts = {}) {
  const profile = opts.profile || BRAZIL_GWM_AUTH;
  const upperMethod = String(method).toUpperCase();
  const parsed = new URL(url);
  const path = parsed.pathname || "/";

  const parameters = canonicalizeDartCurrentParameters(
    parsed.search,
    upperMethod,
    body
  );

  const timestamp =
    opts.timestamp !== undefined ? String(opts.timestamp) : String(Date.now());
  const nonce =
    opts.nonce !== undefined ? String(opts.nonce) : generateNonce();

  const prefix = profile.prefix;
  const auth =
    `${prefix}-auth-appkey:${profile.appKey}` +
    `${prefix}-auth-nonce:${nonce}` +
    `${prefix}-auth-timestamp:${timestamp}`;

  const raw = upperMethod + path + auth + parameters + profile.appSecret;
  // encodeURIComponent preserves A-Z a-z 0-9 - _ . ! ~ * ' ( ), matching urllib.parse.quote(..., safe="-._~!*'()")
  const escaped = encodeURIComponent(raw);
  const signature = crypto
    .createHash("sha256")
    .update(escaped, "utf8")
    .digest("hex");

  return {
    [`${prefix}-auth-appkey`]: profile.appKey,
    [`${prefix}-auth-nonce`]: nonce,
    [`${prefix}-auth-timestamp`]: timestamp,
    [`${prefix}-auth-sign`]: signature,
  };
}

module.exports = {
  BRAZIL_GWM_AUTH,
  signRequest,
};
