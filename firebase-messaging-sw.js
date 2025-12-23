/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// --- Configuration ---
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAfKsRB46yjdh6J0Nmt0u-XvTpR88A-cRA",
  authDomain: "ntf-test-64abf.firebaseapp.com",
  projectId: "ntf-test-64abf",
  storageBucket: "ntf-test-64abf.firebasestorage.app",
  messagingSenderId: "595903573586",
  appId: "1:595903573586:web:ec7ed0bffb13cc47d5f98b"
};

const CACHE_NAME = 'fcm-tester-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// --- Firebase Messaging Setup ---
console.log('[firebase-messaging-sw.js] Initializing...');

try {
  if (firebase.apps.length === 0) {
    firebase.initializeApp(FIREBASE_CONFIG);
    console.log('[firebase-messaging-sw.js] Firebase App Initialized');
  }

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Background message received:', payload);
    
    const notificationTitle = payload.notification?.title || 'New Message';
    const notificationOptions = {
      body: payload.notification?.body || 'You have a new notification.',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (error) {
  console.error('[firebase-messaging-sw.js] Firebase initialization error:', error);
}

// --- Caching Logic ---

self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Installing SW...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[firebase-messaging-sw.js] Caching app shell');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Activating SW...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[firebase-messaging-sw.js] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});