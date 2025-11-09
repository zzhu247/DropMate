import React, { useState } from 'react';
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
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react-native';

import { ROUTES } from '@/constants/routes';
import { RootStackParamList } from '@/navigation/types';
import { useTheme } from '@/theme/ThemeProvider';
import { FormTextInput } from '@/components/FormTextInput';
import { useAuth } from '@/stores/useAuth';

const schema = z.object({
  email: z.string().email('Enter a valid email address.').min(1, 'Email is required.'),
});

type FormValues = z.infer<typeof schema>;

type ForgotPasswordProps = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC<ForgotPasswordProps> = ({ navigation }) => {
  const theme = useTheme();
  const resetPassword = useAuth((state) => state.resetPassword);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [emailSent, setEmailSent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  });

  const onSubmit = handleSubmit(async (values) => {
    setIsLoading(true);
    setError(undefined);

    try {
      await resetPassword(values.email);
      setEmailSent(true);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to send password reset email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  });

  const handleResend = async () => {
    const email = getValues('email');
    if (!email) return;

    setIsLoading(true);
    setError(undefined);

    try {
      await resetPassword(email);
      // Show success feedback without changing the screen
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to resend email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.semantic.background }]}
        edges={['top', 'left', 'right']}
      >
        <View style={styles.content}>
          <Pressable
            accessibilityRole="button"
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft color={theme.semantic.text} size={24} />
          </Pressable>

          <View style={styles.successContainer}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.colors.primaryTeal + '20' },
              ]}
            >
              <CheckCircle color={theme.colors.primaryTeal} size={48} />
            </View>

            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.semantic.text }]}>Check Your Email</Text>
              <Text style={[styles.subtitle, { color: theme.semantic.textMuted }]}>
                We've sent password reset instructions to:
              </Text>
              <Text style={[styles.emailText, { color: theme.semantic.text }]}>
                {getValues('email')}
              </Text>
            </View>

            {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                disabled={isLoading}
                onPress={handleResend}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  {
                    borderColor: theme.semantic.border,
                    opacity: pressed || isLoading ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={[styles.secondaryLabel, { color: theme.semantic.text }]}>
                  {isLoading ? 'Resending…' : 'Resend Email'}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.navigate(ROUTES.Login)}
                style={({ pressed }) => [
                  styles.primaryButton,
                  {
                    backgroundColor: theme.colors.primaryTeal,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={styles.primaryLabel}>Back to Sign In</Text>
              </Pressable>
            </View>

            <Text style={[styles.helpText, { color: theme.semantic.textMuted }]}>
              Didn't receive the email? Check your spam folder or try resending.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
          <Pressable
            accessibilityRole="button"
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft color={theme.semantic.text} size={24} />
          </Pressable>

          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.semantic.text }]}>Reset Password</Text>
            <Text style={[styles.subtitle, { color: theme.semantic.textMuted }]}>
              Enter your email address and we'll send you instructions to reset your password.
            </Text>
          </View>

          <View style={styles.form}>
            <Controller
              name="email"
              control={control}
              defaultValue=""
              render={({ field: { value, onChange, onBlur } }) => (
                <FormTextInput
                  label="Email"
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
              <Text style={styles.primaryLabel}>
                {isLoading ? 'Sending…' : 'Send Reset Link'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate(ROUTES.Login)}
            >
              <Text style={[styles.linkText, { color: theme.colors.accent }]}>
                Back to Sign In
              </Text>
            </Pressable>
          </View>
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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
    lineHeight: 24,
  },
  form: {
    gap: 16,
  },
  error: {
    fontSize: 14,
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
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  successContainer: {
    gap: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  helpText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});
