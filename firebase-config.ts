
/**
 * Firebase Project Configuration
 * Uses environment variables for configuration.
 * Ensure these are set in your deployment environment (e.g., Vercel, Netlify) 
 * or a local .env file with the VITE_ prefix.
 */

// Fix: Access environment variables using type casting to avoid "Property 'env' does not exist on type 'ImportMeta'" errors
const metaEnv = (import.meta as any).env;

export const FIREBASE_CONFIG = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: metaEnv.VITE_FIREBASE_APP_ID
};

/**
 * VAPID KEY
 * Used for Web Push certificates.
 */
// Fix: Access VAPID_KEY using type-casted metaEnv
export const VAPID_KEY = metaEnv.VITE_FIREBASE_VAPID_KEY;
