import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { authApi } from '../services/auth.api';
import { setAccessToken } from '../services/axiosInstance';

const AuthContext = createContext(null);

// Decode a JWT's payload without pulling in a library — we only need the
// `exp` claim to know when to schedule a proactive refresh.
const decodeJwtExpiryMs = (token) => {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return payload.exp ? payload.exp * 1000 : null;
  } catch (err) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef(null);

  // Refresh the access token ~1 minute before it actually expires, and keep
  // rescheduling after each successful refresh. Without this, any session
  // that goes 15+ minutes (the access token lifetime) without an
  // intervening HTTP request — sitting in a video call is the clearest
  // example — silently ends up with a stale token in memory. A WebSocket
  // reconnect during that window then gets rejected with "Invalid socket
  // token" and never recovers, since sockets have no way to trigger the
  // reactive (401-driven) refresh path in axiosInstance.js themselves.
  const scheduleRefresh = useCallback((token) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const expiresAt = token && decodeJwtExpiryMs(token);
    if (!expiresAt) return;

    const REFRESH_BUFFER_MS = 60_000;
    const delay = Math.max(expiresAt - Date.now() - REFRESH_BUFFER_MS, 5_000);

    refreshTimerRef.current = setTimeout(async () => {
      try {
        const { data } = await authApi.refresh();
        const newToken = data.data.accessToken;
        setAccessToken(newToken);
        scheduleRefresh(newToken);
      } catch (err) {
        // Refresh token itself is gone (7-day inactivity limit, logged out
        // elsewhere, etc). Clear local state; the next request will 401 and
        // the axios interceptor / ProtectedRoute already route back to
        // /login from there.
        setAccessToken(null);
        setUser(null);
      }
    }, delay);
  }, []);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  // On first load, try silent refresh (httpOnly cookie) to restore session
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const { data } = await authApi.refresh();
        const token = data.data.accessToken;
        setAccessToken(token);
        scheduleRefresh(token);
        const me = await authApi.me();
        setUser(me.data.data);
      } catch (err) {
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [scheduleRefresh]);

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login({ email, password });
    setAccessToken(data.data.accessToken);
    scheduleRefresh(data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  }, [scheduleRefresh]);

  const register = useCallback(async (payload) => {
    const { data } = await authApi.register(payload);
    setAccessToken(data.data.accessToken);
    scheduleRefresh(data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  }, [scheduleRefresh]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      // ignore — clear client state regardless
    }
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    setAccessToken(null);
    setUser(null);
    toast.success('Logged out');
  }, []);

  const value = { user, setUser, loading, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
