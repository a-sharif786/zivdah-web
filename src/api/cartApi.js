import { apiClient } from './client';

const BASE = '/restful/v1/api/cart';

export const cartApi = {
  addToCart: (payload) => apiClient.post(`${BASE}/add`, payload).then((r) => r.data),

  getMyCart: () => apiClient.get(BASE).then((r) => r.data),

  updateQuantity: (cartItemId, quantity) =>
    apiClient.put(`${BASE}/${cartItemId}`, null, { params: { quantity } }).then((r) => r.data),

  removeItem: (cartItemId) => apiClient.delete(`${BASE}/${cartItemId}`).then((r) => r.data),

  clearMyCart: () => apiClient.delete(`${BASE}/clear`).then((r) => r.data),
};
