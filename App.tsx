import React, { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';

import { RootNavigator } from '@/navigation/RootNavigator';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useUI } from '@/stores/useUI';
import { useNotification } from '@/stores/useNotification';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { NotificationListener } from '@/components/NotificationListener';
import { configureNotificationHandler } from '@/services/notificationService';

const queryClient = new QueryClient();

// Configure how notifications are displayed when app is in foreground
configureNotificationHandler();

// Inner component that has access to QueryClient
const AppContent: React.FC = () => {
  const hydrateNotifications = useNotification((state) => state.hydrate);
  const notificationListener = useRef<Notifications.Subscription>();

  // Auto-register push notifications on login
  usePushNotifications();

  // Auto-sync data via WebSocket and app foreground (requires QueryClient)
  useRealtimeSync();

  useEffect(() => {
    // Hydrate notification store
    hydrateNotifications();

    // Listen for notifications received while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
    };
  }, [hydrateNotifications]);

  return (
    <>
      <NotificationListener />
      <RootNavigator />
    </>
  );
};

const App: React.FC = () => {
  const themePreference = useUI((state) => state.themePreference);

  const overrideSystem = themePreference !== 'system';
  const preferredMode = overrideSystem ? (themePreference as 'light' | 'dark') : undefined;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider mode={preferredMode} overrideSystem={overrideSystem}>
            <StatusBar style={preferredMode === 'dark' ? 'light' : 'dark'} />
            <AppContent />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
