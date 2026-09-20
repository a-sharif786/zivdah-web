import { apiClient } from './client';

const BASE = '/restful/v1/api/payments';

export const paymentApi = {
  initiate: (payload) => apiClient.post(`${BASE}/initiate`, payload).then((r) => r.data),

  // Attaches the real orderId to a payment intent that was validated/created before the order
  // existed — call right after orderApi.create() succeeds (see Checkout.jsx).
  linkOrder: (paymentId, orderId) =>
    apiClient.put(`${BASE}/${paymentId}/link-order`, { orderId }).then((r) => r.data),

  getById: (paymentId) => apiClient.get(`${BASE}/${paymentId}`).then((r) => r.data),

  getByOrder: (orderId) => apiClient.get(`${BASE}/order/${orderId}`).then((r) => r.data),

  markSuccess: (paymentId) => apiClient.put(`${BASE}/success/${paymentId}`).then((r) => r.data),

  markFailed: (paymentId) => apiClient.put(`${BASE}/failed/${paymentId}`).then((r) => r.data),

  // Re-polls EcomWorldPay's status-check API for a UPI payment stuck in PROCESSING (the async
  // callback can be missed/delayed) — see zivdah-payment-service PaymentController.
  getGatewayStatus: (paymentId) => apiClient.get(`${BASE}/${paymentId}/gateway-status`).then((r) => r.data),
};
