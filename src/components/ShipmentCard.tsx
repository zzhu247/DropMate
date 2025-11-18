import React, { useMemo } from 'react';
import { Pressable, PressableProps, StyleSheet, Text, View } from 'react-native';

import { Shipment } from '@/types';
import { formatShipmentSubtitle, formatShipmentTitle, formatAbsoluteTime } from '@/utils/format';
import { StatusPill } from './StatusPill';
import { useTheme } from '@/theme/ThemeProvider';
import { tokens } from '@/theme/tokens';

export type ShipmentCardProps = PressableProps & {
  shipment: Shipment;
  variant?: 'default' | 'detailed'; // New variant for details screen
  compactTimeline?: boolean;
  footer?: React.ReactNode;
  showProgress?: boolean;
};

const ShipmentCardComponent: React.FC<ShipmentCardProps> = ({
  shipment,
  variant = 'default',
  compactTimeline = true,
  footer,
  showProgress = true,
  style: externalStyle,
  ...pressableProps
}) => {
  const theme = useTheme();

  const latestUpdate = useMemo(() => {
    if (shipment.checkpoints.length === 0) {
      return null;
    }
    return shipment.checkpoints[shipment.checkpoints.length - 1];
  }, [shipment.checkpoints]);

  // Calculate progress based on status
  const progress = useMemo(() => {
    const statusProgress = {
      CREATED: 20,
      IN_TRANSIT: 50,
      OUT_FOR_DELIVERY: 80,
      DELIVERED: 100,
      EXCEPTION: 50,
    };
    return statusProgress[shipment.status] || 0;
  }, [shipment.status]);

  // Get origin and destination info from properly mapped fields
  const originInfo = useMemo(() => {
    const firstCheckpoint = shipment.checkpoints[0];
    return {
      location: shipment.origin?.address || 'Origin',
      date: firstCheckpoint ? formatAbsoluteTime(firstCheckpoint.timeIso) : 'N/A',
    };
  }, [shipment.origin, shipment.checkpoints]);

  const destinationInfo = useMemo(() => {
    return {
      location: shipment.destination?.address || 'Destination',
      date: latestUpdate ? formatAbsoluteTime(latestUpdate.timeIso) : 'N/A',
    };
  }, [shipment.destination, latestUpdate]);

  // Detailed variant (for ShipmentDetails screen)
  if (variant === 'detailed') {
    return (
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => {
          const resolvedExternalStyle =
            typeof externalStyle === 'function' ? externalStyle({ pressed }) : externalStyle;

          return [
            styles.detailedContainer,
            {
              backgroundColor: theme.semantic.surface || tokens.colors.surface,
              opacity: pressed ? 0.95 : 1,
            },
            resolvedExternalStyle,
          ];
        }}
        {...pressableProps}
      >
        <View style={styles.detailedContent}>
          {/* Header Row */}
          <View style={styles.detailedHeader}>
            <View>
              <Text style={[styles.detailedLabel, { color: theme.semantic.textMuted || tokens.colors.textSecondary }]}>
                Booking id
              </Text>
              <Text style={[styles.detailedTrackingNumber, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
                #{formatShipmentTitle(shipment)}
              </Text>
            </View>
            <StatusPill status={shipment.status} variant="solid" />
          </View>

          {/* Progress Timeline */}
          {showProgress && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressTrack, { backgroundColor: theme.semantic.border || tokens.colors.timelineInactive }]}>
                <View style={[styles.progressStart, { backgroundColor: tokens.colors.timelineDot }]} />
                <View
                  style={[
                    styles.progressBar,
                    { 
                      width: `${progress}%`, 
                      backgroundColor: tokens.colors.timelineActive 
                    },
                  ]}
                />
                <View
                  style={[
                    styles.progressEnd,
                    {
                      backgroundColor: progress === 100 ? tokens.colors.timelineActive : (theme.semantic.surface || tokens.colors.surface),
                      borderColor: tokens.colors.timelineDot,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Location Info Grid */}
          <View style={styles.infoGrid}>
            <View style={styles.infoColumn}>
              <Text style={[styles.infoLabel, { color: theme.semantic.textMuted || tokens.colors.textSecondary }]}>
                From
              </Text>
              <Text style={[styles.infoValue, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
                {originInfo?.location || 'N/A'}
              </Text>
              <Text style={[styles.infoMeta, { color: theme.semantic.textMuted || tokens.colors.textSecondary }]}>
                {originInfo?.date.split(',')[0] || 'N/A'}
              </Text>
            </View>

            <View style={styles.infoColumn}>
              <Text style={[styles.infoLabel, { color: theme.semantic.textMuted || tokens.colors.textSecondary }]}>
                To
              </Text>
              <Text style={[styles.infoValue, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
                {destinationInfo?.location || 'N/A'}
              </Text>
              <Text style={[styles.infoMeta, { color: theme.semantic.textMuted || tokens.colors.textSecondary }]}>
                {destinationInfo?.date.split(',')[0] || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoColumn}>
              <Text style={[styles.infoLabel, { color: theme.semantic.textMuted || tokens.colors.textSecondary }]}>
                Created
              </Text>
              <Text style={[styles.infoValue, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
                {originInfo?.date || 'N/A'}
              </Text>
            </View>
          </View>

          {/* Sender and Receiver info from API */}
          {(shipment.senderName || shipment.receiverName) && (
            <View style={styles.infoGrid}>
              <View style={styles.infoColumn}>
                <Text style={[styles.infoLabel, { color: theme.semantic.textMuted || tokens.colors.textSecondary }]}>
                  Sender
                </Text>
                <Text style={[styles.infoValue, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
                  {shipment.senderName || 'N/A'}
                </Text>
                {shipment.senderPhone && (
                  <Text style={[styles.infoMeta, { color: theme.semantic.textMuted || tokens.colors.textSecondary }]}>
                    {shipment.senderPhone}
                  </Text>
                )}
              </View>

              <View style={styles.infoColumn}>
                <Text style={[styles.infoLabel, { color: theme.semantic.textMuted || tokens.colors.textSecondary }]}>
                  Receiver
                </Text>
                <Text style={[styles.infoValue, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
                  {shipment.receiverName || 'N/A'}
                </Text>
                {shipment.receiverPhone && (
                  <Text style={[styles.infoMeta, { color: theme.semantic.textMuted || tokens.colors.textSecondary }]}>
                    {shipment.receiverPhone}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* 3D Package Illustration */}
        <View style={styles.packageIllustration}>
          <View style={styles.packageBox}>
            <View style={styles.packageTop} />
            <View style={styles.packageFront} />
            <View style={styles.packageSide} />
            {/* Shipping label detail */}
            <View style={styles.shippingLabel}>
              <View style={[styles.labelLine, { backgroundColor: tokens.colors.textPrimary }]} />
              <View style={[styles.labelLine, { backgroundColor: tokens.colors.textPrimary }]} />
              <View style={[styles.labelLine, { backgroundColor: tokens.colors.textPrimary }]} />
            </View>
            {/* Tape arrow */}
            <View style={styles.tapeArrow}>
              <Text style={styles.arrowText}>↑</Text>
            </View>
          </View>
        </View>

        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </Pressable>
    );
  }

  // Default variant (for list view)
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => {
        const resolvedExternalStyle =
          typeof externalStyle === 'function' ? externalStyle({ pressed }) : externalStyle;

        return [
          styles.container,
          {
            backgroundColor: theme.semantic.surface || tokens.colors.surface,
            opacity: pressed ? 0.95 : 1,
          },
          resolvedExternalStyle,
        ];
      }}
      {...pressableProps}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleColumn}>
          <Text style={[styles.title, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
            #{formatShipmentTitle(shipment)}
          </Text>
          <Text style={[styles.subtitle, { color: theme.semantic.textMuted || tokens.colors.textSecondary }]}>
            {formatShipmentSubtitle(shipment)}
          </Text>
        </View>
        <StatusPill status={shipment.status} variant="solid" />
      </View>
      
      {showProgress && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, { backgroundColor: theme.semantic.border || tokens.colors.timelineInactive }]}>
            <View style={[styles.progressStart, { backgroundColor: tokens.colors.timelineDot }]} />
            <View
              style={[
                styles.progressBar,
                { 
                  width: `${progress}%`, 
                  backgroundColor: tokens.colors.timelineActive 
                },
              ]}
            />
            <View
              style={[
                styles.progressEnd,
                {
                  backgroundColor: progress === 100 ? tokens.colors.timelineActive : (theme.semantic.surface || tokens.colors.surface),
                  borderColor: tokens.colors.timelineDot,
                },
              ]}
            />
          </View>
        </View>
      )}

      {latestUpdate ? (
        <View style={styles.updateWrapper}>
          <Text style={[styles.updateLabel, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
            {latestUpdate.label}
          </Text>
          <Text style={[styles.updateMeta, { color: theme.semantic.textMuted || tokens.colors.textSecondary }]}>
            {latestUpdate.location ? `${latestUpdate.location} · ` : ''}{formatAbsoluteTime(latestUpdate.timeIso)}
          </Text>
        </View>
      ) : null}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </Pressable>
  );
};

export const ShipmentCard = React.memo(ShipmentCardComponent);

const styles = StyleSheet.create({
  // Default variant styles
  container: {
    borderRadius: tokens.radii.card,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.md,
    ...tokens.shadows.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: tokens.spacing.sm,
    alignItems: 'flex-start',
  },
  titleColumn: {
    flex: 1,
    gap: tokens.spacing.xxs,
  },
  title: {
    ...tokens.typography.h4,
  },
  subtitle: {
    ...tokens.typography.small,
  },
  progressContainer: {
    paddingHorizontal: tokens.spacing.xxs + 2,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    position: 'relative',
    overflow: 'visible',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    borderRadius: 2,
  },
  progressStart: {
    position: 'absolute',
    left: -6,
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressEnd: {
    position: 'absolute',
    right: -6,
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  updateWrapper: {
    gap: tokens.spacing.xxs,
    paddingVertical: tokens.spacing.xxs,
  },
  updateLabel: {
    ...tokens.typography.bodyMedium,
  },
  updateMeta: {
    ...tokens.typography.caption,
  },
  footer: {
    marginTop: tokens.spacing.xxs,
  },

  // Detailed variant styles
  detailedContainer: {
    borderRadius: tokens.radii.card,
    overflow: 'visible',
    ...tokens.shadows.md,
  },
  detailedContent: {
    padding: tokens.spacing.lg,
    paddingRight: 140, // Add space for package illustration
    gap: tokens.spacing.md,
  },
  detailedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: tokens.spacing.sm,
  },
  detailedLabel: {
    ...tokens.typography.caption,
    marginBottom: tokens.spacing.xxs,
  },
  detailedTrackingNumber: {
    ...tokens.typography.trackingNumber,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: tokens.spacing.xl,
  },
  infoColumn: {
    flex: 1,
    gap: tokens.spacing.xxs,
  },
  infoLabel: {
    ...tokens.typography.caption,
  },
  infoValue: {
    ...tokens.typography.smallSemibold,
  },
  infoMeta: {
    ...tokens.typography.caption,
  },

  // Package illustration
  packageIllustration: {
    position: 'absolute',
    right: tokens.spacing.lg,
    bottom: tokens.spacing.lg,
    width: 120,
    height: 120,
  },
  packageBox: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  packageTop: {
    position: 'absolute',
    top: 0,
    right: 15,
    width: 60,
    height: 40,
    backgroundColor: tokens.colors.packageLight,
    borderRadius: tokens.spacing.xxs,
    transform: [{ skewY: '-20deg' }],
  },
  packageFront: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 70,
    height: 70,
    backgroundColor: tokens.colors.packageOrange,
    borderRadius: tokens.spacing.xxs,
  },
  packageSide: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 50,
    height: 70,
    backgroundColor: tokens.colors.packageDark,
    borderRadius: tokens.spacing.xxs,
    transform: [{ skewY: '20deg' }],
  },
  shippingLabel: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    width: 30,
    height: 30,
    backgroundColor: tokens.colors.surface,
    borderRadius: 2,
    padding: 4,
    gap: 2,
    justifyContent: 'center',
  },
  labelLine: {
    height: 1.5,
    borderRadius: 1,
  },
  tapeArrow: {
    position: 'absolute',
    bottom: 50,
    right: 10,
    width: 24,
    height: 24,
    backgroundColor: tokens.colors.packageDark,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: tokens.colors.surface,
  },
});