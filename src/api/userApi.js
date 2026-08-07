import { apiClient } from './client';

const BASE = '/restful/v1/api/user';

export const userApi = {
  getAddresses: (page = 0, size = 20) =>
    apiClient.get(`${BASE}/address`, { params: { page, size } }).then((r) => r.data),

  addAddress: (payload) => apiClient.post(`${BASE}/address`, payload).then((r) => r.data),
};
