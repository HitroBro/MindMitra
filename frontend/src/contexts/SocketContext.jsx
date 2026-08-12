import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { authApi } from '../services/auth.api';
import { getAccessToken, setAccessToken } from '../services/axiosInstance';

const SocketContext = createContext(null);
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      if (socket) socket.disconnect();
      setSocket(null);
      setConnected(false);
      return;
    }

    const newSocket = io(SOCKET_URL, {
      auth: (cb) => cb({ token: getAccessToken() }),
      transports: ['websocket'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('[SocketContext] connected');
      setConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[SocketContext] disconnected', reason);
      setConnected(false);
    });

    // AuthContext proactively refreshes the access token before it expires,
    // so this should be rare. But if a reconnect ever still lands on a
    // stale/invalid token (e.g. a race right at the refresh boundary),
    // force a fresh token now and retry immediately — otherwise socket.io
    // just keeps retrying with the same stale token on every attempt and
    // the connection stays dead until the page is reloaded.
    let recovering = false;
    newSocket.on('connect_error', async (err) => {
      console.error('[SocketContext] connect_error', err.message);
      if (recovering) return;
      const isAuthError = /token/i.test(err.message) || /auth/i.test(err.message);
      if (!isAuthError) return;

      recovering = true;
      try {
        const { data } = await authApi.refresh();
        setAccessToken(data.data.accessToken);
        newSocket.connect();
      } catch (refreshErr) {
        console.error('[SocketContext] Failed to recover session for socket reconnect', refreshErr.message);
      } finally {
        recovering = false;
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.off();
      newSocket.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};
