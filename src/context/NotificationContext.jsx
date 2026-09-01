import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { notificationApi } from '../api/notificationApi';
import { authApi } from '../api/authApi';
import { getFcmToken, onForegroundMessage } from '../firebase';

const NotificationContext = createContext();

const LAST_SEEN_KEY = 'zivdah_notifications_last_seen';
const POLL_INTERVAL_MS = 60_000;

export function NotificationProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  // "Unread" isn't tracked server-side (no isRead/readAt column) — approximated client-side
  // as "created after the last time this browser visited the notifications page", same idea
  // as any simple locally-remembered read-state.
  const [lastSeenAt, setLastSeenAt] = useState(() => localStorage.getItem(LAST_SEEN_KEY));

  const refresh = useCallback(() => {
    if (!isAuthenticated || !user) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    notificationApi
      .getByUser(user.id)
      .then((list) =>
        setNotifications([...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
      )
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Light polling so the header badge picks up new notifications without a full page reload.
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isAuthenticated, refresh]);

  // Registers this browser for push once per authenticated session, and refreshes
  // immediately when a foreground push arrives instead of waiting for the next poll.
  // Background pushes (tab not focused) are instead handled by
  // public/firebase-messaging-sw.js.
  useEffect(() => {
    if (!isAuthenticated || !user) return undefined;

    let cancelled = false;
    getFcmToken().then((token) => {
      if (!cancelled && token) {
        // Best-effort — a failed sync just means the previously stored token (if any)
        // stays in place until the next successful one.
        authApi.registerDeviceToken(token).catch(() => {});
      }
    });

    const unsubscribe = onForegroundMessage((payload) => {
      refresh();
      if (Notification.permission === 'granted') {
        const { title, body } = payload.notification || {};
        new Notification(title || 'Zivdah', { body, icon: '/logo.svg' });
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [isAuthenticated, user, refresh]);

  const markSeen = useCallback(() => {
    const now = new Date().toISOString();
    localStorage.setItem(LAST_SEEN_KEY, now);
    setLastSeenAt(now);
  }, []);

  const unreadCount = lastSeenAt
    ? notifications.filter((n) => new Date(n.createdAt) > new Date(lastSeenAt)).length
    : notifications.length;

  return (
    <NotificationContext.Provider value={{ notifications, loading, unreadCount, refresh, markSeen }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
