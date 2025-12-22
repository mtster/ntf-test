
# FCM Tester Setup Instructions

To get this app working with your Firebase project, follow these steps:

### 1. Environment Variables / Configuration
Modify the file `firebase-config.ts`. You need the following values from your Firebase Console:
- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`

### 2. VAPID Key Location
The VAPID key is critical for web push on iOS. 
1. Go to **Firebase Console** > **Project Settings** > **Cloud Messaging**.
2. Scroll down to **Web configuration** > **Web Push certificates**.
3. Generate a key pair if you haven't already.
4. Copy the **Public Key**.
5. Paste it into the `VAPID_KEY` constant in `firebase-config.ts`.

### 3. Background Messaging Service Worker
Ensure the `messagingSenderId` inside `firebase-messaging-sw.js` matches your project's sender ID. This file must reside in your public root directory for Firebase to detect it.

### 4. iOS 18 Requirements
- The app **must** be served over HTTPS.
- The user **must** "Add to Home Screen" to enable full PWA capabilities, including Push Notifications.
- iOS only allows permission requests that are triggered by a direct user action (like clicking the "Enable Notifications" button).

### 5. Environment Variables Used
The app uses the following conceptual environment variables (mapped in `firebase-config.ts`):
- `VITE_FIREBASE_API_KEY` (mapped to `apiKey`)
- `VITE_FIREBASE_AUTH_DOMAIN` (mapped to `authDomain`)
- `VITE_FIREBASE_PROJECT_ID` (mapped to `projectId`)
- `VITE_FIREBASE_STORAGE_BUCKET` (mapped to `storageBucket`)
- `VITE_FIREBASE_MESSAGING_SENDER_ID` (mapped to `messagingSenderId`)
- `VITE_FIREBASE_APP_ID` (mapped to `appId`)
- `VITE_FIREBASE_VAPID_KEY` (mapped to `VAPID_KEY`)
