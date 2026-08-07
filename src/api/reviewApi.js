import { apiClient } from './client';

const BASE = '/restful/v1/api/reviews';

export const reviewApi = {
  create: (payload) => apiClient.post(`${BASE}/create`, payload).then((r) => r.data),

  getById: (id) => apiClient.get(`${BASE}/${id}`).then((r) => r.data),

  getByProduct: (productId, page = 0, size = 20) =>
    apiClient.get(`${BASE}/product/${productId}`, { params: { page, size } }).then((r) => r.data),
};
