import { apiClient } from './client';

const BASE = '/restful/v1/api/payments';

export const paymentApi = {
  initiate: (payload) => apiClient.post(`${BASE}/initiate`, payload).then((r) => r.data),

  getById: (paymentId) => apiClient.get(`${BASE}/${paymentId}`).then((r) => r.data),

  getByOrder: (orderId) => apiClient.get(`${BASE}/order/${orderId}`).then((r) => r.data),

  markSuccess: (paymentId) => apiClient.put(`${BASE}/success/${paymentId}`).then((r) => r.data),

  markFailed: (paymentId) => apiClient.put(`${BASE}/failed/${paymentId}`).then((r) => r.data),
};
