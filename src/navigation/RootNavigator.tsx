import React, { useMemo } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { Home, Search, Map as MapIcon, Settings as SettingsIcon } from 'lucide-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { tokens } from '@/theme/tokens';
import { ROUTES, TABS } from '@/constants/routes';
import { RootStackParamList, BottomTabParamList } from './types';
import { SplashScreen } from '@/screens/Splash';
import { TutorialScreen } from '@/screens/Tutorial';
import { LoginScreen } from '@/screens/Login';
import { SignupScreen } from '@/screens/Signup';
import { ForgotPasswordScreen } from '@/screens/ForgotPassword';
import { HomeScreen } from '@/screens/Home';
import { TrackScreen } from '@/screens/Track';
import { MapScreen } from '@/screens/Map';
import { ProfileScreen } from '@/screens/Profile';
import { SettingsScreen } from '@/screens/Settings';
import { ShipmentDetailsScreen } from '@/screens/ShipmentDetails';
import { AddTrackingSheetScreen } from '@/screens/AddTrackingSheet';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<BottomTabParamList>();

const TabNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.semantic.text || tokens.colors.textPrimary,
        tabBarInactiveTintColor: theme.semantic.textMuted || tokens.colors.textSecondary,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 8,
          backgroundColor: theme.semantic.surface || tokens.colors.surface,
          borderTopWidth: 0,
          ...tokens.shadows.lg,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;
          switch (route.name) {
            case 'HomeTab':
              IconComponent = Home;
              break;
            case 'TrackTab':
              IconComponent = Search;
              break;
            case 'MapTab':
              IconComponent = MapIcon;
              break;
            case 'SettingsTab':
            default:
              IconComponent = SettingsIcon;
              break;
          }

          // Active tab gets a white background circle
          if (focused) {
            return (
              <View style={styles.activeIconContainer}>
                <IconComponent 
                  color={theme.semantic.text || tokens.colors.textPrimary} 
                  size={24} 
                  strokeWidth={2}
                />
              </View>
            );
          }

          // Inactive tabs just show the icon
          return (
            <IconComponent 
              color={color} 
              size={24} 
              strokeWidth={2}
            />
          );
        },
        tabBarLabel: ({ focused, color }) => {
          // Only show label for inactive tabs
          if (focused) {
            return null;
          }

          let label;
          switch (route.name) {
            case 'HomeTab':
              label = 'Home';
              break;
            case 'TrackTab':
              label = 'Track';
              break;
            case 'MapTab':
              label = 'Map';
              break;
            case 'SettingsTab':
              label = 'Settings';
              break;
            default:
              label = route.name;
          }

          return (
            <Text style={[styles.tabLabel, { color }]}>
              {label}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="TrackTab" component={TrackScreen} />
      <Tab.Screen name="MapTab" component={MapScreen} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export const RootNavigator: React.FC = () => {
  const theme = useTheme();

  const navigationTheme = useMemo(() => {
    const base = theme.mode === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: theme.semantic.background,
        card: theme.semantic.surface,
        border: theme.semantic.border,
        text: theme.semantic.text,
        primary: theme.semantic.accent || tokens.colors.textPrimary,
        notification: theme.semantic.accent || tokens.colors.accent,
      },
    };
  }, [theme]);

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator initialRouteName={ROUTES.Splash} screenOptions={{ headerShown: false }}>
        <Stack.Screen name={ROUTES.Splash} component={SplashScreen} />
        <Stack.Screen name={ROUTES.Tutorial} component={TutorialScreen} />
        <Stack.Screen name={ROUTES.Login} component={LoginScreen} />
        <Stack.Screen name={ROUTES.Signup} component={SignupScreen} />
        <Stack.Screen name={ROUTES.ForgotPassword} component={ForgotPasswordScreen} />
        <Stack.Screen name={ROUTES.Main} component={TabNavigator} />
        <Stack.Screen
          name={ROUTES.Profile}
          component={ProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={ROUTES.ShipmentDetails}
          component={ShipmentDetailsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={ROUTES.AddTracking}
          component={AddTrackingSheetScreen}
          options={{
            headerShown: false,
            presentation: Platform.OS === 'ios' ? 'formSheet' : 'containedModal',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  activeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: tokens.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...tokens.shadows.md,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
});