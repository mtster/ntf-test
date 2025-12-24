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
    console.warn('FCM support check failed:', e);
    return false;
  }
};

const getMessagingSafe = async (): Promise<Messaging | null> => {
  if (messagingInstance) return messagingInstance;
  const supported = await isFCMSupported();
  if (supported) {
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
    throw new Error('Push Notifications are not supported. If on iOS, ensure you have added the app to your Home Screen.');
  }

  const messaging = await getMessagingSafe();
  if (!messaging) {
    throw new Error('Firebase Messaging is not supported in this browser.');
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');

      // 1. Explicitly register the Service Worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
      
      // 2. IMPORTANT: Wait for the Service Worker to be active/ready
      // This prevents "Subscribing for push requires an active service worker" error
      console.log('Waiting for Service Worker to be ready...');
      await navigator.serviceWorker.ready;
      console.log('Service Worker is ready.');

      // 3. Get the token using the ready registration
      const token = await getToken(messaging, { 
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration 
      });
      
      console.log("FCM TOKEN RETRIEVED:", token);
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