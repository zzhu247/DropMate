import { initializeApp, FirebaseApp, getApp } from 'firebase/app';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
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

  // Initialize Auth with AsyncStorage persistence for React Native
  // Import getReactNativePersistence dynamically to avoid TypeScript errors
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getReactNativePersistence } = require('firebase/auth/react-native');
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Fallback to regular auth if react-native persistence is not available
    auth = getAuth(app);
  }
}

export { app, auth };
export default app;
