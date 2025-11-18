import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { useNotification } from '@/stores/useNotification';
import { useTheme } from '@/theme/ThemeProvider';
import { scheduleDailyReminder, showNotification } from '@/services/notificationService';

export type NotificationsGateProps = {
  children?: React.ReactNode;
};

export const NotificationsGate: React.FC<NotificationsGateProps> = ({ children }) => {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const {
    permissionStatus,
    settings,
    requestPermissions,
    registerForPushNotifications,
    updateSettings,
  } = useNotification();

  // Initialize enabled state based on permissions and settings
  useEffect(() => {
    if (permissionStatus === 'granted' && settings.dailyReminderEnabled) {
      setEnabled(true);
    }
  }, [permissionStatus, settings.dailyReminderEnabled]);

  // Schedule daily reminder when enabled
  useEffect(() => {
    if (enabled && settings.dailyReminderEnabled) {
      const { hour, minute } = settings.dailyReminderTime;
      scheduleDailyReminder(hour, minute);
    }
  }, [enabled, settings.dailyReminderEnabled, settings.dailyReminderTime]);

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      setIsLoading(true);
      try {
        const granted = await requestPermissions();

        if (granted) {
          // Register for push notifications (will auto-register on next app foreground if not already)
          console.log('🔵 [SETTINGS] Requesting push notification registration...');
          await registerForPushNotifications();
          setEnabled(true);

          // Enable all notification types by default
          await updateSettings({
            dailyReminderEnabled: true,
            shipmentStatusEnabled: true,
            driverProximityEnabled: true,
          });

          Alert.alert(
            'Notifications Enabled',
            'You will now receive updates about your deliveries!'
          );
        } else {
          Alert.alert(
            'Permission Denied',
            'Please enable notifications in your device settings to receive delivery updates.',
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Open Settings',
                onPress: () => {
                  // On iOS, this will open app settings
                  // On Android, it may vary
                  console.log('Open settings');
                },
              },
            ]
          );
        }
      } catch (error) {
        console.error('Error enabling notifications:', error);
        Alert.alert('Error', 'Failed to enable notifications. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // User wants to disable notifications
      Alert.alert(
        'Disable Notifications',
        'This will cancel all scheduled notifications. You can re-enable them anytime in Settings.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              setIsLoading(true);
              try {
                // Cancel all scheduled notifications
                const { cancelAllNotifications } = await import('@/services/notificationService');
                await cancelAllNotifications();

                // Disable all notification settings
                await updateSettings({
                  dailyReminderEnabled: false,
                  shipmentStatusEnabled: false,
                  driverProximityEnabled: false,
                });

                // Update UI state
                setEnabled(false);

                Alert.alert(
                  'Notifications Disabled',
                  'All notifications have been disabled and scheduled notifications cancelled.'
                );
              } catch (error) {
                console.error('Error disabling notifications:', error);
                Alert.alert('Error', 'Failed to disable notifications.');
              } finally {
                setIsLoading(false);
              }
            },
          },
        ]
      );
    }
  };

  const handleToggleSetting = async (
    key: keyof typeof settings,
    value: boolean
  ) => {
    try {
      await updateSettings({ [key]: value });
    } catch (error) {
      console.error('Error updating setting:', error);
      Alert.alert('Error', 'Failed to update notification setting.');
    }
  };

  const handleTestNotification = async () => {
    await showNotification(
      '📦 Test Notification',
      'Your notifications are working! You will receive updates about your deliveries.',
      { type: 'test' }
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.semantic.surface }]}>
      <View style={styles.row}>
        <View style={styles.textColumn}>
          <Text style={[styles.title, { color: theme.semantic.text }]}>Notifications</Text>
          <Text style={[styles.subtitle, { color: theme.semantic.textMuted }]}>
            Enable push alerts for key shipment milestones.
          </Text>
        </View>
        {isLoading ? (
          <ActivityIndicator />
        ) : (
          <Switch value={enabled} onValueChange={handleToggleNotifications} />
        )}
      </View>

      {enabled && (
        <View style={styles.settingsContainer}>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: theme.semantic.text }]}>
              Daily Reminders
            </Text>
            <Switch
              value={settings.dailyReminderEnabled}
              onValueChange={(value) => handleToggleSetting('dailyReminderEnabled', value)}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: theme.semantic.text }]}>
              Shipment Status Updates
            </Text>
            <Switch
              value={settings.shipmentStatusEnabled}
              onValueChange={(value) => handleToggleSetting('shipmentStatusEnabled', value)}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: theme.semantic.text }]}>
              Driver Proximity Alerts
            </Text>
            <Switch
              value={settings.driverProximityEnabled}
              onValueChange={(value) => handleToggleSetting('driverProximityEnabled', value)}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={handleTestNotification}
            style={({ pressed }) => [
              styles.testButton,
              {
                backgroundColor: theme.colors.accent,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Text style={styles.testButtonLabel}>Send Test Notification</Text>
          </Pressable>
        </View>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textColumn: {
    flex: 1,
    gap: 4,
    paddingRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
  },
  settingsContainer: {
    gap: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  testButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    marginTop: 4,
  },
  testButtonLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
