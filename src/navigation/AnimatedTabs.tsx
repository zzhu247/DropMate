import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  useDerivedValue,
} from 'react-native-reanimated';
import { View, Text, Platform, StyleSheet } from 'react-native';
import { Home, Search, Map as MapIcon, Settings as SettingsIcon } from 'lucide-react-native';

import { BottomTabParamList } from './types';
import { useTheme } from '@/theme/ThemeProvider';
import { tokens } from '@/theme/tokens';

// screens
import { HomeScreen } from '@/screens/Home';
import { TrackScreen } from '@/screens/Track';
import { MapScreen } from '@/screens/Map';
import { SettingsScreen } from '@/screens/Settings';

const Tab = createBottomTabNavigator<BottomTabParamList>();

// Animated wrapper
const FadeWrapper = ({ children, isActive }: { children: any; isActive: boolean }) => {
  const progress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isActive ? 1 : 0, { duration: 260 });
  }, [isActive]);

  const anim = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 10 }],
  }));

  return <Animated.View style={[{ flex: 1 }, anim]}>{children}</Animated.View>;
};

export const AnimatedTabs = () => {
  const theme = useTheme();

  // React state for current tab (allowed in render)
  const [activeTab, setActiveTab] = useState('HomeTab');

  return (
    <Tab.Navigator
      screenListeners={{
        state: (e) => {
          const nextTab = e.data.state?.routeNames[e.data.state.index];
          if (nextTab) setActiveTab(nextTab); // <-- store in React, not sharedValue
        },
      }}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.semantic.text,
        tabBarInactiveTintColor: theme.semantic.textMuted,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 8,
          backgroundColor: theme.semantic.surface,
          borderTopWidth: 0,
          ...tokens.shadows.lg,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            HomeTab: Home,
            TrackTab: Search,
            MapTab: MapIcon,
            SettingsTab: SettingsIcon,
          };

          const Icon = icons[route.name];

          if (focused) {
            return (
              <View style={styles.activeIconContainer}>
                <Icon color={theme.semantic.text} size={24} strokeWidth={2} />
              </View>
            );
          }

          return <Icon color={color} size={24} strokeWidth={2} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab">
        {() => <FadeWrapper isActive={activeTab === 'HomeTab'}><HomeScreen /></FadeWrapper>}
      </Tab.Screen>

      <Tab.Screen name="TrackTab">
        {() => <FadeWrapper isActive={activeTab === 'TrackTab'}><TrackScreen /></FadeWrapper>}
      </Tab.Screen>

      <Tab.Screen name="MapTab">
        {() => <FadeWrapper isActive={activeTab === 'MapTab'}><MapScreen /></FadeWrapper>}
      </Tab.Screen>

      <Tab.Screen name="SettingsTab">
        {() => (
          <FadeWrapper isActive={activeTab === 'SettingsTab'}>
            <SettingsScreen />
          </FadeWrapper>
        )}
      </Tab.Screen>
    </Tab.Navigator>
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
});
