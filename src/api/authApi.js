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

  logout: () => apiClient.post(`${BASE}/logout`).then((r) => r.data),

  getUserById: (userId) => apiClient.get(`${BASE}/byUserId/${userId}`).then((r) => r.data),

  updateProfile: (userId, payload) =>
    apiClient.put(`${BASE}/update-profile/${userId}`, payload).then((r) => r.data),
};
