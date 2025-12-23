
/* eslint-disable no-undef */
// Give the service worker access to Firebase Messaging.
// Note: compat versions are used here for simpler script-based import.
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

console.log('[firebase-messaging-sw.js] Service Worker script loading...');

// Initialize Firebase in the service worker with hardcoded values
try {
  firebase.initializeApp({
    apiKey: "AIzaSyAfKsRB46yjdh6J0Nmt0u-XvTpR88A-cRA",
    authDomain: "ntf-test-64abf.firebaseapp.com",
    projectId: "ntf-test-64abf",
    storageBucket: "ntf-test-64abf.firebasestorage.app",
    messagingSenderId: "595903573586",
    appId: "1:595903573586:web:ec7ed0bffb13cc47d5f98b"
  });

  const messaging = firebase.messaging();

  // Handle background messages
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
    const notificationTitle = payload.notification?.title || 'New Message';
    const notificationOptions = {
      body: payload.notification?.body || 'You have a new notification.',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
  
  console.log('[firebase-messaging-sw.js] Firebase initialized successfully');
} catch (error) {
  console.error('[firebase-messaging-sw.js] Initialization error:', error);
}
