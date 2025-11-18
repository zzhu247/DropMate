import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Alert,
  Modal,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ArrowLeft,
  Package,
  MapPin,
  User,
  Phone,
  Clock,
  X,
} from "lucide-react-native";

import { FormTextInput } from "@/components/FormTextInput";
import { AddressAutocomplete, AddressDetails } from "@/components/AddressAutocomplete";
import { useTheme } from "@/theme/ThemeProvider";
import { tokens } from "@/theme/tokens";
import { RootStackParamList } from "@/navigation/types";
import { userService } from "@/api/userService";

/* ----------------------------- TIME SLOTS ----------------------------- */

const TIME_SLOTS = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
  "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM",
  "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM",
  "9:00 PM", "9:30 PM", "10:00 PM",
];

/* ----------------------- PHONE SANITIZER ----------------------- */

const ensurePlusOnePrefix = (text: string) => {
  let cleaned = text.replace(/[^0-9+]/g, "");
  if (!cleaned.startsWith("+1")) {
    cleaned = "+1" + cleaned.replace(/[^0-9]/g, "");
  }
  return cleaned;
};

/* --------------------------------------------------------------------- */

export const PlaceOrderScreen: React.FC = () => {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // FORM
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("+1");
  const [senderAddress, setSenderAddress] = useState<AddressDetails | null>(null);

  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("+1");
  const [receiverAddress, setReceiverAddress] = useState<AddressDetails | null>(null);

  const [packageWeight, setPackageWeight] = useState("");
  const [packageDescription, setPackageDescription] = useState("");

  // TIME PICKER
  const [preferredTime, setPreferredTime] = useState<string | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // LOADING STATE
  const [loading, setLoading] = useState(false);

  // ANIMATION
  const slideAnim = useState(new Animated.Value(0))[0];

  const openSheet = () => {
    setShowTimePicker(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setShowTimePicker(false);
    });
  };

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!senderName.trim()) newErrors.senderName = "Sender name is required";
    if (senderPhone === "+1") newErrors.senderPhone = "Sender phone is required";
    if (!senderAddress) newErrors.senderAddress = "Sender address is required";

    if (!receiverName.trim()) newErrors.receiverName = "Receiver name is required";
    if (receiverPhone === "+1")
      newErrors.receiverPhone = "Receiver phone is required";
    if (!receiverAddress)
      newErrors.receiverAddress = "Receiver address is required";

    if (!packageWeight.trim()) newErrors.packageWeight = "Weight is required";
    if (!packageDescription.trim())
      newErrors.packageDescription = "Description is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);

      // Prepare shipment data in backend format
      const shipmentData = {
        sender: {
          name: senderName,
          phone: senderPhone,
          address: senderAddress?.address || '',
          latitude: senderAddress?.latitude,
          longitude: senderAddress?.longitude,
        },
        receiver: {
          name: receiverName,
          phone: receiverPhone,
          address: receiverAddress?.address || '',
          latitude: receiverAddress?.latitude,
          longitude: receiverAddress?.longitude,
        },
        package: {
          weight: parseFloat(packageWeight) || 0,
          description: packageDescription,
          details: preferredTime ? { preferredTime } : undefined,
        },
        totalAmount: 0, // Will be calculated on backend
      };

      console.log("Creating shipment:", shipmentData);

      // Call backend API to create shipment
      const response = await userService.createShipment(shipmentData);

      console.log("Shipment created successfully:", response);

      Alert.alert("Success", "Your order has been placed.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error("Failed to create order:", error);

      // Show user-friendly error message
      const errorMessage = error?.response?.data?.error ||
                          error?.message ||
                          "Failed to place order. Please try again.";

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme.semantic.background || tokens.colors.primaryBeige },
      ]}
      edges={["top", "left", "right"]}
    >
      {/* HEADER */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.semantic.background || tokens.colors.primaryBeige },
        ]}
      >
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={theme.semantic.text} size={24} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: theme.semantic.text }]}>
          Place Order
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* --- SENDER --- */}
        <View
          style={[
            styles.section,
            { backgroundColor: theme.semantic.surface || tokens.colors.surface },
          ]}
        >
          <View style={styles.sectionHeader}>
            <MapPin size={20} color={theme.semantic.text} />
            <Text style={[styles.sectionTitle, { color: theme.semantic.text }]}>
              Sender Information
            </Text>
          </View>

          <FormTextInput
            label="Full Name"
            placeholder="John Doe"
            value={senderName}
            onChangeText={setSenderName}
            errorMessage={errors.senderName}
            leftAccessory={<User size={18} color={theme.semantic.textMuted} />}
          />

          <FormTextInput
            label="Phone Number"
            placeholder="+1"
            value={senderPhone}
            onChangeText={(t) => setSenderPhone(ensurePlusOnePrefix(t))}
            keyboardType="number-pad"
            errorMessage={errors.senderPhone}
            leftAccessory={<Phone size={18} color={theme.semantic.textMuted} />}
          />

          <AddressAutocomplete
            label="Address"
            placeholder="Search address"
            value={senderAddress?.address}
            onAddressSelect={setSenderAddress}
            errorMessage={errors.senderAddress}
          />
        </View>

        {/* --- RECEIVER --- */}
        <View
          style={[
            styles.section,
            { backgroundColor: theme.semantic.surface || tokens.colors.surface },
          ]}
        >
          <View style={styles.sectionHeader}>
            <MapPin size={20} color={theme.semantic.text} />
            <Text style={[styles.sectionTitle, { color: theme.semantic.text }]}>
              Receiver Information
            </Text>
          </View>

          <FormTextInput
            label="Full Name"
            placeholder="Jane Smith"
            value={receiverName}
            onChangeText={setReceiverName}
            errorMessage={errors.receiverName}
            leftAccessory={<User size={18} color={theme.semantic.textMuted} />}
          />

          <FormTextInput
            label="Phone Number"
            placeholder="+1"
            value={receiverPhone}
            onChangeText={(t) => setReceiverPhone(ensurePlusOnePrefix(t))}
            keyboardType="number-pad"
            errorMessage={errors.receiverPhone}
            leftAccessory={<Phone size={18} color={theme.semantic.textMuted} />}
          />

          <AddressAutocomplete
            label="Address"
            placeholder="Search address"
            value={receiverAddress?.address}
            onAddressSelect={setReceiverAddress}
            errorMessage={errors.receiverAddress}
          />
        </View>

        {/* --- PACKAGE --- */}
        <View
          style={[
            styles.section,
            { backgroundColor: theme.semantic.surface || tokens.colors.surface },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Package size={20} color={theme.semantic.text} />
            <Text style={[styles.sectionTitle, { color: theme.semantic.text }]}>
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
            placeholder="Books, Electronics, Clothing..."
            value={packageDescription}
            onChangeText={setPackageDescription}
            errorMessage={errors.packageDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* --- TIME PICKER --- */}
        <View
          style={[
            styles.section,
            { backgroundColor: theme.semantic.surface || tokens.colors.surface },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Clock size={20} color={theme.semantic.text} />
            <Text style={[styles.sectionTitle, { color: theme.semantic.text }]}>
              Preferred Delivery Time
            </Text>
            <Text style={[styles.optionalBadge, { color: theme.semantic.textMuted }]}>
              (Optional)
            </Text>
          </View>

          <Pressable
            style={[
              styles.timePickerButton,
              {
                backgroundColor: tokens.colors.cardBackgroundYellow,
                borderColor: theme.semantic.border,
              },
            ]}
            onPress={openSheet}
          >
            <Clock size={18} color={theme.semantic.text} />
            <Text style={[styles.timePickerText, { color: theme.semantic.text }]}>
              {preferredTime || "Select preferred time"}
            </Text>
          </Pressable>
        </View>

        {/* --- SUBMIT --- */}
        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            {
              backgroundColor: tokens.colors.packageOrange,
              opacity: loading ? 0.6 : pressed ? 0.9 : 1,
            },
          ]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? "Placing Order..." : "Place Order"}
          </Text>
        </Pressable>
      </ScrollView>

      {/* -------------------- SLIDING BOTTOM SHEET -------------------- */}
      <Modal transparent visible={showTimePicker} animationType="none">
        <Pressable style={styles.modalBackdrop} onPress={closeSheet} />

        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [350, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* X BUTTON */}
          <Pressable style={styles.closeButton} onPress={closeSheet}>
            <X size={22} color={theme.semantic.text} />
          </Pressable>

          <Text style={styles.sheetTitle}>Select Preferred Time</Text>

          <ScrollView
            style={{ maxHeight: 320 }}
            contentContainerStyle={{ padding: 10, gap: 10 }}
            showsVerticalScrollIndicator={false}
          >
            {/* NO PREFERENCE */}
            <Pressable
              style={[
                styles.timeOption,
                {
                  backgroundColor:
                    preferredTime === null
                      ? tokens.colors.cardBackgroundYellow
                      : tokens.colors.surface,
                },
              ]}
              onPress={() => {
                setPreferredTime(null);
                closeSheet();
              }}
            >
              <Text style={styles.timeOptionText}>No preference</Text>
            </Pressable>

            {/* TIME SLOTS */}
            {TIME_SLOTS.map((slot, index) => (
              <Pressable
                key={index}
                style={[
                  styles.timeOption,
                  {
                    backgroundColor:
                      preferredTime === slot
                        ? tokens.colors.cardBackgroundYellow
                        : tokens.colors.surface,
                  },
                ]}
                onPress={() => {
                  setPreferredTime(slot);
                  closeSheet();
                }}
              >
                <Text style={styles.timeOptionText}>{slot}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
};

/* ------------------------------- STYLES ------------------------------- */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
  },
  backButton: {
    padding: tokens.spacing.xs,
  },
  headerTitle: {
    ...tokens.typography.h3,
    flex: 1,
    textAlign: "center",
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
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.xs,
    marginBottom: tokens.spacing.xs,
  },
  sectionTitle: {
    ...tokens.typography.h4,
  },
  optionalBadge: {
    ...tokens.typography.caption,
    marginLeft: 4,
  },

  timePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.sm,
    padding: tokens.spacing.md,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
  },
  timePickerText: {
    ...tokens.typography.body,
    flex: 1,
  },

  submitButton: {
    padding: tokens.spacing.lg,
    borderRadius: tokens.radii.md,
    alignItems: "center",
    marginTop: tokens.spacing.md,
    ...tokens.shadows.md,
  },
  submitButtonText: {
    color: tokens.colors.surface,
    ...tokens.typography.h4,
    fontWeight: "700",
  },

  /* ----- MODAL ----- */

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  sheetContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: tokens.colors.surface,
    padding: tokens.spacing.lg,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    ...tokens.shadows.lg,
  },

  closeButton: {
    position: "absolute",
    right: 16,
    top: 16,
    padding: 6,
    zIndex: 20,
  },

  sheetTitle: {
    ...tokens.typography.h4,
    textAlign: "center",
    marginVertical: tokens.spacing.md,
  },

  timeOption: {
    padding: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    alignItems: "center",
  },

  timeOptionText: {
    ...tokens.typography.body,
  },
});
