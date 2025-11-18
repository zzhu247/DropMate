import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, MapPin } from 'lucide-react-native';

import { useShipmentQuery, useShipmentRouteQuery } from '@/hooks/useShipmentsQuery';
import { useRouteQuery } from '@/hooks/useRouteQuery';
import { useTheme } from '@/theme/ThemeProvider';
import { tokens } from '@/theme/tokens';
import { Timeline } from '@/components/Timeline';
import { ShipmentCard } from '@/components/ShipmentCard';
import { MapViewSafe } from '@/components/MapViewSafe';
import { PlaceholderCard } from '@/components/PlaceholderCard';
import { formatAbsoluteTime } from '@/utils/format';
import { RootStackParamList } from '@/navigation/types';
import { FEATURE_FLAGS } from '@/constants/featureFlags';

export const ShipmentDetailsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ShipmentDetails'>>();
  const { shipmentId } = route.params;

  const { data: shipment } = useShipmentQuery(shipmentId);
  const { data: routeData } = useShipmentRouteQuery(
    FEATURE_FLAGS.mapsEnabled ? shipmentId : undefined,
  );

  // Fetch Google Directions route for shipment
  const { data: googleRoute, isLoading: isLoadingRoute } = useRouteQuery(
    shipment?.origin,
    shipment?.destination
  );

  const latestCheckpoint = useMemo(() => {
    if (!shipment) {
      return undefined;
    }
    return shipment.checkpoints[shipment.checkpoints.length - 1];
  }, [shipment]);

  // Build complete route: origin → stops → destination
  const routeCoordinates = useMemo(() => {
    if (!shipment) {
      return routeData?.coordinates || [];
    }

    // Priority 1: Google Directions API route (most accurate, follows roads)
    if (googleRoute?.routeCoordinates && googleRoute.routeCoordinates.length > 0) {
      return googleRoute.routeCoordinates;
    }

    // Don't show fallback while Google route is still loading
    // This prevents the flash of straight line before real route appears
    if (isLoadingRoute) {
      return [];
    }

    // Priority 2: Backend API route data (only if Google route failed/unavailable)
    if (routeData?.coordinates && routeData.coordinates.length > 0) {
      return routeData.coordinates;
    }

    // Priority 3: Fallback to straight line between points (only if both APIs failed)
    const coords = [];

    // Start with origin
    if (shipment.origin) {
      coords.push({ lat: shipment.origin.lat, lng: shipment.origin.lng });
    }

    // Add all stops in order
    if (shipment.stops && shipment.stops.length > 0) {
      const sortedStops = [...shipment.stops].sort((a, b) => a.order - b.order);
      sortedStops.forEach((stop) => {
        coords.push({ lat: stop.lat, lng: stop.lng });
      });
    }

    // End with destination
    if (shipment.destination) {
      coords.push({ lat: shipment.destination.lat, lng: shipment.destination.lng });
    }

    return coords;
  }, [shipment, routeData, googleRoute, isLoadingRoute]);

  // Enhanced markers: origin, destination, waypoints, and driver location
  const markers = useMemo(() => {
    const markerList: Array<{
      id: string;
      coordinate: { lat: number; lng: number };
      title?: string;
      description?: string;
      type?: 'origin' | 'destination' | 'driver' | 'waypoint';
      completed?: boolean;
    }> = [];

    if (!shipment) {
      return markerList;
    }

    // Add origin marker
    if (shipment.origin) {
      markerList.push({
        id: 'origin',
        coordinate: { lat: shipment.origin.lat, lng: shipment.origin.lng },
        title: 'Origin',
        description: shipment.origin.address,
        type: 'origin' as const,
      });
    }

    // Add destination marker
    if (shipment.destination) {
      markerList.push({
        id: 'destination',
        coordinate: { lat: shipment.destination.lat, lng: shipment.destination.lng },
        title: 'Destination',
        description: shipment.destination.address,
        type: 'destination' as const,
      });
    }

    // Add waypoint markers (stops)
    if (shipment.stops && shipment.stops.length > 0) {
      shipment.stops.forEach((stop) => {
        markerList.push({
          id: stop.id,
          coordinate: { lat: stop.lat, lng: stop.lng },
          title: `Stop ${stop.order}${stop.completed ? ' (Completed)' : ''}`,
          description: stop.address,
          type: 'waypoint' as const,
          completed: stop.completed,
        });
      });
    }

    // Add driver location marker
    if (shipment.driverLocation) {
      markerList.push({
        id: 'driver',
        coordinate: { lat: shipment.driverLocation.lat, lng: shipment.driverLocation.lng },
        title: 'Driver',
        description: 'Current location',
        type: 'driver' as const,
      });
    }

    return markerList;
  }, [shipment]);

  if (!shipment) {
    return (
      <SafeAreaView
        style={[styles.loading, { backgroundColor: tokens.colors.cardBackgroundYellow }]}
        edges={['top', 'left', 'right']}
      >
        <Text style={{ color: theme.semantic.text || tokens.colors.textPrimary }}>Loading shipment…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: tokens.colors.cardBackgroundYellow }]}
      edges={['top', 'left', 'right']}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: tokens.colors.cardBackgroundYellow }]}>
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
          Details
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Detailed Shipment Card */}
        <View style={styles.cardContainer}>
          <ShipmentCard
            shipment={shipment}
            variant="detailed"
            showProgress={true}
          />
        </View>

        {/* Timeline Card */}
        <View style={[styles.timelineCard, { backgroundColor: theme.semantic.surface || tokens.colors.surface }]}>
          <View style={styles.timelineHeader}>
            <View style={[styles.timelineDot, { backgroundColor: theme.semantic.accent || tokens.colors.accent }]} />
            <Text style={[styles.timelineTitle, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
              {latestCheckpoint?.label || 'Tracking History'}
            </Text>
          </View>
          
          {latestCheckpoint ? (
            <View style={styles.timelineSubtitle}>
              <Text style={[styles.timelineLocation, { color: theme.semantic.textMuted || tokens.colors.textSecondary }]}>
                {latestCheckpoint.location || 'Location'}
              </Text>
              <Text style={[styles.timelineTime, { color: theme.semantic.textMuted || tokens.colors.textSecondary }]}>
                {formatAbsoluteTime(latestCheckpoint.timeIso)}
              </Text>
            </View>
          ) : null}

          {/* Vertical Timeline */}
          <View style={styles.timelineWrapper}>
            <Timeline 
              checkpoints={shipment.checkpoints} 
              activeStatus={shipment.status}
              compact={false}
            />
          </View>
        </View>

        {/* Map Section (if enabled) */}
        {FEATURE_FLAGS.mapsEnabled && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
              Route Map
            </Text>
            <View style={styles.mapWrapper}>
              <MapViewSafe routeCoordinates={routeCoordinates} markers={markers} />
            </View>
            {latestCheckpoint?.location ? (
              <View style={styles.metaRow}>
                <MapPin color={theme.semantic.textMuted || tokens.colors.textSecondary} size={16} />
                <Text style={[styles.metaText, { color: theme.semantic.textMuted || tokens.colors.textSecondary }]}>
                  {latestCheckpoint.location}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Map Placeholder (if disabled) */}
        {!FEATURE_FLAGS.mapsEnabled && (
          <View style={styles.section}>
            <PlaceholderCard
              title="Map preview coming soon"
              description="We'll surface the courier route here once live tracking is enabled."
              Icon={MapPin}
            />
          </View>
        )}
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
    // Removed shadow to blend with background
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
    width: 40, // Same width as back button for centering
  },
  container: {
    flex: 1,
  },
  content: {
    paddingTop: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xxxl,
    paddingHorizontal: tokens.spacing.lg,
    gap: tokens.spacing.lg,
  },
  cardContainer: {
    // No padding here - ShipmentCard handles its own margins
  },
  timelineCard: {
    borderRadius: tokens.radii.card,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.md,
    ...tokens.shadows.md,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineTitle: {
    ...tokens.typography.h4,
  },
  timelineSubtitle: {
    gap: tokens.spacing.xxs,
  },
  timelineLocation: {
    ...tokens.typography.bodyMedium,
  },
  timelineTime: {
    ...tokens.typography.caption,
  },
  timelineWrapper: {
    marginTop: tokens.spacing.sm,
  },
  section: {
    gap: tokens.spacing.md,
  },
  sectionTitle: {
    ...tokens.typography.h4,
  },
  mapWrapper: {
    height: 240,
    borderRadius: tokens.radii.card,
    overflow: 'hidden',
    ...tokens.shadows.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  metaText: {
    ...tokens.typography.small,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});