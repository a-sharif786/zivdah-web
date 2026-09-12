import { apiClient } from './client';

const BASE = '/restful/v1/api/invoices';

export const invoiceApi = {
  getByOrderId: (orderId) => apiClient.get(`${BASE}/order/${orderId}`).then((r) => r.data),

  // Raw PDF bytes, ownership-checked server-side — never fetch invoice.pdfUrl directly (that's
  // the unauthenticated nginx-static link; see the backend's nginx config notes).
  downloadBlob: (invoiceId, mode = 'attachment') =>
    apiClient.get(`${BASE}/${invoiceId}/download`, { params: { mode }, responseType: 'blob' }).then((r) => r.data),
};

// Triggers the browser's native download/view behavior for a fetched PDF Blob.
export function openInvoiceBlob(blob, filename, mode) {
  const url = window.URL.createObjectURL(blob);
  if (mode === 'inline') {
    window.open(url, '_blank');
    setTimeout(() => window.URL.revokeObjectURL(url), 10_000);
    return;
  }
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
