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

      // CRITICAL CHANGE: Manually register the Service Worker first
      // This ensures we have a valid registration to pass to getToken, which is required
      // for stable operation on iOS 17/18 PWA.
      let registration;
      try {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('SW Registered for Token Request:', registration);
      } catch (swErr) {
        console.error('Failed to register SW during token request:', swErr);
        throw new Error('Service Worker registration failed.');
      }

      // Request the token using the explicit registration
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