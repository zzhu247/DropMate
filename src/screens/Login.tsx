import React, { useMemo } from 'react';
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

import { ROUTES } from '@/constants/routes';
import { t } from '@/i18n/i18n';
import { RootStackParamList } from '@/navigation/types';
import { useTheme } from '@/theme/ThemeProvider';
import { FormTextInput } from '@/components/FormTextInput';
import { useAuth } from '@/stores/useAuth';

const schema = z.object({
  email: z
    .string()
    .refine(
      (value) => value.trim() === 'admin' || z.string().email().safeParse(value.trim()).success,
      'Enter a valid email.',
    ),
  password: z
    .string()
    .refine(
      (value) => value.trim() === 'admin' || value.trim().length >= 6,
      'Password must be at least 6 characters',
    ),
});

type FormValues = z.infer<typeof schema>;

type LoginProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC<LoginProps> = ({ navigation }) => {
  const theme = useTheme();
  const signIn = useAuth((state) => state.signIn);
  const status = useAuth((state) => state.status);
  const error = useAuth((state) => state.error);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  });

  const isLoading = status === 'loading';

  const ssoButtons = useMemo(
    () => [
      { key: 'google', label: 'Continue with Google', icon: <Chrome color={theme.colors.textPrimary} size={20} />, disabled: true },
      { key: 'apple', label: 'Continue with Apple', icon: <Apple color={theme.colors.textPrimary} size={20} />, disabled: true },
    ],
    [theme.colors.textPrimary],
  );

  const onSubmit = handleSubmit(async (values) => {
    await signIn(values);
    if (useAuth.getState().status === 'authenticated') {
      navigation.replace(ROUTES.Main);
    }
  });

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
          <Pressable accessibilityRole="button" style={styles.link}>
            <Text style={[styles.linkText, { color: theme.colors.accent }]}>{t('login.forgotPassword')}</Text>
          </Pressable>
          <Text style={[styles.demoHint, { color: theme.semantic.textMuted }]}>
            Demo account: admin / admin
          </Text>
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
          {ssoButtons.map((button) => (
            <Pressable
              key={button.key}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.ssoButton,
                {
                  borderColor: theme.semantic.border,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
              disabled={button.disabled}
            >
              {button.icon}
              <Text style={[styles.ssoLabel, { color: theme.semantic.text }]}>{button.label}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable accessibilityRole="button" style={styles.signUpLink}>
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
