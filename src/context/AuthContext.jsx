import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { authApi } from '../api/authApi';
import { AUTH_STORAGE_KEY } from '../api/client';

const AuthContext = createContext();

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth);
  // CartContext registers itself here so login() can trigger the guest-cart merge.
  // Avoids a circular import: CartContext needs auth's token/user, AuthContext would
  // otherwise need CartContext's merge function.
  const onLoginRef = useRef(null);

  useEffect(() => {
    const onExpired = () => setAuth(null);
    window.addEventListener('zivdah-auth-expired', onExpired);
    return () => window.removeEventListener('zivdah-auth-expired', onExpired);
  }, []);

  // Accepts a LoginResponseDTO { id, mobile, name, email, role, token } — the shape
  // returned identically by /login, /verify-otp, and /verify-registration-otp.
  const login = useCallback((response) => {
    const nextAuth = {
      token: response.token,
      user: {
        id: response.id,
        name: response.name,
        email: response.email,
        mobile: response.mobile,
        role: response.role,
      },
    };
    // Write to localStorage synchronously (not via a useEffect) so the axios
    // interceptor — and the cart-merge callback fired right below — can read the
    // new token immediately, before React has re-rendered.
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
    setAuth(nextAuth);
    // Pass the freshly-logged-in user explicitly — the cart-merge callback fires
    // synchronously, before React commits the re-render that would update
    // useAuth()'s `user` inside CartContext, so it can't rely on context yet.
    onLoginRef.current?.(nextAuth.user);
    return nextAuth;
  }, []);

  const logout = useCallback(() => {
    authApi.logout().catch(() => {
      // best-effort — clear the local session regardless of whether the server call succeeds
    });
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuth(null);
  }, []);

  const registerCartMergeHandler = useCallback((fn) => {
    onLoginRef.current = fn;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: auth?.user ?? null,
        token: auth?.token ?? null,
        isAuthenticated: !!auth?.token,
        login,
        logout,
        registerCartMergeHandler,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
