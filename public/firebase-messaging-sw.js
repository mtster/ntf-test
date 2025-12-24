/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// --- Lifecycle Management (Force Activation) ---
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Installing and skipping waiting...');
  // Force this SW to become the active one immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Activating and claiming clients...');
  // Force this SW to control all open pages immediately
  event.waitUntil(self.clients.claim());
});

// --- Configuration ---
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAfKsRB46yjdh6J0Nmt0u-XvTpR88A-cRA",
  authDomain: "ntf-test-64abf.firebaseapp.com",
  projectId: "ntf-test-64abf",
  storageBucket: "ntf-test-64abf.firebasestorage.app",
  messagingSenderId: "595903573586", // Verified from firebase-config.ts
  appId: "1:595903573586:web:ec7ed0bffb13cc47d5f98b"
};

// --- Caching Configuration ---
const CACHE_NAME = 'fcm-tester-v5';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// --- Firebase Messaging Setup ---
console.log('[firebase-messaging-sw.js] Initializing Firebase...');

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

// --- Caching Logic (Standard PWA) ---
// Note: install/activate for caching moved to top for clarity, but standard fetch listeners remain

self.addEventListener('fetch', (event) => {
  // Simple cache-first strategy for static assets
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