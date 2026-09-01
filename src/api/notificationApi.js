import { apiClient } from './client';

const BASE = '/restful/v1/api/notifications';

export const notificationApi = {
  getByUser: (userId) => apiClient.get(`${BASE}/user/${userId}`).then((r) => r.data),
};
