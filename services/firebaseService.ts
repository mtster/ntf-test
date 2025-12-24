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
      // We use scope: '/' to ensure it controls the whole app
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
      
      // 2. Wait for the Service Worker to be Active (with timeout fallback)
      // This logic prevents the app from hanging if the SW state doesn't update immediately
      const waitForActive = new Promise((resolve) => {
        if (registration.active) {
            resolve(registration.active);
            return;
        }

        const serviceWorker = registration.installing || registration.waiting;
        if (serviceWorker) {
            const stateListener = (e: Event) => {
                if ((e.target as ServiceWorker).state === 'activated') {
                    serviceWorker.removeEventListener('statechange', stateListener);
                    resolve(registration.active);
                }
            };
            serviceWorker.addEventListener('statechange', stateListener);
        } else {
             // If we can't find a worker to listen to, just resolve null and let the race condition handle it
             resolve(null);
        }
      });

      console.log('Waiting for Service Worker activation...');
      
      // Race: Wait for activation OR 5 seconds, then proceed.
      // This ensures we attempt to get the token even if the 'statechange' event is missed.
      await Promise.race([
          waitForActive,
          new Promise((resolve) => setTimeout(resolve, 5000))
      ]);
      
      console.log('Proceeding to get token...');

      // 3. Get the token using the registration
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