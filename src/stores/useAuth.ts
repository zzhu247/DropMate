import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  onAuthStateChanged,
  signInWithCredential,
  OAuthProvider,
  User,
  UserCredential,
} from 'firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';

import { auth } from '@/config/firebase';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';

const TOKEN_KEY = 'dropmate_auth_token_v1';

export type SignInPayload = {
  email: string;
  password: string;
};

export type SignUpPayload = {
  email: string;
  password: string;
  displayName?: string;
};

export type AuthStatus = 'idle' | 'loading' | 'authenticated';

type AuthState = {
  user: User | null;
  token: string | null;
  status: AuthStatus;
  error?: string;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  signIn: (payload: SignInPayload) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (displayName: string) => Promise<void>;
  getIdToken: () => Promise<string | null>;
};

// Initialize auth state listener
let unsubscribe: (() => void) | null = null;

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  status: 'idle',
  error: undefined,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) {
      return;
    }

    // Set up Firebase auth state listener
    if (!unsubscribe) {
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          // User is signed in
          try {
            const token = await user.getIdToken();
            await SecureStore.setItemAsync(TOKEN_KEY, token);
            set({
              user,
              token,
              status: 'authenticated',
              error: undefined,
            });
          } catch (error) {
            console.error('Error getting ID token:', error);
            set({
              user,
              token: null,
              status: 'authenticated',
              error: undefined,
            });
          }
        } else {
          // User is signed out
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          set({
            user: null,
            token: null,
            status: 'idle',
            error: undefined,
          });
        }
      });
    }

    // Mark as hydrated immediately after setting up listener
    set({ hydrated: true });
  },

  signIn: async ({ email, password }) => {
    set({ status: 'loading', error: undefined });

    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const token = await userCredential.user.getIdToken();
      await SecureStore.setItemAsync(TOKEN_KEY, token);

      set({
        user: userCredential.user,
        token,
        status: 'authenticated',
        error: undefined,
      });
    } catch (error) {
      const errorMessage = getFirebaseErrorMessage(error);
      set({
        status: 'idle',
        error: errorMessage,
      });
      throw error;
    }
  },

  signUp: async ({ email, password, displayName }) => {
    set({ status: 'loading', error: undefined });

    try {
      const userCredential: UserCredential =
        await createUserWithEmailAndPassword(auth, email, password);

      // Update display name if provided
      if (displayName) {
        await firebaseUpdateProfile(userCredential.user, { displayName });
      }

      const token = await userCredential.user.getIdToken();
      await SecureStore.setItemAsync(TOKEN_KEY, token);

      set({
        user: userCredential.user,
        token,
        status: 'authenticated',
        error: undefined,
      });
    } catch (error) {
      const errorMessage = getFirebaseErrorMessage(error);
      set({
        status: 'idle',
        error: errorMessage,
      });
      throw error;
    }
  },

  signInWithApple: async () => {
    set({ status: 'loading', error: undefined });

    try {
      // Request Apple authentication
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Create Firebase credential from Apple ID token
      const provider = new OAuthProvider('apple.com');
      const firebaseCredential = provider.credential({
        idToken: credential.identityToken || undefined,
        rawNonce: undefined,
      });

      // Sign in to Firebase with Apple credential
      const userCredential: UserCredential = await signInWithCredential(
        auth,
        firebaseCredential
      );

      // Update profile with Apple-provided name if available and not already set
      if (
        credential.fullName &&
        !userCredential.user.displayName &&
        (credential.fullName.givenName || credential.fullName.familyName)
      ) {
        const displayName = [
          credential.fullName.givenName,
          credential.fullName.familyName,
        ]
          .filter(Boolean)
          .join(' ');

        if (displayName) {
          await firebaseUpdateProfile(userCredential.user, { displayName });
        }
      }

      const token = await userCredential.user.getIdToken();
      await SecureStore.setItemAsync(TOKEN_KEY, token);

      set({
        user: userCredential.user,
        token,
        status: 'authenticated',
        error: undefined,
      });
    } catch (error: any) {
      // Handle Apple-specific cancellation
      if (error.code === 'ERR_REQUEST_CANCELED') {
        set({
          status: 'idle',
          error: 'Sign in was cancelled.',
        });
        return;
      }

      const errorMessage = getFirebaseErrorMessage(error);
      set({
        status: 'idle',
        error: errorMessage,
      });
      throw error;
    }
  },

  signOut: async () => {
    try {
      await firebaseSignOut(auth);
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      set({
        user: null,
        token: null,
        status: 'idle',
        error: undefined,
      });
    } catch (error) {
      const errorMessage = getFirebaseErrorMessage(error);
      set({ error: errorMessage });
      throw error;
    }
  },

  resetPassword: async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      const errorMessage = getFirebaseErrorMessage(error);
      throw new Error(errorMessage);
    }
  },

  updateProfile: async (displayName: string) => {
    const { user } = get();
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    try {
      await firebaseUpdateProfile(user, { displayName });
      // Trigger a state update to reflect the new display name
      set({ user: { ...user } });
    } catch (error) {
      const errorMessage = getFirebaseErrorMessage(error);
      throw new Error(errorMessage);
    }
  },

  getIdToken: async (): Promise<string | null> => {
    const { user } = get();
    if (!user) {
      return null;
    }

    try {
      return await user.getIdToken(/* forceRefresh */ true);
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  },
}));
