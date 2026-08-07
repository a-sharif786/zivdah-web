// Backend's OTP-verification endpoints require a deviceToken (intended for push
// notifications). This app has no push integration, so we generate and persist a
// stable per-browser id to satisfy the field honestly rather than sending a fake value.
const KEY = 'zivdah_device_token';

export function getDeviceToken() {
  let token = localStorage.getItem(KEY);
  if (!token) {
    token = 'web-' + crypto.randomUUID();
    localStorage.setItem(KEY, token);
  }
  return token;
}
