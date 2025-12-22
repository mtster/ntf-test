
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';
import { FIREBASE_CONFIG, VAPID_KEY } from '../firebase-config';

// Initialize Firebase
const app = initializeApp(FIREBASE_CONFIG);

let messagingInstance: Messaging | null = null;

/**
 * Checks if FCM is supported in the current environment.
 * On iOS, this returns true only if the app is added to the Home Screen.
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
  const messaging = await getMessagingSafe();
  if (!messaging || !('Notification' in window)) {
    throw new Error('Push Notifications are not supported in this browser environment. Ensure you have added the app to your Home Screen.');
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { 
        vapidKey: VAPID_KEY 
      });
      return token;
    }
    return null;
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
