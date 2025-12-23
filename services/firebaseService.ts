import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';
import { FIREBASE_CONFIG, VAPID_KEY } from '../firebase-config';

// Initialize Firebase
const app = initializeApp(FIREBASE_CONFIG);

let messagingInstance: Messaging | null = null;

/**
 * Checks if FCM is supported in the current environment.
 */
export const isFCMSupported = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false;
  try {
    return await isSupported();
  } catch (e) {
    return false;
  }
};

const getMessagingSafe = async (): Promise<Messaging | null> => {
  if (messagingInstance) return messagingInstance;
  if (await isFCMSupported()) {
    try {
      messagingInstance = getMessaging(app);
      return messagingInstance;
    } catch (err) {
      console.warn('Messaging initialization failed:', err);
      return null;
    }
  }
  return null;
};

export const requestNotificationPermission = async (): Promise<string | null> => {
  // iOS 17+ specific check: Notification object might be undefined if not Added to Home Screen
  if (typeof Notification === 'undefined') {
    throw new Error('Push Notifications are not supported in this environment. If on iOS, ensure you have added the app to your Home Screen.');
  }

  const messaging = await getMessagingSafe();
  if (!messaging) {
    throw new Error('Firebase Messaging is not supported in this browser.');
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');

      // 1. Ensure registration exists by calling register. 
      // If it's already registered, this is a no-op that returns the registration.
      try {
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      } catch (swErr) {
        console.error('Failed to register SW during token request:', swErr);
        throw new Error('Service Worker registration failed.');
      }

      // 2. WAIT for it to be ready. 
      // This is the specific fix for "Subscribing for push requires an active service worker".
      // It ensures the SW is in the 'active' state before we ask Firebase to use it.
      console.log('Waiting for SW to be ready...');
      const registration = await navigator.serviceWorker.ready;
      console.log('SW is ready:', registration);

      // 3. Request the token using the ready registration
      const token = await getToken(messaging, { 
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration 
      });
      
      return token;
    } else {
      console.warn('Notification permission denied.');
      return null;
    }
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
    throw error;
  }
};

export const onMessageListener = async () => {
  const messaging = await getMessagingSafe();
  if (!messaging) return null;

  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
};