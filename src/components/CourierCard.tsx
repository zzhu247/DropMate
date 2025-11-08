import React from 'react';
import { Pressable, StyleSheet, Text, View, Image } from 'react-native';

import { Checkpoint } from '@/types';
import { useTheme } from '@/theme/ThemeProvider';
import { tokens } from '@/theme/tokens';

// Import package image
const packageImage = require('@/../assets/images/package.png');

export type CourierCardProps = {
  trackingNumber: string;
  status: Checkpoint['code'];
  origin: string;
  destination: string;
  originDate: string;
  destinationDate: string;
  progress: number; // 0-100
  etaIso?: string;
  location?: string;
  updatedIso?: string;
  onPress?: () => void;
  variant?: 'yellow' | 'blue' | 'white'; // Background color variant
};

export const CourierCard: React.FC<CourierCardProps> = ({
  trackingNumber,
  status,
  origin,
  destination,
  originDate,
  destinationDate,
  progress,
  onPress,
  variant = 'white', // ADD THIS LINE - it was missing!
}) => {
  const theme = useTheme();

  const getStatusColor = () => {
    switch (status) {
      case 'IN_TRANSIT':
        return tokens.colors.statusInTransit;
      case 'OUT_FOR_DELIVERY':
        return tokens.colors.statusOutForDelivery;
      case 'DELIVERED':
        return tokens.colors.statusDelivered;
      case 'EXCEPTION':
        return tokens.colors.statusException;
      case 'CREATED':
        return tokens.colors.statusCreated;
      default:
        return tokens.colors.statusInTransit;
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'IN_TRANSIT':
        return 'In Transit';
      case 'OUT_FOR_DELIVERY':
        return 'Out for Delivery';
      case 'DELIVERED':
        return 'Delivered';
      case 'EXCEPTION':
        return 'Exception';
      case 'CREATED':
        return 'Created';
      default:
        return 'In Transit';
    }
  };

  const statusColor = getStatusColor();

  // Get background color based on variant
  const getBackgroundColor = () => {
    switch (variant) {
      case 'yellow':
        return tokens.colors.cardBackgroundYellow;
      case 'blue':
        return tokens.colors.cardBackgroundBlue;
      case 'white':
      default:
        return theme.semantic.surface || tokens.colors.surface;
    }
  };

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'summary'}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: getBackgroundColor(),
          opacity: pressed ? 0.95 : 1,
        },
      ]}
    >
      <View style={styles.cardContent}>
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{getStatusLabel()}</Text>
        </View>

        {/* Tracking Number */}
        <Text style={[styles.trackingNumber, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
          #{trackingNumber}
        </Text>

        {/* Progress Timeline */}
        <View style={styles.timelineContainer}>
          <View style={[styles.timeline, { backgroundColor: theme.semantic.border || tokens.colors.timelineInactive }]}>
            {/* Start Dot */}
            <View style={[styles.timelineStart, { backgroundColor: statusColor }]} />
            
            {/* Progress Bar */}
            <View
              style={[
                styles.timelineBar,
                { 
                  width: `${progress}%`, 
                  backgroundColor: statusColor 
                },
              ]}
            />
            
            {/* End Dot */}
            <View
              style={[
                styles.timelineEnd,
                {
                  backgroundColor: progress === 100 ? statusColor : 'transparent',
                  borderColor: statusColor,
                  borderWidth: 2,
                },
              ]}
            />
          </View>
        </View>

        {/* Location Info - Horizontal Layout */}
        <View style={styles.locationRow}>
          <View style={styles.locationItem}>
            <Text style={[styles.locationName, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
              {origin}
            </Text>
            <Text style={[styles.locationDate, { color: theme.semantic.textMuted || tokens.colors.textSecondary }]}>
              {originDate}
            </Text>
          </View>
          <View style={[styles.locationItem, styles.locationItemRight]}>
            <Text style={[styles.locationName, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
              {destination}
            </Text>
            <Text style={[styles.locationDate, { color: theme.semantic.textMuted || tokens.colors.textSecondary }]}>
              {destinationDate}
            </Text>
          </View>
        </View>
      </View>

      {/* Package Illustration */}
      <View style={styles.packageIllustration}>
        <Image 
          source={packageImage} 
          style={styles.packageImage}
          resizeMode="contain"
        />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 0, // Remove horizontal margin since it's inside a card now
    marginBottom: tokens.spacing.md,
    borderRadius: tokens.radii.card,
    overflow: 'visible',
    ...tokens.shadows.sm,
  },
  cardContent: {
    padding: tokens.spacing.lg,
    paddingRight: 140, // More space for larger package
    gap: tokens.spacing.md,
    minHeight: 140, // Make card taller
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xxs,
    borderRadius: tokens.radii.pill,
  },
  statusText: {
    color: tokens.colors.surface,
    fontSize: 11,
    fontWeight: '600',
  },
  trackingNumber: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  timelineContainer: {
    paddingHorizontal: 0,
    marginVertical: tokens.spacing.xxs,
  },
  timeline: {
    height: 3,
    borderRadius: 2,
    position: 'relative',
    overflow: 'visible',
  },
  timelineBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    borderRadius: 2,
  },
  timelineStart: {
    position: 'absolute',
    left: -1,
    top: -3.5,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timelineEnd: {
    position: 'absolute',
    right: -1,
    top: -3.5,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: tokens.spacing.md,
  },
  locationItem: {
    flex: 1,
    gap: 2,
  },
  locationItemRight: {
    alignItems: 'flex-end',
  },
  locationName: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  locationDate: {
    fontSize: 11,
    lineHeight: 16,
  },
  packageIllustration: {
    position: 'absolute',
    right: tokens.spacing.md,
    bottom: tokens.spacing.sm,
    width: 100,
    height: 100,
  },
  packageImage: {
    width: '100%',
    height: '100%',
  },
});