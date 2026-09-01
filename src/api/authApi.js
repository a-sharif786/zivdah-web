import { apiClient } from './client';

const BASE = '/restful/v1/api/auth';

export const authApi = {
  register: (payload) => apiClient.post(`${BASE}/register`, payload).then((r) => r.data),

  login: (payload) => apiClient.post(`${BASE}/login`, payload).then((r) => r.data),

  sendOtp: (mobile) => apiClient.post(`${BASE}/send-otp`, { mobile }).then((r) => r.data),

  verifyOtp: (payload) => apiClient.post(`${BASE}/verify-otp`, payload).then((r) => r.data),

  verifyRegistrationOtp: (payload) =>
    apiClient.post(`${BASE}/verify-registration-otp`, payload).then((r) => r.data),

  forgetPassword: (email) => apiClient.post(`${BASE}/forget-password`, { email }).then((r) => r.data),

  resetPassword: (payload) => apiClient.post(`${BASE}/reset-password`, payload).then((r) => r.data),

  // fcmToken is optional — when passed, only this device's push registration is
  // deactivated, other signed-in devices/browsers stay registered.
  logout: (fcmToken) => apiClient.post(`${BASE}/logout`, fcmToken ? { fcmToken } : {}).then((r) => r.data),

  getUserById: (userId) => apiClient.get(`${BASE}/byUserId/${userId}`).then((r) => r.data),

  updateProfile: (userId, payload) =>
    apiClient.put(`${BASE}/update-profile/${userId}`, payload).then((r) => r.data),

  // Registers/refreshes one device's FCM token — a user may be signed in on several
  // devices/browsers at once, each becomes its own row server-side (see device_tokens).
  registerDeviceToken: (fcmToken, deviceType = 'WEB') =>
    apiClient.post(`${BASE}/device-tokens`, { fcmToken, deviceType }).then((r) => r.data),
};
