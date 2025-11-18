import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from '@/stores/useAuth';
import { useNotification } from '@/stores/useNotification';

/**
 * Hook to automatically handle push notification registration
 *
 * This hook:
 * 1. Registers push token when user logs in
 * 2. Re-registers on app foreground (if needed)
 * 3. Handles token refresh
 * 4. Cleans up on logout
 */
export const usePushNotifications = () => {
  const { user, status } = useAuth();
  const {
    permissionStatus,
    registerForPushNotifications,
    pushToken
  } = useNotification();

  const hasRegistered = useRef(false);
  const appState = useRef(AppState.currentState);

  // Auto-register when user logs in
  useEffect(() => {
    const attemptRegistration = async () => {
      // Only register if:
      // 1. User is authenticated
      // 2. Haven't registered yet in this session
      // 3. Permissions are granted OR we can request them
      if (
        status === 'authenticated' &&
        user &&
        !hasRegistered.current
      ) {
        console.log('🔵 [AUTO-REGISTER] User authenticated, attempting push token registration...');

        try {
          const token = await registerForPushNotifications();

          if (token) {
            console.log('✅ [AUTO-REGISTER] Push token registered successfully');
            hasRegistered.current = true;
          } else {
            console.log('🟡 [AUTO-REGISTER] Push token registration skipped (permissions or device)');
          }
        } catch (error) {
          console.error('🔴 [AUTO-REGISTER] Failed to register push token:', error);
          // Will retry on next app foreground
        }
      }
    };

    attemptRegistration();
  }, [status, user, registerForPushNotifications]);

  // Reset registration flag on logout
  useEffect(() => {
    if (status === 'idle' || !user) {
      hasRegistered.current = false;
      console.log('🔵 [AUTO-REGISTER] User logged out, reset registration flag');
    }
  }, [status, user]);

  // Re-register when app comes to foreground (handles token refresh)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // App came to foreground
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('🔵 [AUTO-REGISTER] App foregrounded');

        // Only re-register if user is logged in and we had registered before
        if (status === 'authenticated' && user && hasRegistered.current) {
          console.log('🔵 [AUTO-REGISTER] Checking if token needs refresh...');

          try {
            // Re-register (will use cached token if still valid)
            await registerForPushNotifications();
            console.log('✅ [AUTO-REGISTER] Token refresh check complete');
          } catch (error) {
            console.error('🔴 [AUTO-REGISTER] Token refresh failed:', error);
          }
        }
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [status, user, registerForPushNotifications]);

  return {
    isRegistered: hasRegistered.current,
    permissionStatus,
    pushToken,
  };
};
