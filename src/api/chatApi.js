import { apiClient } from './client';

const BASE = '/restful/v1/api/chat';

export const chatApi = {
  // Bot turn — guest allowed. `conversationId` omitted starts a new BOT conversation.
  sendMessage: (payload) => apiClient.post(`${BASE}/bot/message`, payload).then((r) => r.data),

  // Resolves a `requiresConfirmation` prompt (e.g. cancel-order) without re-parsing free text.
  confirmAction: (payload) => apiClient.post(`${BASE}/bot/confirm`, payload).then((r) => r.data),

  // Explicit "Talk to Human" handoff — auth required.
  requestHuman: (conversationId) =>
    apiClient.post(`${BASE}/conversations/${conversationId}/request-human`).then((r) => r.data),

  // Incremental history — also the WS reconnect/backfill source. `afterId` omitted fetches
  // from the start of the transcript.
  getMessages: (conversationId, afterId) =>
    apiClient
      .get(`${BASE}/conversations/${conversationId}/messages`, {
        params: afterId != null ? { afterId } : {},
      })
      .then((r) => r.data),

  rate: (conversationId, payload) =>
    apiClient.post(`${BASE}/conversations/${conversationId}/rating`, payload).then((r) => r.data),

  // Multipart upload (field name `file`) — server returns the full created message record,
  // so no second round-trip is needed to render it.
  uploadAttachment: (conversationId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient
      .post(`${BASE}/conversations/${conversationId}/attachments`, formData)
      .then((r) => r.data);
  },
};

// Derives the chat WS URL from the same base URL every other apiClient call uses
// (VITE_API_BASE_URL), swapping http(s) for ws(s) — no separate env var.
export function buildChatWsUrl(conversationId, token) {
  const httpBase = apiClient.defaults.baseURL || '';
  const wsBase = httpBase.replace(/^https/, 'wss').replace(/^http/, 'ws');
  const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
  return `${wsBase}${BASE}/ws/chat/${conversationId}${tokenParam}`;
}
