// Background push handler. Vite copies everything under public/ to the site root, so this
// file is reachable at /firebase-messaging-sw.js as required by the default FCM service
// worker scope. It can't read import.meta.env (Vite doesn't process this file), so
// src/firebase.js passes the same, public/non-secret Firebase config through the
// registration URL's query string instead — see registerServiceWorker() there.
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

const params = new URLSearchParams(self.location.search);
firebase.initializeApp({
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  storageBucket: params.get('storageBucket'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId'),
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || 'Zivdah', {
    body: body || '',
    icon: '/logo.svg',
    data: payload.data,
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow('/'));
});
