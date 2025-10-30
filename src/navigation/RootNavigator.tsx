import React, { useMemo } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { Home, Search, Map as MapIcon, Settings as SettingsIcon } from 'lucide-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { ROUTES, TABS } from '@/constants/routes';
import { RootStackParamList, BottomTabParamList } from './types';
import { SplashScreen } from '@/screens/Splash';
import { TutorialScreen } from '@/screens/Tutorial';
import { LoginScreen } from '@/screens/Login';
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
        tabBarActiveTintColor: theme.colors.primaryTeal,
        tabBarInactiveTintColor: theme.semantic.textMuted,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 86 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
          paddingTop: 12,
          backgroundColor: theme.semantic.surface,
          borderTopColor: theme.semantic.border,
        },
        tabBarIcon: ({ color, size }) => {
          switch (route.name) {
            case TABS.Home:
              return <Home color={color} size={size} />;
            case TABS.Track:
              return <Search color={color} size={size} />;
            case TABS.Map:
              return <MapIcon color={color} size={size} />;
            case TABS.Settings:
            default:
              return <SettingsIcon color={color} size={size} />;
          }
        },
      })}
    >
      <Tab.Screen name={TABS.Home} component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name={TABS.Track} component={TrackScreen} options={{ title: 'Track' }} />
      <Tab.Screen name={TABS.Map} component={MapScreen} options={{ title: 'Map' }} />
      <Tab.Screen name={TABS.Settings} component={SettingsScreen} options={{ title: 'Settings' }} />
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
        primary: theme.colors.primaryTeal,
        notification: theme.colors.accent,
      },
    };
  }, [theme]);

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator initialRouteName={ROUTES.Splash} screenOptions={{ headerShown: false }}>
        <Stack.Screen name={ROUTES.Splash} component={SplashScreen} />
        <Stack.Screen name={ROUTES.Tutorial} component={TutorialScreen} />
        <Stack.Screen name={ROUTES.Login} component={LoginScreen} />
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
