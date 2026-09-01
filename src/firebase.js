import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

// Public, non-secret client identifiers for the Firebase Web app registered under the
// existing "zivdahonlicery" project (Android/iOS siblings live in zivdah-flutter). Fill
// these in via Firebase Console -> Project settings -> Add app -> Web, and the VAPID key
// via Project settings -> Cloud Messaging -> Web Push certificates.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Only initialize once the Web app has actually been configured — keeps every other
// function in this file a safe no-op (returning null) until then, instead of throwing.
const app = firebaseConfig.apiKey ? initializeApp(firebaseConfig) : null;

// firebase-messaging-sw.js is a static file Vite doesn't process, so it can't read
// import.meta.env — the same (public, non-secret) config is passed through the
// registration URL's query string instead, so both stay in sync automatically.
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const params = new URLSearchParams(firebaseConfig);
    return await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${params.toString()}`);
  } catch (err) {
    console.warn('[fcm] service worker registration failed', err);
    return null;
  }
}

/**
 * Requests notification permission and returns a real FCM registration token, or null if
 * push isn't available right now — unsupported browser, insecure context, the Web app not
 * configured yet, or the user denies/dismisses the permission prompt. Never throws; callers
 * should fall back to their own existing behavior on null.
 */
export async function getFcmToken() {
  if (!app || !vapidKey) return null;
  try {
    if (!(await isSupported())) return null;
    const registration = await registerServiceWorker();
    if (!registration) return null;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
    return token || null;
  } catch (err) {
    console.warn('[fcm] could not get a token', err);
    return null;
  }
}

/**
 * Foreground push listener — a message that arrives while this tab is focused doesn't go
 * through firebase-messaging-sw.js's background handler, so callers need this to react to
 * it themselves (e.g. refresh a list, show a toast). Returns a no-op unsubscribe when push
 * isn't configured.
 */
export function onForegroundMessage(callback) {
  if (!app) return () => {};
  return onMessage(getMessaging(app), callback);
}
