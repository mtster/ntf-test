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
      // Check if already registered to avoid redundant network calls or state issues
      const existingRegistration = await navigator.serviceWorker.getRegistration('/');
      
      if (existingRegistration && existingRegistration.active && existingRegistration.active.scriptURL.includes('firebase-messaging-sw.js')) {
        console.log('Main SW already registered:', existingRegistration.scope);
        return;
      }

      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { 
        scope: '/' 
      });
      console.log('Main SW registered successfully with scope:', registration.scope);
    } catch (err: any) {
      console.error('Main SW registration failed:', err);
      console.error('Error Name:', err.name);
      console.error('Error Message:', err.message);
    }
  });
}