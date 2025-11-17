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
import { AnimatedTabs } from './AnimatedTabs';

// Screens
import { SplashScreen } from '@/screens/Splash';
import { TutorialScreen } from '@/screens/Tutorial';
import { LoginScreen } from '@/screens/Login';
import { SignupScreen } from '@/screens/Signup';
import { ForgotPasswordScreen } from '@/screens/ForgotPassword';
import { HomeScreen } from '@/screens/Home';
import { TrackScreen } from '@/screens/Track';
import { MapScreen } from '@/screens/Map';
import { SettingsScreen } from '@/screens/Settings';
import { ProfileScreen } from '@/screens/Profile';
import { ShipmentDetailsScreen } from '@/screens/ShipmentDetails';
import { AddTrackingSheetScreen } from '@/screens/AddTrackingSheet';
import { PlaceOrderScreen } from '@/screens/PlaceOrder';

// Transitions
import {
  PremiumSlideRight,
  PremiumSlideBottom,
  PremiumFade,
  PremiumModal,
  NoAnimation,
} from '@/navigation/transitions';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<BottomTabParamList>();

// ----------------------
// BOTTOM TAB NAVIGATOR
// ----------------------
const BottomTabs = () => {
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
        tabBarIcon: ({ focused, color }) => {
          let IconComponent;
          switch (route.name) {
            case 'HomeTab': IconComponent = Home; break;
            case 'TrackTab': IconComponent = Search; break;
            case 'MapTab': IconComponent = MapIcon; break;
            default: IconComponent = SettingsIcon;
          }

          if (focused) {
            return (
              <View style={styles.activeIconContainer}>
                <IconComponent color={theme.semantic.text} size={24} strokeWidth={2} />
              </View>
            );
          }

          return <IconComponent color={color} size={24} strokeWidth={2} />;
        },
        tabBarLabel: ({ focused, color }) =>
          focused ? null : <Text style={[styles.tabLabel, { color }]}>{route.name.replace('Tab','')}</Text>,
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="TrackTab" component={TrackScreen} />
      <Tab.Screen name="MapTab" component={MapScreen} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

// ----------------------
// ROOT NAVIGATOR
// ----------------------
export const RootNavigator = () => {
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
      },
    };
  }, [theme]);

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName={ROUTES.Splash}
        screenOptions={{
          headerShown: false,
          ...PremiumSlideRight,
        }}
      >
        <Stack.Screen name={ROUTES.Splash} component={SplashScreen} options={NoAnimation} />
        <Stack.Screen name={ROUTES.Tutorial} component={TutorialScreen} options={PremiumFade} />

        {/* AUTH FLOW */}
        <Stack.Screen name={ROUTES.Login} component={LoginScreen} options={PremiumFade} />
        <Stack.Screen name={ROUTES.Signup} component={SignupScreen} options={PremiumFade} />
        <Stack.Screen name={ROUTES.ForgotPassword} component={ForgotPasswordScreen} options={PremiumFade} />

        {/* TABS */}
        <Stack.Screen name={ROUTES.Main} component={AnimatedTabs} options={PremiumSlideRight} />

        {/* PUSH SCREENS */}
        <Stack.Screen name={ROUTES.Profile} component={ProfileScreen} options={PremiumSlideRight} />
        <Stack.Screen name={ROUTES.ShipmentDetails} component={ShipmentDetailsScreen} options={PremiumSlideRight} />

        {/* MODALS + SHEETS */}
        <Stack.Screen name={ROUTES.AddTracking} component={AddTrackingSheetScreen} options={PremiumModal} />
        <Stack.Screen name={ROUTES.PlaceOrder} component={PlaceOrderScreen} options={PremiumSlideBottom} />
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
