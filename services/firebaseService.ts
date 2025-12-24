import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';
import { FIREBASE_CONFIG, VAPID_KEY } from '../firebase-config';

// Initialize Firebase
const app = initializeApp(FIREBASE_CONFIG);

let messagingInstance: Messaging | null = null;

/**
 * Checks if FCM is supported in the current environment with granular logging.
 */
export const isFCMSupported = async (): Promise<boolean> => {
  console.log('[FCM Check] Starting support check...');
  
  if (typeof window === 'undefined') {
    console.warn('[FCM Check] Failed: Window is undefined.');
    return false;
  }
  
  if (!('serviceWorker' in navigator)) {
    console.warn('[FCM Check] Failed: navigator.serviceWorker is missing.');
    return false;
  }

  if (!('PushManager' in window)) {
    console.warn('[FCM Check] Failed: window.PushManager is missing.');
    return false;
  }

  if (!('Notification' in window)) {
    console.warn('[FCM Check] Failed: window.Notification is missing.');
    return false;
  }

  try {
    const firebaseSupported = await isSupported();
    if (!firebaseSupported) {
        console.warn('[FCM Check] Firebase isSupported() returned false.');
    }
    return firebaseSupported;
  } catch (e) {
    console.error('[FCM Check] Exception during isSupported():', e);
    return false;
  }
};

const getMessagingSafe = async (): Promise<Messaging | null> => {
  if (messagingInstance) return messagingInstance;
  
  // We re-run support check just to be safe, but usually App.tsx handles this
  try {
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (err) {
    console.error('[Messaging Init] Failed to get messaging instance:', err);
    return null;
  }
};

export const requestNotificationPermission = async (): Promise<string | null> => {
  console.log('[Permission] Requesting notification permission...');

  // iOS 17+ specific check
  if (typeof Notification === 'undefined') {
    throw new Error('Push Notifications not supported (Notification API missing). Add to Home Screen?');
  }

  const messaging = await getMessagingSafe();
  if (!messaging) {
    throw new Error('Firebase Messaging failed to initialize.');
  }

  try {
    const permission = await Notification.requestPermission();
    console.log(`[Permission] Status: ${permission}`);

    if (permission === 'granted') {
      
      // --- ROBUST REGISTRATION FLOW ---
      
      // 1. Register
      console.log('[SW] Registering /firebase-messaging-sw.js ...');
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { 
        scope: '/' 
      });
      console.log('[SW] Registration successful. Scope:', registration.scope);

      // 2. Wait for Ready
      console.log('[SW] Waiting for navigator.serviceWorker.ready ...');
      const readyRegistration = await navigator.serviceWorker.ready;
      console.log('[SW] Ready! Active worker state:', readyRegistration.active?.state);

      if (!readyRegistration.active) {
         console.warn('[SW] Ready returned, but .active is null?');
      }

      // 3. Get Token
      console.log('[FCM] Calling getToken...');
      const token = await getToken(messaging, { 
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: readyRegistration 
      });
      
      console.log("[FCM] Token retrieved successfully.");
      return token;
    } else {
      console.warn('[Permission] User denied permissions.');
      return null;
    }
  } catch (error) {
    console.error('[Token Error] Error retrieving token:', error);
    throw error;
  }
};

export const onMessageListener = async () => {
  const messaging = await getMessagingSafe();
  if (!messaging) return null;

  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('[Listener] Message received in foreground:', payload);
      resolve(payload);
    });
  });
};