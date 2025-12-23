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

// Register the Consolidated Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Register the service worker pointing to the root URL (handled by rewrites to public/)
      // Explicitly set scope to '/' to ensure it covers all routes
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
      console.log('Main SW registered successfully with scope:', registration.scope);
    } catch (err: any) {
      console.error('Main SW registration failed:', err);
    }
  });
}