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
  window.addEventListener('load', () => {
    // We register the firebase-messaging-sw.js directly as it now contains both
    // the FCM logic and the caching logic.
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then(registration => {
        console.log('Main SW registered successfully with scope: ', registration.scope);
      })
      .catch(err => {
        console.error('Main SW registration failed:', err);
        console.error('Message:', err.message);
      });
  });
}
