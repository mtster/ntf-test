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

// Register the Consolidated Service Worker with root scope
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // We rely on 'vercel.json' rewriting '/firebase-messaging-sw.js' to '/public/firebase-messaging-sw.js'
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
      console.log('Main SW registered successfully with scope:', registration.scope);
    } catch (err: any) {
      console.error('Main SW registration failed:', err);
    }
  });
}