
/**
 * Firebase Project Configuration
 * Uses environment variables for configuration.
 * Safely handles environments where import.meta.env might be undefined.
 */

/**
 * Helper to safely retrieve environment variables across different runtimes.
 * It checks Vite's import.meta.env first, then falls back to process.env.
 */
const getEnv = (key: string): string => {
  // 1. Try import.meta.env (Vite/ESM standard)
  try {
    const meta = import.meta as any;
    if (meta && meta.env && meta.env[key] !== undefined) {
      return meta.env[key];
    }
  } catch (e) {
    // import.meta might not be supported in some environments
  }

  // 2. Try process.env (Node/CommonJS/Bundler fallback)
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
      return process.env[key] as string;
    }
  } catch (e) {
    // process might not be defined
  }

  // 3. Fallback to empty string to prevent "undefined is not an object" errors
  return "";
};

export const FIREBASE_CONFIG = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID')
};

/**
 * VAPID KEY
 * Used for Web Push certificates.
 */
export const VAPID_KEY = getEnv('VITE_FIREBASE_VAPID_KEY');
