import { apiClient } from './client';

const BASE = '/restful/v1/api/coupons';

export const couponApi = {
  apply: (payload) => apiClient.post(`${BASE}/apply`, payload).then((r) => r.data),
};
