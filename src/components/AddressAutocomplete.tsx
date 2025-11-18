import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
  StyleProp,
  Pressable,
  ActivityIndicator,
  Modal,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from 'react-native';
import Constants from 'expo-constants';

import { useTheme } from '@/theme/ThemeProvider';
import { tokens } from '@/theme/tokens';

export type AddressDetails = {
  address: string;
  latitude: number;
  longitude: number;
  placeId: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
};

export type AddressAutocompleteProps = {
  label?: string;
  placeholder?: string;
  value?: string;
  onAddressSelect: (details: AddressDetails) => void;
  errorMessage?: string;
  helperText?: string;
  containerStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

type PlacePrediction = {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
};

/**
 * Address Autocomplete Component
 * Uses Google Places API REST endpoints directly
 * Compatible with both legacy and new Places API
 */
export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  label,
  placeholder = 'Search address',
  value,
  onAddressSelect,
  errorMessage,
  helperText,
  containerStyle,
  disabled = false,
}) => {
  const theme = useTheme();
  const hasError = Boolean(errorMessage);

  const [inputValue, setInputValue] = useState(value || '');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState({ x: 0, y: 0, width: 0 });
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const inputContainerRef = useRef<View>(null);
  const textInputRef = useRef<TextInput>(null);

  // Get API key from environment
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  // Debug: Check if API key is loaded
  console.log('[AddressAutocomplete] API Key status:', {
    loaded: !!apiKey,
    length: apiKey.length,
    preview: apiKey ? apiKey.substring(0, 10) + '...' : 'NOT LOADED',
    rawValue: apiKey === '${GOOGLE_MAPS_API_KEY}' ? 'PLACEHOLDER - ENV NOT LOADED!' : 'OK'
  });

  // Early return if no API key
  if (!apiKey || apiKey === '${GOOGLE_MAPS_API_KEY}') {
    console.error('[AddressAutocomplete] ⚠️  API Key not loaded! Restart Expo with: npx expo start --clear');
  }

  // Fetch autocomplete predictions
  const fetchPredictions = async (input: string) => {
    if (!input || input.length < 3) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);

    try {
      // Build query parameters for better address matching
      const params = new URLSearchParams({
        input: input,
        key: apiKey,
        types: 'geocode', // Use geocode for better address precision
        // components: 'country:ca', // Temporarily removed to test
        language: 'en',
      });

      console.log('[AddressAutocomplete] API URL:',
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`
      );

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`
      );

      const data = await response.json();

      console.log('[AddressAutocomplete] API Response:', {
        status: data.status,
        count: data.predictions?.length || 0,
        query: input,
        error: data.error_message,
      });

      if (data.status === 'OK' && data.predictions) {
        console.log('[AddressAutocomplete] Raw predictions:',
          data.predictions.map((p: any) => p.description)
        );

        // Smart filtering for better address matching
        const lowerInput = input.toLowerCase();
        const inputWords = lowerInput.split(/\s+/).filter(w => w.length > 0);

        const filteredPredictions = data.predictions
          .map((pred: PlacePrediction) => {
            const lowerDesc = pred.description.toLowerCase();
            const lowerMain = pred.structured_formatting.main_text.toLowerCase();

            // Calculate relevance score
            let score = 0;

            // Strong match: main text contains all input words in order
            if (inputWords.every(word => lowerMain.includes(word))) {
              score += 100;
            }

            // Medium match: description contains all input words
            if (inputWords.every(word => lowerDesc.includes(word))) {
              score += 50;
            }

            // For numbered addresses, prioritize exact street name matches
            const firstWord = inputWords[0];
            if (!isNaN(Number(firstWord)) && inputWords.length > 1) {
              const streetName = inputWords.slice(1).join(' ');
              if (lowerMain.includes(streetName)) {
                score += 75;
              }
            }

            // Penalty for missing key words (but be more lenient)
            const missingWords = inputWords.filter(word => !lowerDesc.includes(word));
            score -= missingWords.length * 10; // Reduced penalty from 20 to 10

            return { ...pred, relevanceScore: score };
          })
          .filter((pred: any) => pred.relevanceScore > -20) // More lenient filtering (was > 0)
          .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore) // Sort by relevance
          .slice(0, 5); // Top 5 results

        console.log('[AddressAutocomplete] Filtered predictions:', {
          total: data.predictions.length,
          filtered: filteredPredictions.length,
          scores: filteredPredictions.map((p: any) => ({ desc: p.description, score: p.relevanceScore }))
        });

        setPredictions(filteredPredictions);
        setShowDropdown(filteredPredictions.length > 0);
      } else if (data.status === 'ZERO_RESULTS') {
        setPredictions([]);
        setShowDropdown(false);
      } else {
        console.error('[AddressAutocomplete] API Error:', data.status, data.error_message);
        setPredictions([]);
        setShowDropdown(false);
      }
    } catch (error) {
      console.error('[AddressAutocomplete] Fetch Error:', error);
      setPredictions([]);
      setShowDropdown(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch place details
  const fetchPlaceDetails = async (placeId: string) => {
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=formatted_address,geometry,address_components`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        const result = data.result;

        // Extract address components
        const addressComponents = result.address_components || [];
        let city = '';
        let state = '';
        let country = '';
        let postalCode = '';

        addressComponents.forEach((component: any) => {
          const types = component.types || [];
          if (types.includes('locality')) {
            city = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            state = component.short_name;
          } else if (types.includes('country')) {
            country = component.long_name;
          } else if (types.includes('postal_code')) {
            postalCode = component.long_name;
          }
        });

        const addressDetails: AddressDetails = {
          address: result.formatted_address,
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
          placeId: placeId,
          city,
          state,
          country,
          postalCode,
        };

        setInputValue(result.formatted_address);
        onAddressSelect(addressDetails);
        setShowDropdown(false);
        setPredictions([]);

        // Keep keyboard open by refocusing the input after a brief delay
        setTimeout(() => {
          textInputRef.current?.focus();
        }, 100);
      } else {
        console.error('[AddressAutocomplete] Place Details Error:', data.status);
      }
    } catch (error) {
      console.error('[AddressAutocomplete] Place Details Fetch Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Measure input position for dropdown placement
  const measureInputPosition = () => {
    if (inputContainerRef.current) {
      inputContainerRef.current.measureInWindow((x, y, width, height) => {
        setDropdownLayout({ x, y: y + height, width });
      });
    }
  };

  // Handle text input change with debouncing
  const handleTextChange = (text: string) => {
    setInputValue(text);

    // Measure position when user starts typing
    if (text.length >= 3) {
      measureInputPosition();
    }

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      fetchPredictions(text);
    }, 300);
  };

  // Handle prediction selection
  const handleSelectPrediction = (prediction: PlacePrediction) => {
    fetchPlaceDetails(prediction.place_id);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <View style={containerStyle}>
      {label ? (
        <Text style={[styles.label, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
          {label}
        </Text>
      ) : null}

      <View
        ref={inputContainerRef}
        style={[
          styles.inputContainer,
          {
            borderColor: hasError
              ? theme.semantic.error || tokens.colors.error
              : theme.semantic.border || tokens.colors.border,
            backgroundColor: theme.semantic.surface || tokens.colors.surface,
          },
        ]}
      >
        <TextInput
          ref={textInputRef}
          style={[styles.input, { color: theme.semantic.text || tokens.colors.textPrimary }]}
          placeholder={placeholder}
          placeholderTextColor={theme.semantic.textMuted || tokens.colors.textTertiary}
          value={inputValue}
          onChangeText={handleTextChange}
          editable={!disabled}
          autoCapitalize="words"
          autoCorrect={false}
        />
        {isLoading && (
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="small" color={theme.semantic.text} />
          </View>
        )}
      </View>

      {/* Dropdown Modal - renders on top of everything */}
      <Modal
        transparent
        visible={showDropdown && predictions.length > 0}
        animationType="none"
        onRequestClose={() => setShowDropdown(false)}
      >
        <>
          {/* Backdrop - closes dropdown when tapped */}
          <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
            <View style={styles.modalOverlay} />
          </TouchableWithoutFeedback>

          {/* Dropdown content - doesn't close keyboard when tapped */}
          <View
            style={[
              styles.dropdownModal,
              {
                top: dropdownLayout.y,
                left: dropdownLayout.x,
                width: dropdownLayout.width,
                backgroundColor: theme.semantic.surface || tokens.colors.surface,
                borderColor: theme.semantic.border || tokens.colors.border,
              },
            ]}
          >
            <ScrollView
              style={styles.dropdownScroll}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {predictions.map((item) => (
                <TouchableOpacity
                  key={item.place_id}
                  style={styles.predictionItem}
                  activeOpacity={0.7}
                  onPress={() => handleSelectPrediction(item)}
                >
                  <Text
                    style={[styles.mainText, { color: theme.semantic.text || tokens.colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {item.structured_formatting.main_text}
                  </Text>
                  <Text
                    style={[
                      styles.secondaryText,
                      { color: theme.semantic.textMuted || tokens.colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {item.structured_formatting.secondary_text}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </>
      </Modal>

      {hasError ? (
        <Text style={[styles.error, { color: theme.semantic.error || tokens.colors.error }]}>
          {errorMessage}
        </Text>
      ) : helperText ? (
        <Text style={[styles.helper, { color: theme.semantic.textMuted || tokens.colors.textSecondary }]}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    marginBottom: tokens.spacing.xxs,
    ...tokens.typography.smallMedium,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: tokens.radii.input,
    borderWidth: 1,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.sm - 2,
    minHeight: 48,
  },
  input: {
    flex: 1,
    ...tokens.typography.body,
    padding: 0,
  },
  loadingIndicator: {
    marginLeft: tokens.spacing.xs,
  },
  modalOverlay: {
    flex: 1,
  },
  dropdownModal: {
    position: 'absolute',
    maxHeight: 200,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    zIndex: 10000,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  predictionItem: {
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  mainText: {
    ...tokens.typography.bodyMedium,
    marginBottom: tokens.spacing.xxs,
  },
  secondaryText: {
    ...tokens.typography.caption,
  },
  error: {
    marginTop: tokens.spacing.xxs,
    ...tokens.typography.caption,
  },
  helper: {
    marginTop: tokens.spacing.xxs,
    ...tokens.typography.caption,
  },
});
