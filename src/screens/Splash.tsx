import React, { useEffect } from 'react';
import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ROUTES } from '@/constants/routes';
import { useFirstRun } from '@/hooks/useFirstRun';
import { useTheme } from '@/theme/ThemeProvider';
import { RootStackParamList } from '@/navigation/types';

const logo = require('@/../assets/images/logo.png');
const splashBackground = require('@/../assets/images/splash-gradient.png');

type SplashProps = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export const SplashScreen: React.FC<SplashProps> = ({ navigation }) => {
  const theme = useTheme();
  const { isReady, initialRoute } = useFirstRun();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const timeout = setTimeout(() => {
      const nextRoute = initialRoute === 'Main' ? ROUTES.Main : (initialRoute as keyof RootStackParamList);
      navigation.replace(nextRoute);
    }, 1200);

    return () => clearTimeout(timeout);
  }, [initialRoute, isReady, navigation]);

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <ImageBackground source={splashBackground} style={styles.background} resizeMode="cover">
        <View style={styles.content}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <Text style={[styles.title, { color: theme.semantic.surface }]} accessibilityRole="header">
            DropMate
          </Text>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  background: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
});
