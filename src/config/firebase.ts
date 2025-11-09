import { initializeApp, FirebaseApp, getApp } from 'firebase/app';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
// @ts-ignore - getReactNativePersistence exists in @firebase/auth but not in types
import { getReactNativePersistence } from '@firebase/auth/dist/rn/index.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
// Note: These values are safe to expose in client-side code
// API key restrictions should be configured in Firebase Console
const firebaseConfig = {
  apiKey: 'AIzaSyDhVe6Q8aJyK0vAWMJsrPIECw7hQZiVD5o',
  authDomain: 'dropmate-9dc10.firebaseapp.com',
  projectId: 'dropmate-9dc10',
  storageBucket: 'dropmate-9dc10.firebasestorage.app',
  messagingSenderId: '765867938215',
  appId: '1:765867938215:web:f63457ca27261641a6e682',
  measurementId: 'G-4ELJ8G7W46',
};

// Initialize Firebase app
let app: FirebaseApp;
let auth: Auth;

try {
  // Try to get existing app first
  app = getApp();
  // Try to get existing auth instance
  auth = getAuth(app);
} catch {
  // If no app exists, initialize one
  app = initializeApp(firebaseConfig);

  // Initialize Auth with React Native AsyncStorage persistence
  // This ensures auth state persists across app restarts
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

// Analytics is web-only, so we conditionally initialize it
// For React Native, you would use Firebase Analytics for React Native instead
// We'll skip analytics for now as it's not critical for auth
// If needed later, install: @react-native-firebase/analytics

export { app, auth };
export default app;
