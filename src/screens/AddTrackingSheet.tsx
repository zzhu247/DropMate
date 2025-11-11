import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, ChevronDown } from 'lucide-react-native';

import { RootStackParamList } from '@/navigation/types';
import { FormTextInput } from '@/components/FormTextInput';
import { useTheme } from '@/theme/ThemeProvider';
import { useAddTracking } from '@/hooks/useAddTracking';
import { t } from '@/i18n/i18n';
import { LocationPoint } from '@/types';

const carrierOptions = ['UPS', 'FedEx', 'DHL', 'CanadaPost', 'Other'] as const;

const schema = z
  .object({
    trackingNo: z.string().optional(),
    nickname: z.string().max(40).optional(),
    carrier: z.enum(carrierOptions),
    itemDescription: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      // If carrier is not 'Other', trackingNo is required
      if (data.carrier !== 'Other') {
        return data.trackingNo && data.trackingNo.length >= 6;
      }
      return true;
    },
    {
      message: 'Enter a valid tracking number',
      path: ['trackingNo'],
    }
  );

type FormValues = z.infer<typeof schema>;

type AddTrackingProps = NativeStackScreenProps<RootStackParamList, 'AddTracking'>;

// Helper function to generate custom tracking ID
const generateCustomTrackingId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `DROP-${timestamp}-${random}`;
};

export const AddTrackingSheetScreen: React.FC<AddTrackingProps> = ({ navigation }) => {
  const theme = useTheme();
  const mutation = useAddTracking();
  const [carrierPickerVisible, setCarrierPickerVisible] = useState(false);
  const [originAddress, setOriginAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [originError, setOriginError] = useState<string | undefined>();
  const [destinationError, setDestinationError] = useState<string | undefined>();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      trackingNo: '',
      nickname: '',
      carrier: 'UPS',
      itemDescription: '',
    },
  });

  const selectedCarrier = watch('carrier');

  const onSubmit = handleSubmit(async (values) => {
    // Validate locations
    let hasError = false;
    if (!originAddress || originAddress.trim().length < 5) {
      setOriginError('Starting location is required (min 5 characters)');
      hasError = true;
    } else {
      setOriginError(undefined);
    }
    if (!destinationAddress || destinationAddress.trim().length < 5) {
      setDestinationError('Destination location is required (min 5 characters)');
      hasError = true;
    } else {
      setDestinationError(undefined);
    }
    if (hasError) return;

    // Generate tracking ID if carrier is 'Other'
    const trackingNo = values.carrier === 'Other' ? generateCustomTrackingId() : values.trackingNo!;

    // Create location points with placeholder coordinates (0,0)
    // In production, you would geocode these addresses to get real lat/lng
    const origin: LocationPoint = {
      lat: 0,
      lng: 0,
      address: originAddress.trim(),
    };

    const destination: LocationPoint = {
      lat: 0,
      lng: 0,
      address: destinationAddress.trim(),
    };

    await mutation.mutateAsync({
      trackingNo,
      carrier: values.carrier,
      nickname: values.nickname,
      itemDescription: values.itemDescription,
      origin,
      destination,
    });
    navigation.goBack();
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.semantic.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={styles.flex}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.semantic.text }]}>{t('addTracking.title')}</Text>
          <Pressable onPress={() => navigation.goBack()} accessibilityRole="button">
            <X color={theme.semantic.text} size={22} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Carrier Selection */}
          <Controller
            name="carrier"
            control={control}
            render={({ field: { value, onChange } }) => (
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: theme.semantic.text }]}>{t('addTracking.carrierLabel')}</Text>
                <Pressable
                  onPress={() => setCarrierPickerVisible(true)}
                  style={({ pressed }) => [
                    styles.select,
                    {
                      borderColor: theme.semantic.border,
                      backgroundColor: theme.semantic.surface,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <Text style={{ color: theme.semantic.text }}>{value}</Text>
                  <ChevronDown color={theme.semantic.textMuted} size={18} />
                </Pressable>
                {errors.carrier ? (
                  <Text style={[styles.error, { color: theme.colors.error }]}>{errors.carrier.message}</Text>
                ) : null}
                <Modal
                  visible={carrierPickerVisible}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setCarrierPickerVisible(false)}
                >
                  <Pressable style={styles.modalOverlay} onPress={() => setCarrierPickerVisible(false)}>
                    <View />
                  </Pressable>
                  <View style={[styles.modalContent, { backgroundColor: theme.semantic.surface }]}>
                    {carrierOptions.map((carrier) => (
                      <Pressable
                        key={carrier}
                        onPress={() => {
                          onChange(carrier);
                          setCarrierPickerVisible(false);
                        }}
                        style={styles.modalItem}
                      >
                        <Text style={{ color: theme.semantic.text }}>{carrier}</Text>
                      </Pressable>
                    ))}
                  </View>
                </Modal>
              </View>
            )}
          />

          {/* Tracking Number - Only show if carrier is NOT 'Other' */}
          {selectedCarrier !== 'Other' && (
            <Controller
              name="trackingNo"
              control={control}
              render={({ field: { value, onChange, onBlur } }) => (
                <FormTextInput
                  label={t('addTracking.trackingPlaceholder')}
                  autoCapitalize="characters"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  errorMessage={errors.trackingNo?.message}
                />
              )}
            />
          )}

          {/* Auto-generated tracking ID info for 'Other' carrier */}
          {selectedCarrier === 'Other' && (
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.semantic.text }]}>Tracking Number</Text>
              <View style={[styles.infoBox, { backgroundColor: theme.semantic.surface, borderColor: theme.semantic.border }]}>
                <Text style={[styles.infoText, { color: theme.semantic.textMuted }]}>
                  A custom tracking ID will be auto-generated for this order
                </Text>
              </View>
            </View>
          )}

          {/* Starting Location */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.semantic.text }]}>Starting Location *</Text>
            <TextInput
              value={originAddress}
              onChangeText={(text) => {
                setOriginAddress(text);
                if (text.trim().length >= 5) {
                  setOriginError(undefined);
                }
              }}
              placeholder="Enter pickup address"
              placeholderTextColor={theme.semantic.textMuted}
              style={[
                styles.input,
                {
                  color: theme.semantic.text,
                  backgroundColor: theme.semantic.surface,
                  borderColor: originError ? theme.colors.error : theme.semantic.border,
                },
              ]}
            />
            {originError && <Text style={[styles.error, { color: theme.colors.error }]}>{originError}</Text>}
          </View>

          {/* Destination Location */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.semantic.text }]}>Destination Location *</Text>
            <TextInput
              value={destinationAddress}
              onChangeText={(text) => {
                setDestinationAddress(text);
                if (text.trim().length >= 5) {
                  setDestinationError(undefined);
                }
              }}
              placeholder="Enter delivery address"
              placeholderTextColor={theme.semantic.textMuted}
              style={[
                styles.input,
                {
                  color: theme.semantic.text,
                  backgroundColor: theme.semantic.surface,
                  borderColor: destinationError ? theme.colors.error : theme.semantic.border,
                },
              ]}
            />
            {destinationError && <Text style={[styles.error, { color: theme.colors.error }]}>{destinationError}</Text>}
          </View>

          {/* Item Description */}
          <Controller
            name="itemDescription"
            control={control}
            render={({ field: { value, onChange, onBlur } }) => (
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: theme.semantic.text }]}>Item Description</Text>
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Describe the item being delivered (optional)"
                  placeholderTextColor={theme.semantic.textMuted}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                  style={[
                    styles.textArea,
                    {
                      color: theme.semantic.text,
                      backgroundColor: theme.semantic.surface,
                      borderColor: theme.semantic.border,
                    },
                  ]}
                />
                {errors.itemDescription && (
                  <Text style={[styles.error, { color: theme.colors.error }]}>{errors.itemDescription.message}</Text>
                )}
                <Text style={[styles.helperText, { color: theme.semantic.textMuted }]}>
                  {value?.length || 0}/500 characters
                </Text>
              </View>
            )}
          />

          {/* Nickname */}
          <Controller
            name="nickname"
            control={control}
            render={({ field: { value, onChange, onBlur } }) => (
              <FormTextInput
                label={t('addTracking.nicknamePlaceholder')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                helperText="Optional label to identify this shipment"
                errorMessage={errors.nickname?.message}
              />
            )}
          />
        </ScrollView>
        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.goBack()}
            style={styles.secondaryButton}
          >
            <Text style={[styles.secondaryLabel, { color: theme.colors.accent }]}>{t('addTracking.cancel')}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onSubmit}
            disabled={mutation.isPending}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: theme.colors.primaryTeal,
                opacity: pressed || mutation.isPending ? 0.8 : 1,
              },
            ]}
          >
            <Text style={styles.primaryLabel}>
              {mutation.isPending ? 'Adding…' : t('addTracking.submit')}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  error: {
    fontSize: 13,
  },
  helperText: {
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  modalContent: {
    margin: 24,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  modalItem: {
    paddingVertical: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    height: 50,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoText: {
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  secondaryLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  primaryLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
