import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Shipment, ShipmentStatus } from '@/types/backend';

// Notification identifiers
const DAILY_REMINDER_ID = 'daily-reminder';

// Configure how notifications are displayed when app is in foreground
export const configureNotificationHandler = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      // Modern notification display settings (iOS 14+)
      shouldShowBanner: true,  // Show banner at top of screen
      shouldShowList: true,    // Show in notification list/center
      shouldPlaySound: true,   // Play notification sound
      shouldSetBadge: true,    // Update app badge count
    }),
  });
};

/**
 * Schedule a daily reminder notification
 */
export const scheduleDailyReminder = async (hour: number, minute: number) => {
  try {
    // Cancel existing daily reminder
    await cancelDailyReminder();

    // Schedule new daily reminder
    const trigger: Notifications.DailyTriggerInput = {
      hour,
      minute,
      repeats: true,
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      identifier: DAILY_REMINDER_ID,
      content: {
        title: '📦 Check Your Deliveries',
        body: 'You have packages on the way. Track them now!',
        data: { type: 'daily-reminder' },
        sound: true,
        ...(Platform.OS === 'android' && {
          channelId: 'reminders',
        }),
      },
      trigger,
    });

    console.log('Daily reminder scheduled:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling daily reminder:', error);
    throw error;
  }
};

/**
 * Cancel the daily reminder
 */
export const cancelDailyReminder = async () => {
  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
  } catch (error) {
    // Notification might not exist, that's okay
    console.log('No daily reminder to cancel');
  }
};

/**
 * Show a shipment status update notification
 */
export const showShipmentStatusNotification = async (
  shipment: Shipment,
  status: ShipmentStatus
) => {
  try {
    const { title, body, emoji } = getShipmentStatusMessage(status, shipment);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${emoji} ${title}`,
        body,
        data: {
          type: 'shipment-status',
          shipmentId: shipment.id,
          status,
        },
        sound: true,
        ...(Platform.OS === 'android' && {
          channelId: 'shipment-updates',
        }),
      },
      trigger: null, // Show immediately
    });
  } catch (error) {
    console.error('Error showing shipment status notification:', error);
  }
};

/**
 * Show a driver proximity notification
 */
export const showDriverProximityNotification = async (
  shipment: Shipment,
  estimatedMinutes: number
) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚚 Driver Nearby!',
        body: `Your delivery is ${estimatedMinutes} minutes away. Get ready!`,
        data: {
          type: 'driver-proximity',
          shipmentId: shipment.id,
        },
        sound: true,
        ...(Platform.OS === 'android' && {
          channelId: 'driver-proximity',
        }),
      },
      trigger: null, // Show immediately
    });
  } catch (error) {
    console.error('Error showing driver proximity notification:', error);
  }
};

/**
 * Show a generic notification
 */
export const showNotification = async (
  title: string,
  body: string,
  data?: Record<string, any>
) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
      },
      trigger: null, // Show immediately
    });
  } catch (error) {
    console.error('Error showing notification:', error);
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error cancelling all notifications:', error);
  }
};

/**
 * Get all scheduled notifications
 */
export const getScheduledNotifications = async () => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

/**
 * Clear notification badge (iOS)
 */
export const clearBadge = async () => {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    console.error('Error clearing badge:', error);
  }
};

/**
 * Get notification message based on shipment status
 */
const getShipmentStatusMessage = (
  status: ShipmentStatus,
  shipment: Shipment
): { title: string; body: string; emoji: string } => {
  const trackingNumber = shipment.trackingNumber || 'Your package';

  switch (status) {
    case 'pending':
      return {
        emoji: '📋',
        title: 'Order Confirmed',
        body: `${trackingNumber} has been created and is awaiting pickup.`,
      };
    case 'assigned':
      return {
        emoji: '👤',
        title: 'Driver Assigned',
        body: `A driver has been assigned to ${trackingNumber}.`,
      };
    case 'in_transit':
      return {
        emoji: '🚚',
        title: 'Package In Transit',
        body: `${trackingNumber} is on its way to you!`,
      };
    case 'delivered':
      return {
        emoji: '✅',
        title: 'Delivered!',
        body: `${trackingNumber} has been successfully delivered.`,
      };
    default:
      return {
        emoji: '📦',
        title: 'Package Update',
        body: `Status update for ${trackingNumber}`,
      };
  }
};

/**
 * Request notification permissions (helper)
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};
