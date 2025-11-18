import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useQueryClient } from '@tanstack/react-query';
import { shipmentKeys } from '@/api/queryKeys';

/**
 * Component to listen for notification interactions and refresh data accordingly
 */
export const NotificationListener = () => {
  const queryClient = useQueryClient();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Listen for user interactions with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('🔔 [NOTIFICATION] User tapped notification');

      const data = response.notification.request.content.data;

      // Handle different notification types and refresh relevant data
      if (data.type === 'shipment-status' || data.type === 'driver-proximity' || data.type === 'driver-assigned') {
        const shipmentId = data.shipmentId;

        console.log(`🔄 [NOTIFICATION] Refreshing shipment ${shipmentId} data...`);

        // Invalidate and refetch the specific shipment using correct keys
        queryClient.invalidateQueries({ queryKey: shipmentKeys.detail(String(shipmentId)) });
        queryClient.invalidateQueries({ queryKey: shipmentKeys.route(String(shipmentId)) });

        // Also refresh the shipments list
        queryClient.invalidateQueries({ queryKey: shipmentKeys.all });

        console.log('✅ [NOTIFICATION] Data refresh triggered with correct query keys');

        // Deep linking will be handled by RootNavigator
        const url = `dropmate://shipment/${shipmentId}`;
        console.log('🔗 [NOTIFICATION] Deep link:', url);

        // Dismiss the notification
        Notifications.dismissAllNotificationsAsync();
      } else if (data.type === 'daily-reminder') {
        console.log('🔄 [NOTIFICATION] Refreshing all shipments...');

        // Refresh all shipments for daily reminder
        queryClient.invalidateQueries({ queryKey: shipmentKeys.all });

        // Navigate to Track screen via deep link
        const url = 'dropmate://main/track';
        console.log('🔗 [NOTIFICATION] Deep link:', url);
      }
    });

    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [queryClient]);

  return null; // This component doesn't render anything
};
