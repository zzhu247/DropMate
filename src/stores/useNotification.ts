import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { userService } from '@/api/userService';

const PUSH_TOKEN_KEY = 'dropmate_push_token';
const NOTIFICATION_SETTINGS_KEY = 'dropmate_notification_settings';

export type NotificationSettings = {
  dailyReminderEnabled: boolean;
  dailyReminderTime: { hour: number; minute: number }; // 24-hour format
  shipmentStatusEnabled: boolean;
  driverProximityEnabled: boolean;
};

const DEFAULT_SETTINGS: NotificationSettings = {
  dailyReminderEnabled: true,
  dailyReminderTime: { hour: 9, minute: 0 }, // 9 AM
  shipmentStatusEnabled: true,
  driverProximityEnabled: true,
};

export type NotificationPermissionStatus = 'undetermined' | 'granted' | 'denied';

type NotificationState = {
  permissionStatus: NotificationPermissionStatus;
  pushToken: string | null;
  settings: NotificationSettings;
  hydrated: boolean;

  // Actions
  hydrate: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  registerForPushNotifications: () => Promise<string | null>;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  getSettings: () => NotificationSettings;
};

export const useNotification = create<NotificationState>((set, get) => ({
  permissionStatus: 'undetermined',
  pushToken: null,
  settings: DEFAULT_SETTINGS,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) {
      return;
    }

    try {
      // Load saved push token
      const savedToken = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);

      // Load notification settings
      const savedSettingsStr = await SecureStore.getItemAsync(NOTIFICATION_SETTINGS_KEY);
      const savedSettings = savedSettingsStr
        ? JSON.parse(savedSettingsStr)
        : DEFAULT_SETTINGS;

      // Check current permission status
      const { status } = await Notifications.getPermissionsAsync();
      const permissionStatus: NotificationPermissionStatus =
        status === 'granted' ? 'granted' :
        status === 'denied' ? 'denied' :
        'undetermined';

      set({
        pushToken: savedToken,
        settings: savedSettings,
        permissionStatus,
        hydrated: true,
      });
    } catch (error) {
      console.error('Error hydrating notification state:', error);
      set({ hydrated: true });
    }
  },

  requestPermissions: async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      const granted = finalStatus === 'granted';

      set({
        permissionStatus: granted ? 'granted' : 'denied',
      });

      return granted;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      set({ permissionStatus: 'denied' });
      return false;
    }
  },

  registerForPushNotifications: async () => {
    console.log('🔵 [PUSH] Starting push notification registration...');

    try {
      // Check if we're on a physical device
      if (!Device.isDevice) {
        console.warn('🟡 [PUSH] Must use physical device for push notifications');
        return null;
      }
      console.log('✅ [PUSH] Device check passed');

      // Request permissions first
      console.log('🔵 [PUSH] Requesting permissions...');
      const granted = await get().requestPermissions();
      if (!granted) {
        console.warn('🔴 [PUSH] Notification permission not granted');
        return null;
      }
      console.log('✅ [PUSH] Permissions granted');

      // Try to get push token (requires valid EAS project ID)
      let token = null;
      try {
        console.log('🔵 [PUSH] Getting Expo push token...');
        const tokenData = await Notifications.getExpoPushTokenAsync();
        token = tokenData.data;
        console.log('✅ [PUSH] Got push token:', token.substring(0, 30) + '...');
      } catch (error: any) {
        // If no valid project ID, push notifications won't work
        // but local notifications will still work fine
        if (error.message?.includes('projectId')) {
          console.warn('🔴 [PUSH] Push notifications unavailable: Invalid or missing EAS project ID');
          console.warn('Local notifications will still work. To enable push notifications, run: npx eas init');
          return null;
        }
        console.error('🔴 [PUSH] Error getting push token:', error);
        throw error; // Re-throw other errors
      }

      // Save token to secure storage
      console.log('🔵 [PUSH] Saving token to secure storage...');
      await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
      console.log('✅ [PUSH] Token saved to secure storage');

      // Register token with backend (best effort - don't fail if backend is unavailable)
      try {
        console.log('🔵 [PUSH] Registering token with backend...');
        console.log('🔵 [PUSH] Backend URL:', 'http://178.128.132.24/api/users/me/push-token');
        const response = await userService.registerPushToken(token);
        console.log('✅ [PUSH] Token registered with backend successfully!');
        console.log('✅ [PUSH] Backend response:', JSON.stringify(response));
      } catch (error: any) {
        console.error('🔴 [PUSH] Failed to register push token with backend');
        console.error('🔴 [PUSH] Error details:', error.message);
        console.error('🔴 [PUSH] Full error:', JSON.stringify(error, null, 2));
        // Continue anyway - local notifications will still work
      }

      // Configure Android notification channels
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4A90E2',
        });

        await Notifications.setNotificationChannelAsync('shipment-updates', {
          name: 'Shipment Updates',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4A90E2',
          description: 'Notifications about your shipment status changes',
        });

        await Notifications.setNotificationChannelAsync('reminders', {
          name: 'Reminders',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250],
          lightColor: '#4A90E2',
          description: 'Daily reminders to check your deliveries',
        });

        await Notifications.setNotificationChannelAsync('driver-proximity', {
          name: 'Driver Proximity',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4A90E2',
          description: 'Alerts when driver is nearby',
        });
      }

      set({ pushToken: token });
      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  },

  updateSettings: async (newSettings: Partial<NotificationSettings>) => {
    const currentSettings = get().settings;
    const updatedSettings = { ...currentSettings, ...newSettings };

    try {
      await SecureStore.setItemAsync(
        NOTIFICATION_SETTINGS_KEY,
        JSON.stringify(updatedSettings)
      );
      set({ settings: updatedSettings });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  },

  getSettings: () => {
    return get().settings;
  },
}));
