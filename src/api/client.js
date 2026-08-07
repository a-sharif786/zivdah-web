import axios from 'axios';

// Shared with AuthContext.jsx — both read/write this same localStorage key so the
// interceptor below can attach the token without importing AuthContext (would be circular).
export const AUTH_STORAGE_KEY = 'zivdah_auth';

function getStoredToken() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw)?.token ?? null : null;
  } catch {
    return null;
  }
}

const baseURL = import.meta.env.VITE_API_BASE_URL;

export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message || error.message || 'Something went wrong. Please try again.';
    if (status === 401) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      // AuthContext listens for this to clear its in-memory state immediately
      // (a raw localStorage removal alone wouldn't re-render anything).
      window.dispatchEvent(new Event('zivdah-auth-expired'));
    }
    return Promise.reject({ message, statusCode: status });
  }
);
