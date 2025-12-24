import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Basic Service Worker Registration for PWA Installability
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // We just register it here to ensure the browser sees the PWA as installable.
      // The actual "use" of the SW for FCM happens in firebaseService.ts
      await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
      console.log('[Index] Main SW registered.');
    } catch (err: any) {
      console.error('[Index] Main SW registration failed:', err);
    }
  });
}