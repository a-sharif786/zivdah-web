import axios from 'axios';

// Shared with AuthContext.jsx — both read/write this same localStorage key so the
// interceptor below can attach the token without importing AuthContext (would be circular).
export const AUTH_STORAGE_KEY = 'zivdah_auth';

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getStoredToken() {
  return readStoredAuth()?.token ?? null;
}

const baseURL = import.meta.env.VITE_API_BASE_URL;

export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  // An explicit Authorization header (e.g. authApi.logout's captured token) wins.
  if (token && !config.headers?.Authorization) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Let the browser set the multipart boundary itself for FormData bodies (needed for
  // chat attachment uploads) — same fix already applied in zivdah-admin/src/api/client.ts.
  if (config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Endpoints where a 401 means "bad credentials", not "access token expired" — never try
// to refresh for these (and /refresh-token itself would loop).
const NO_REFRESH_PATHS = ['/auth/login', '/auth/refresh-token', '/auth/verify-otp', '/auth/verify-registration-otp'];

// One refresh at a time per tab: every request that 401s while a refresh is in flight
// waits on the same promise instead of each rotating the refresh token (the backend treats
// a second use of an already-rotated token as theft and revokes the whole session).
let refreshPromise = null;

function refreshAccessToken() {
  if (!refreshPromise) {
    const stored = readStoredAuth();
    refreshPromise = (stored?.refreshToken
      ? // Bare axios, not apiClient, so this call skips both interceptors.
        axios.post(`${baseURL}/restful/v1/api/auth/refresh-token`, { refreshToken: stored.refreshToken })
      : Promise.reject(new Error('No refresh token'))
    )
      .then((res) => {
        const data = res.data?.data;
        const nextAuth = { ...readStoredAuth(), token: data.accessToken, refreshToken: data.refreshToken };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
        // AuthContext re-reads storage on this so useAuth().token stays current.
        window.dispatchEvent(new Event('zivdah-auth-refreshed'));
        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function isJwtExpiringSoon(token, skewMs = 30_000) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && payload.exp * 1000 - skewMs < Date.now();
  } catch {
    return false;
  }
}

// For callers that can't go through the 401-retry interceptor below (the chat WebSocket
// handshake passes the token as a query param): returns a token that won't be rejected as
// expired, refreshing first when needed.
export async function getFreshAccessToken() {
  const stored = readStoredAuth();
  if (!stored?.token) return null;
  if (stored.refreshToken && isJwtExpiringSoon(stored.token)) {
    try {
      return await refreshAccessToken();
    } catch {
      expireSession();
      return null;
    }
  }
  return stored.token;
}

function expireSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  // AuthContext listens for this to clear its in-memory state immediately
  // (a raw localStorage removal alone wouldn't re-render anything).
  window.dispatchEvent(new Event('zivdah-auth-expired'));
}

function toApiError(error) {
  const message =
    error.response?.data?.message || error.message || 'Something went wrong. Please try again.';
  return { message, statusCode: error.response?.status };
}

apiClient.interceptors.response.use(
  (response) => {
    // Unwrap the ApiResponse<T> envelope { status, message, statusCode, data } so
    // callers work directly with T.
    const body = response.data;
    if (body && typeof body === 'object' && 'data' in body) {
      return { ...response, data: body.data };
    }
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const original = error.config;
    const skipRefresh = !original || original._retry || NO_REFRESH_PATHS.some((p) => original.url?.includes(p));

    if (status === 401 && !skipRefresh && readStoredAuth()?.refreshToken) {
      original._retry = true;
      try {
        const sentToken = original.headers?.Authorization?.replace(/^Bearer /, '');
        const storedToken = getStoredToken();
        // Another tab (sharing this localStorage) may have already refreshed — reuse its
        // token rather than presenting a refresh token that tab has just rotated away.
        const token = storedToken && storedToken !== sentToken ? storedToken : await refreshAccessToken();
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      } catch (refreshError) {
        expireSession();
        return Promise.reject(toApiError(refreshError.response ? refreshError : error));
      }
    }

    if (status === 401 && !NO_REFRESH_PATHS.some((p) => original?.url?.includes(p))) {
      expireSession();
    }
    return Promise.reject(toApiError(error));
  }
);
