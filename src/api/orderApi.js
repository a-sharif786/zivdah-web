import { apiClient } from './client';

const BASE = '/restful/v1/api/orders';

export const orderApi = {
  create: (payload) => apiClient.post(`${BASE}/create`, payload).then((r) => r.data),

  getById: (orderId) => apiClient.get(`${BASE}/${orderId}`).then((r) => r.data),

  getByUser: (userId) => apiClient.get(`${BASE}/user/${userId}`).then((r) => r.data),

  cancel: (orderId) => apiClient.put(`${BASE}/cancel/${orderId}`).then((r) => r.data),
};
