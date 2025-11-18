import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/stores/useAuth';
import { notificationService, ShipmentStatusUpdate, ShipmentLocationUpdate } from '@/api/notificationClient';
import { shipmentKeys } from '@/api/queryKeys';

/**
 * Hook to orchestrate real-time data synchronization
 *
 * This hook coordinates 3 data channels:
 * 1. WebSocket - Real-time updates when app is OPEN
 * 2. Push Notifications - Alerts when app is CLOSED
 * 3. App Foreground - Refresh when app comes to foreground
 *
 * Benefits:
 * - Always shows fresh data
 * - No duplicate updates
 * - Efficient (only refreshes when needed)
 */
export const useRealtimeSync = () => {
  const queryClient = useQueryClient();
  const { user, status } = useAuth();
  const appState = useRef(AppState.currentState);
  const isWebSocketConnected = useRef(false);

  // Connect to WebSocket when user is authenticated and app is active
  useEffect(() => {
    console.log('🔍 [SYNC] useEffect triggered - status:', status, 'user:', user?.email, 'appState:', appState.current);

    if (status !== 'authenticated' || !user) {
      // Disconnect if not authenticated
      if (isWebSocketConnected.current) {
        console.log('🔌 [SYNC] Disconnecting WebSocket (user logged out)');
        notificationService.disconnect();
        isWebSocketConnected.current = false;
      }
      console.log('⏸️ [SYNC] Not connecting - user not authenticated');
      return;
    }

    // Only connect if app is in foreground
    if (appState.current === 'active' && !isWebSocketConnected.current) {
      console.log('🔌 [SYNC] Attempting WebSocket connection...');
      console.log('🔌 [SYNC] Notification URL:', 'http://24.199.64.155');

      notificationService.connect({
        onConnected: (data) => {
          console.log('✅ [SYNC] WebSocket connected:', data.socketId);
          isWebSocketConnected.current = true;
        },

        onShipmentStatusUpdate: (data: ShipmentStatusUpdate) => {
          console.log('📦 [SYNC] ===== SHIPMENT STATUS UPDATE RECEIVED =====');
          console.log('📦 [SYNC] Shipment ID:', data.shipmentId);
          console.log('📦 [SYNC] New Status:', data.status);
          console.log('📦 [SYNC] Timestamp:', data.timestamp);

          // Invalidate queries to trigger refetch with fresh data
          console.log('🔄 [SYNC] Invalidating React Query cache with correct keys...');

          // Invalidate all shipment lists (all filters)
          queryClient.invalidateQueries({ queryKey: shipmentKeys.all });

          // Invalidate specific shipment detail
          queryClient.invalidateQueries({ queryKey: shipmentKeys.detail(String(data.shipmentId)) });

          // Invalidate route if it exists
          queryClient.invalidateQueries({ queryKey: shipmentKeys.route(String(data.shipmentId)) });

          console.log('✅ [SYNC] Cache invalidated - React Query should refetch now');

          // Show in-app notification (since user is actively using app)
          console.log(`✅ Shipment ${data.shipmentId} → ${data.status}`);
        },

        onShipmentLocationUpdate: (data: ShipmentLocationUpdate) => {
          console.log('📍 [SYNC] Shipment location updated:', data.shipmentId);

          // Update shipment location and route in cache
          queryClient.invalidateQueries({ queryKey: shipmentKeys.detail(String(data.shipmentId)) });
          queryClient.invalidateQueries({ queryKey: shipmentKeys.route(String(data.shipmentId)) });
        },

        onDriverLocationUpdate: (data) => {
          console.log('🚗 [SYNC] Driver location updated:', data.driverId);

          // Update driver location in cache (if tracking this driver)
          queryClient.invalidateQueries({ queryKey: ['driver', data.driverId] });
        },

        onDisconnect: () => {
          console.log('🔌 [SYNC] WebSocket disconnected');
          isWebSocketConnected.current = false;
        },

        onError: (error) => {
          console.error('🔴 [SYNC] WebSocket error:', error);
        },
      });
    }

    return () => {
      // Keep connection alive on unmount unless user logs out
      // This allows switching screens without reconnecting
    };
  }, [status, user, queryClient]);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      const isComingToForeground =
        appState.current.match(/inactive|background/) && nextAppState === 'active';

      const isGoingToBackground =
        appState.current === 'active' && nextAppState.match(/inactive|background/);

      if (isComingToForeground && status === 'authenticated') {
        console.log('🔄 [SYNC] App foregrounded - refreshing data...');

        // Refresh all shipments (might have changed while app was in background)
        await queryClient.invalidateQueries({ queryKey: shipmentKeys.all });

        // Reconnect WebSocket if disconnected
        if (!isWebSocketConnected.current) {
          console.log('🔌 [SYNC] Reconnecting WebSocket...');
          notificationService.connect();
        }

        console.log('✅ [SYNC] Data refreshed');
      }

      if (isGoingToBackground) {
        console.log('🔌 [SYNC] App backgrounded - disconnecting WebSocket to save battery');

        // Disconnect WebSocket to save battery (push notifications will handle updates)
        if (isWebSocketConnected.current) {
          notificationService.disconnect();
          isWebSocketConnected.current = false;
        }
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [status, queryClient]);

  // Subscribe to user's shipments on WebSocket
  useEffect(() => {
    if (isWebSocketConnected.current && user) {
      // Subscribe to shipment updates for this user
      // Note: This depends on your backend WebSocket implementation
      // You may need to emit a 'subscribe:user' event with user.id

      console.log('📡 [SYNC] Subscribing to user shipment updates');

      // Example: If your backend supports subscribing to all user shipments
      // notificationService.socket?.emit('subscribe:user', user.uid);
    }
  }, [user, isWebSocketConnected.current]);

  return {
    isConnected: isWebSocketConnected.current,
  };
};
