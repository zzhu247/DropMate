import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Package, MapPin, User, Phone, Clock } from 'lucide-react-native';

import { FormTextInput } from '@/components/FormTextInput';
import { useTheme } from '@/theme/ThemeProvider';
import { tokens } from '@/theme/tokens';
import { RootStackParamList } from '@/navigation/types';

// Generate time slots from 9 AM to 10 PM in 30-minute windows
const generateTimeSlots = () => {
  const slots: string[] = [];
  for (let hour = 9; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 22 && minute > 0) break; // Stop at 10:00 PM
      const time = new Date();
      time.setHours(hour, minute, 0);
      const timeString = time.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      slots.push(timeString);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

export const PlaceOrderScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Form state
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderAddress, setSenderAddress] = useState('');

  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');

  const [packageWeight, setPackageWeight] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  
  // Optional preferred time
  const [preferredTime, setPreferredTime] = useState<string | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Sender validation
    if (!senderName.trim()) newErrors.senderName = 'Sender name is required';
    if (!senderPhone.trim()) newErrors.senderPhone = 'Sender phone is required';
    if (!senderAddress.trim()) newErrors.senderAddress = 'Sender address is required';

    // Receiver validation
    if (!receiverName.trim()) newErrors.receiverName = 'Receiver name is required';
    if (!receiverPhone.trim()) newErrors.receiverPhone = 'Receiver phone is required';
    if (!receiverAddress.trim()) newErrors.receiverAddress = 'Receiver address is required';

    // Package validation
    if (!packageWeight.trim()) newErrors.packageWeight = 'Weight is required';
    if (!packageDescription.trim()) newErrors.packageDescription = 'Description is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const orderData = {
      sender: {
        name: senderName,
        phone: senderPhone,
        address: senderAddress,
      },
      receiver: {
        name: receiverName,
        phone: receiverPhone,
        address: receiverAddress,
      },
      package: {
        weight: packageWeight,
        description: packageDescription,
      },
      preferredTime: preferredTime || null, // Optional
    };

    console.log('Order Data:', orderData);

    Alert.alert(
      'Success',
      'Your order has been placed successfully!',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <SafeAreaView 
      style={[styles.safeArea, { backgroundColor: theme.semantic.background || tokens.colors.primaryBeige }]}
      edges={['top', 'left', 'right']}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.semantic.background || tokens.colors.primaryBeige }]}>
        <Pressable 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
          accessibilityRole="button"
        >
          <ArrowLeft 
            color={theme.semantic.text || tokens.colors.textPrimary} 
            size={24}
            strokeWidth={2}
          />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
          Place Order
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Sender Section */}
        <View style={[styles.section, { backgroundColor: theme.semantic.surface || tokens.colors.surface }]}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color={theme.semantic.text || tokens.colors.textPrimary} strokeWidth={2} />
            <Text style={[styles.sectionTitle, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
              Sender Information
            </Text>
          </View>

          <FormTextInput
            label="Full Name"
            placeholder="John Doe"
            value={senderName}
            onChangeText={setSenderName}
            errorMessage={errors.senderName}
            leftAccessory={<User size={18} color={theme.semantic.textMuted || tokens.colors.textSecondary} />}
          />

          <FormTextInput
            label="Phone Number"
            placeholder="+1 (555) 000-0000"
            value={senderPhone}
            onChangeText={setSenderPhone}
            keyboardType="phone-pad"
            errorMessage={errors.senderPhone}
            leftAccessory={<Phone size={18} color={theme.semantic.textMuted || tokens.colors.textSecondary} />}
          />

          <FormTextInput
            label="Address"
            placeholder="123 Main Street, Toronto, ON M5V 3A8"
            value={senderAddress}
            onChangeText={setSenderAddress}
            errorMessage={errors.senderAddress}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Receiver Section */}
        <View style={[styles.section, { backgroundColor: theme.semantic.surface || tokens.colors.surface }]}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color={theme.semantic.text || tokens.colors.textPrimary} strokeWidth={2} />
            <Text style={[styles.sectionTitle, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
              Receiver Information
            </Text>
          </View>

          <FormTextInput
            label="Full Name"
            placeholder="Jane Smith"
            value={receiverName}
            onChangeText={setReceiverName}
            errorMessage={errors.receiverName}
            leftAccessory={<User size={18} color={theme.semantic.textMuted || tokens.colors.textSecondary} />}
          />

          <FormTextInput
            label="Phone Number"
            placeholder="+1 (555) 000-0000"
            value={receiverPhone}
            onChangeText={setReceiverPhone}
            keyboardType="phone-pad"
            errorMessage={errors.receiverPhone}
            leftAccessory={<Phone size={18} color={theme.semantic.textMuted || tokens.colors.textSecondary} />}
          />

          <FormTextInput
            label="Address"
            placeholder="456 Oak Avenue, Vancouver, BC V6B 2W9"
            value={receiverAddress}
            onChangeText={setReceiverAddress}
            errorMessage={errors.receiverAddress}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Package Section */}
        <View style={[styles.section, { backgroundColor: theme.semantic.surface || tokens.colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Package size={20} color={theme.semantic.text || tokens.colors.textPrimary} strokeWidth={2} />
            <Text style={[styles.sectionTitle, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
              Package Details
            </Text>
          </View>

          <FormTextInput
            label="Weight (kg)"
            placeholder="2.5"
            value={packageWeight}
            onChangeText={setPackageWeight}
            keyboardType="decimal-pad"
            errorMessage={errors.packageWeight}
          />

          <FormTextInput
            label="Description"
            placeholder="Books, Electronics, Clothing, etc."
            value={packageDescription}
            onChangeText={setPackageDescription}
            errorMessage={errors.packageDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Preferred Time Section (Optional) */}
        <View style={[styles.section, { backgroundColor: theme.semantic.surface || tokens.colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color={theme.semantic.text || tokens.colors.textPrimary} strokeWidth={2} />
            <Text style={[styles.sectionTitle, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
              Preferred Delivery Time
            </Text>
            <Text style={[styles.optionalBadge, { color: theme.semantic.textMuted || tokens.colors.textSecondary }]}>
              (Optional)
            </Text>
          </View>

          <Pressable
            style={[styles.timePickerButton, { 
              backgroundColor: tokens.colors.cardBackgroundYellow,
              borderColor: theme.semantic.border || tokens.colors.border,
            }]}
            onPress={() => setShowTimePicker(!showTimePicker)}
          >
            <Clock size={18} color={theme.semantic.text || tokens.colors.textPrimary} />
            <Text style={[styles.timePickerText, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
              {preferredTime || 'Select preferred time'}
            </Text>
          </Pressable>

          {showTimePicker && (
            <View style={styles.timeSlotContainer}>
              <ScrollView 
                style={styles.timeSlotScroll} 
                contentContainerStyle={styles.timeSlotContent}
                showsVerticalScrollIndicator={false}
              >
                <Pressable
                  style={[
                    styles.timeSlot,
                    {
                      backgroundColor: !preferredTime ? tokens.colors.cardBackgroundYellow : tokens.colors.surface,
                      borderColor: !preferredTime ? tokens.colors.textPrimary : tokens.colors.border,
                    },
                  ]}
                  onPress={() => {
                    setPreferredTime(null);
                    setShowTimePicker(false);
                  }}
                >
                  <Text style={[
                    styles.timeSlotText,
                    { 
                      color: theme.semantic.text || tokens.colors.textPrimary,
                      fontWeight: !preferredTime ? '600' : '400',
                    },
                  ]}>
                    No preference
                  </Text>
                </Pressable>

                {TIME_SLOTS.map((slot, index) => (
                  <Pressable
                    key={index}
                    style={[
                      styles.timeSlot,
                      {
                        backgroundColor: preferredTime === slot ? tokens.colors.cardBackgroundYellow : tokens.colors.surface,
                        borderColor: preferredTime === slot ? tokens.colors.textPrimary : tokens.colors.border,
                      },
                    ]}
                    onPress={() => {
                      setPreferredTime(slot);
                      setShowTimePicker(false);
                    }}
                  >
                    <Text style={[
                      styles.timeSlotText,
                      { 
                        color: theme.semantic.text || tokens.colors.textPrimary,
                        fontWeight: preferredTime === slot ? '600' : '400',
                      },
                    ]}>
                      {slot}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            { 
              backgroundColor: tokens.colors.packageOrange,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
          onPress={handlePlaceOrder}
        >
          <Text style={styles.submitButtonText}>Place Order</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
  },
  backButton: {
    padding: tokens.spacing.xs,
    marginLeft: -tokens.spacing.xs,
  },
  headerTitle: {
    ...tokens.typography.h3,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: tokens.spacing.lg,
    gap: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xxxl,
  },
  section: {
    padding: tokens.spacing.lg,
    borderRadius: tokens.radii.card,
    gap: tokens.spacing.md,
    ...tokens.shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    marginBottom: tokens.spacing.xs,
  },
  sectionTitle: {
    ...tokens.typography.h4,
  },
  optionalBadge: {
    ...tokens.typography.caption,
    marginLeft: tokens.spacing.xxs,
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    padding: tokens.spacing.md,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
  },
  timePickerText: {
    ...tokens.typography.body,
    flex: 1,
  },
  timeSlotContainer: {
    maxHeight: 200,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    overflow: 'hidden',
  },
  timeSlotScroll: {
    flex: 1,
  },
  timeSlotContent: {
    padding: tokens.spacing.xs,
    gap: tokens.spacing.xs,
  },
  timeSlot: {
    padding: tokens.spacing.sm,
    borderRadius: tokens.radii.sm,
    borderWidth: 1,
  },
  timeSlotText: {
    ...tokens.typography.body,
  },
  submitButton: {
    padding: tokens.spacing.lg,
    borderRadius: tokens.radii.md,
    alignItems: 'center',
    marginTop: tokens.spacing.md,
    ...tokens.shadows.md,
  },
  submitButtonText: {
    color: tokens.colors.surface,
    ...tokens.typography.h4,
    fontWeight: '700',
  },
});