module.exports = {
  isTokenExpired(token) {
    const [, payloadBase64] = token.split('.');
    const decodedJson = Buffer.from(payloadBase64, 'base64').toString();
    const decoded = JSON.parse(decodedJson)
    const { exp } = decoded;
    const expired = (Date.now() >= exp * 1000)
    return expired
  }
}
