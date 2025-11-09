import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Apple, Chrome } from 'lucide-react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

import { ROUTES } from '@/constants/routes';
import { t } from '@/i18n/i18n';
import { RootStackParamList } from '@/navigation/types';
import { useTheme } from '@/theme/ThemeProvider';
import { FormTextInput } from '@/components/FormTextInput';
import { useAuth } from '@/stores/useAuth';

const schema = z.object({
  email: z.string().email('Enter a valid email address.').min(1, 'Email is required.'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters.')
    .min(1, 'Password is required.'),
});

type FormValues = z.infer<typeof schema>;

type LoginProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC<LoginProps> = ({ navigation }) => {
  const theme = useTheme();
  const signIn = useAuth((state) => state.signIn);
  const signInWithApple = useAuth((state) => state.signInWithApple);
  const status = useAuth((state) => state.status);
  const error = useAuth((state) => state.error);

  const [isAppleAvailable, setIsAppleAvailable] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  });

  // Check if Apple Sign-In is available
  React.useEffect(() => {
    const checkAppleAvailability = async () => {
      const available = await AppleAuthentication.isAvailableAsync();
      setIsAppleAvailable(available);
    };
    checkAppleAvailability();
  }, []);

  const isLoading = status === 'loading';

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signIn(values);
      // Navigation will happen automatically via auth state listener
      // But we can also manually navigate if needed
      if (useAuth.getState().status === 'authenticated') {
        navigation.replace(ROUTES.Main);
      }
    } catch (err) {
      // Error is already set in the auth store
      console.error('Sign in error:', err);
    }
  });

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    try {
      await signInWithApple();
      // Navigation will happen automatically via auth state listener
      if (useAuth.getState().status === 'authenticated') {
        navigation.replace(ROUTES.Main);
      }
    } catch (err) {
      // Error is already set in the auth store
      console.error('Apple sign in error:', err);
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.semantic.background }]}
      edges={['top', 'left', 'right']}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.semantic.text }]}>{t('login.title')}</Text>
          <Text style={[styles.subtitle, { color: theme.semantic.textMuted }]}>
            Track all your parcels in one dashboard.
          </Text>
        </View>
        <View style={styles.form}>
          <Controller
            name="email"
            control={control}
            defaultValue=""
            render={({ field: { value, onChange, onBlur } }) => (
              <FormTextInput
                label={t('login.emailPlaceholder')}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                errorMessage={errors.email?.message}
                leftAccessory={<Mail color={theme.semantic.textMuted} size={18} />}
              />
            )}
          />
          <Controller
            name="password"
            control={control}
            defaultValue=""
            render={({ field: { value, onChange, onBlur } }) => (
              <FormTextInput
                label={t('login.passwordPlaceholder')}
                secureTextEntry
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                errorMessage={errors.password?.message}
                leftAccessory={<Lock color={theme.semantic.textMuted} size={18} />}
              />
            )}
          />
          <Pressable
            accessibilityRole="button"
            style={styles.link}
            onPress={() => navigation.navigate(ROUTES.ForgotPassword)}
          >
            <Text style={[styles.linkText, { color: theme.colors.accent }]}>{t('login.forgotPassword')}</Text>
          </Pressable>
          {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}
          <Pressable
            accessibilityRole="button"
            disabled={isLoading}
            onPress={onSubmit}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: theme.colors.primaryTeal,
                opacity: pressed || isLoading ? 0.8 : 1,
              },
            ]}
          >
            <Text style={styles.primaryLabel}>{isLoading ? 'Signing in…' : t('login.cta')}</Text>
          </Pressable>
        </View>
        <View style={styles.divider}>
          <View style={[styles.line, { backgroundColor: theme.semantic.border }]} />
          <Text style={[styles.dividerText, { color: theme.semantic.textMuted }]}>or</Text>
          <View style={[styles.line, { backgroundColor: theme.semantic.border }]} />
        </View>
        <View style={styles.ssoGroup}>
          {/* Google Sign-In - Disabled for now */}
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.ssoButton,
              {
                borderColor: theme.semantic.border,
                opacity: 0.5,
              },
            ]}
            disabled={true}
          >
            <Chrome color={theme.colors.textPrimary} size={20} />
            <Text style={[styles.ssoLabel, { color: theme.semantic.text }]}>Continue with Google</Text>
          </Pressable>

          {/* Apple Sign-In - Enabled on iOS */}
          {isAppleAvailable && (
            <Pressable
              accessibilityRole="button"
              onPress={handleAppleSignIn}
              disabled={appleLoading || isLoading}
              style={({ pressed }) => [
                styles.ssoButton,
                {
                  borderColor: theme.semantic.border,
                  opacity: pressed || appleLoading || isLoading ? 0.7 : 1,
                },
              ]}
            >
              <Apple color={theme.colors.textPrimary} size={20} />
              <Text style={[styles.ssoLabel, { color: theme.semantic.text }]}>
                {appleLoading ? 'Signing in…' : 'Continue with Apple'}
              </Text>
            </Pressable>
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          style={styles.signUpLink}
          onPress={() => navigation.navigate(ROUTES.Signup)}
        >
          <Text style={[styles.linkText, { color: theme.colors.accent }]}>{t('login.signUp')}</Text>
        </Pressable>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 24,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    gap: 16,
  },
  link: {
    alignSelf: 'flex-end',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  error: {
    fontSize: 14,
  },
  demoHint: {
    fontSize: 13,
    alignSelf: 'center',
  },
  primaryButton: {
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  ssoGroup: {
    gap: 12,
  },
  ssoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    gap: 12,
  },
  ssoLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  signUpLink: {
    alignSelf: 'center',
  },
});
