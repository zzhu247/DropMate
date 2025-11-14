import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MapPin, Package } from 'lucide-react-native';

import { MapViewSafe } from '@/components/MapViewSafe';
import { CourierCard } from '@/components/CourierCard';
import { SearchBar } from '@/components/SearchBar';
import { ShipmentCard } from '@/components/ShipmentCard';
import { PlaceholderCard } from '@/components/PlaceholderCard';
import { useShipmentsListQuery, useShipmentRouteQuery } from '@/hooks/useShipmentsQuery';
import { useDriverLocationSimulator } from '@/hooks/useDriverLocationSimulator';
import { useTheme } from '@/theme/ThemeProvider';
import { tokens } from '@/theme/tokens';
import { Shipment } from '@/types';
import { ROUTES } from '@/constants/routes';
import { RootStackParamList } from '@/navigation/types';
import { formatShipmentTitle } from '@/utils/format';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import { useDriver } from '@/stores/useDriver';

export const MapScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [search, setSearch] = useState('');
  const isDriverMode = useDriver((state) => state.isDriverMode);
  const setDriverMode = useDriver((state) => state.setDriverMode);

  // Driver location simulator disabled for now
  // Enable when needed: useDriverLocationSimulator(FEATURE_FLAGS.mapsEnabled);
  // useDriverLocationSimulator(false);

  const { data: shipments } = useShipmentsListQuery({ query: search });
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  // Auto-select first shipment
  useEffect(() => {
    if (!shipments || shipments.length === 0) {
      return;
    }
    const preferred = shipments.find((s) => s.status === 'OUT_FOR_DELIVERY');
    setSelectedId((current) => current ?? preferred?.id ?? shipments[0]?.id);
  }, [shipments]);

  const selectedShipment = useMemo(
    () => shipments?.find((s) => s.id === selectedId),
    [selectedId, shipments],
  );

  const { data: routeData } = useShipmentRouteQuery(
    FEATURE_FLAGS.mapsEnabled ? selectedId : undefined,
  );

  // Build complete route: origin → stops → destination
  const routeCoordinates = useMemo(() => {
    if (!selectedShipment) {
      return routeData?.coordinates || [];
    }

    const coords = [];

    // Start with origin
    if (selectedShipment.origin) {
      coords.push({ lat: selectedShipment.origin.lat, lng: selectedShipment.origin.lng });
    }

    // Add all stops in order
    if (selectedShipment.stops && selectedShipment.stops.length > 0) {
      const sortedStops = [...selectedShipment.stops].sort((a, b) => a.order - b.order);
      sortedStops.forEach((stop) => {
        coords.push({ lat: stop.lat, lng: stop.lng });
      });
    }

    // End with destination
    if (selectedShipment.destination) {
      coords.push({ lat: selectedShipment.destination.lat, lng: selectedShipment.destination.lng });
    }

    // If we have the full route data from API, use that instead (more detailed)
    if (routeData?.coordinates && routeData.coordinates.length > 0) {
      return routeData.coordinates;
    }

    return coords;
  }, [selectedShipment, routeData]);

  const latestCheckpoint = useMemo(() => {
    if (!selectedShipment || !selectedShipment.checkpoints.length) return undefined;
    return selectedShipment.checkpoints[selectedShipment.checkpoints.length - 1];
  }, [selectedShipment]);

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

    if (!selectedShipment) {
      return markerList;
    }

    // Add origin marker
    if (selectedShipment.origin) {
      markerList.push({
        id: 'origin',
        coordinate: { lat: selectedShipment.origin.lat, lng: selectedShipment.origin.lng },
        title: 'Origin',
        description: selectedShipment.origin.address,
        type: 'origin' as const,
      });
    }

    // Add destination marker
    if (selectedShipment.destination) {
      markerList.push({
        id: 'destination',
        coordinate: { lat: selectedShipment.destination.lat, lng: selectedShipment.destination.lng },
        title: 'Destination',
        description: selectedShipment.destination.address,
        type: 'destination' as const,
      });
    }

    // Add waypoint markers (stops)
    if (selectedShipment.stops && selectedShipment.stops.length > 0) {
      selectedShipment.stops.forEach((stop) => {
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

    // Add driver location marker (static position from package data)
    if (selectedShipment.driverLocation) {
      markerList.push({
        id: 'driver',
        coordinate: { lat: selectedShipment.driverLocation.lat, lng: selectedShipment.driverLocation.lng },
        title: 'Driver',
        description: 'Current location',
        type: 'driver' as const,
      });
    }

    return markerList;
  }, [selectedShipment]);

  const handleOpenDetails = useCallback((shipmentId: string) => {
    navigation.navigate(ROUTES.ShipmentDetails, { shipmentId });
  }, [navigation]);

  const renderShipment = useCallback(({ item }: { item: Shipment }) => (
    <Pressable
      onPress={() => setSelectedId(item.id)}
      style={({ pressed }) => [
        styles.shipmentChip,
        {
          borderColor: item.id === selectedId 
            ? (theme.semantic.text || tokens.colors.textPrimary)
            : (theme.semantic.border || tokens.colors.border),
          backgroundColor: item.id === selectedId 
            ? tokens.colors.cardBackgroundYellow
            : (theme.semantic.surface || tokens.colors.surface),
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <Text style={[styles.chipTitle, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
        {formatShipmentTitle(item)}
      </Text>
      <Text style={[styles.chipStatus, { color: theme.semantic.textMuted || tokens.colors.textSecondary }]}>
        {item.status}
      </Text>
    </Pressable>
  ), [selectedId, theme.semantic]);

  // Helper functions for CourierCard
  const getProgress = (shipment: Shipment) => {
    const statusProgress = {
      CREATED: 20,
      IN_TRANSIT: 60,
      OUT_FOR_DELIVERY: 80,
      DELIVERED: 100,
      EXCEPTION: 50,
    };
    return statusProgress[shipment.status] || 0;
  };

  const getShipmentLocations = (shipment: Shipment) => {
    const checkpoints = shipment.checkpoints;
    if (checkpoints.length === 0) return { origin: 'N/A', destination: 'N/A' };
    
    const first = checkpoints[0];
    const last = checkpoints[checkpoints.length - 1];
    
    return {
      origin: first.location || 'Origin',
      destination: last.location || 'Destination',
    };
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: tokens.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.mapContainer}>
        {FEATURE_FLAGS.mapsEnabled ? (
          <MapViewSafe routeCoordinates={routeCoordinates} markers={markers} />
        ) : (
          <View style={[styles.placeholderWrapper, { backgroundColor: tokens.colors.background }]}>
            <PlaceholderCard
              title="Live map coming soon"
              description="We're finishing the integration. You'll see courier locations and ETAs here once it's ready."
              Icon={MapPin}
            />
          </View>
        )}
      </View>

      {/* Bottom Sheet */}
      <View style={[styles.bottomSheet, { backgroundColor: theme.semantic.surface || tokens.colors.surface }]}>
        <View style={[styles.userModeToggle, { borderBottomColor: theme.semantic.border || tokens.colors.border }]}>
          <View style={styles.headerLeft}>
            <Package color={theme.semantic.text || tokens.colors.textPrimary} size={20} strokeWidth={2} />
            <Text style={[styles.headerTitle, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
              Track Package
            </Text>
          </View>
          <View style={styles.toggleContainer}>
            <Text style={[styles.modeLabel, { color: theme.semantic.textMuted || tokens.colors.textSecondary }]}>
              Driver Mode
            </Text>
            <Switch
              value={isDriverMode}
              onValueChange={setDriverMode}
              trackColor={{ 
                false: theme.semantic.border || tokens.colors.border, 
                true: theme.semantic.text || tokens.colors.textPrimary 
              }}
              thumbColor={tokens.colors.surface}
            />
          </View>
        </View>

        {isDriverMode ? (
          /* Driver Mode Content */
          <View style={styles.driverContent}>
            <Text style={[styles.driverMessage, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
              Driver mode: View all deliveries
            </Text>
            <ScrollView style={styles.driverList} showsVerticalScrollIndicator={false}>
              {shipments && shipments.length > 0 ? (
                shipments
                  .filter((s) => s.status === 'OUT_FOR_DELIVERY' || s.status === 'IN_TRANSIT')
                  .map((shipment) => (
                    <Pressable
                      key={shipment.id}
                      style={[styles.deliveryCard, {
                        backgroundColor: theme.semantic.surface || tokens.colors.surface,
                        borderColor: theme.semantic.border || tokens.colors.border,
                      }]}
                      onPress={() => handleOpenDetails(shipment.id)}
                    >
                      <View style={styles.deliveryCardHeader}>
                        <Text style={[styles.deliveryTitle, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
                          #{formatShipmentTitle(shipment)}
                        </Text>
                        <View style={[
                          styles.statusBadge,
                          { 
                            backgroundColor: shipment.status === 'OUT_FOR_DELIVERY' 
                              ? tokens.colors.statusOutForDelivery
                              : tokens.colors.statusInTransit
                          }
                        ]}>
                          <Text style={styles.statusText}>
                            {shipment.status === 'OUT_FOR_DELIVERY' ? 'URGENT' : 'ACTIVE'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.deliveryLocation, { color: theme.semantic.textMuted || tokens.colors.textSecondary }]}>
                        {shipment.checkpoints[shipment.checkpoints.length - 1]?.location || 'Unknown location'}
                      </Text>
                    </Pressable>
                  ))
              ) : (
                <View style={styles.emptyDriver}>
                  <Package size={48} color={theme.semantic.textMuted || tokens.colors.textMuted} />
                  <Text style={[styles.emptyText, { color: theme.semantic.textMuted || tokens.colors.textSecondary }]}>
                    No active deliveries
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        ) : (
          /* User Mode Content - All in One Card */
          <View style={styles.userModeContent}>
            {/* Search Bar */}
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Search deliveries"
              style={styles.searchBarInCard}
            />
            
            {/* Horizontal Shipment Chips */}
            <FlatList
              horizontal
              data={shipments}
              contentContainerStyle={styles.shipmentList}
              keyExtractor={(item) => item.id}
              renderItem={renderShipment}
              showsHorizontalScrollIndicator={false}
            />
            
            {/* Selected Shipment Details */}
            {selectedShipment && (
              <View style={styles.selectedShipmentWrapper}>
                {(() => {
                  const locations = getShipmentLocations(selectedShipment);
                  const firstCheckpoint = selectedShipment.checkpoints[0];
                  const lastCheckpoint = selectedShipment.checkpoints[selectedShipment.checkpoints.length - 1];
                  
                  return (
                    <Pressable
                      onPress={() => handleOpenDetails(selectedShipment.id)}
                      style={styles.selectedShipmentCard}
                    >
                      {/* Tracking Number and Status */}
                      <View style={styles.selectedHeader}>
                        <Text style={[styles.selectedTrackingNumber, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
                          #{selectedShipment.trackingNo}
                        </Text>
                        <View style={[
                          styles.selectedStatusBadge,
                          { backgroundColor: tokens.colors.statusInTransit }
                        ]}>
                          <Text style={styles.selectedStatusText}>
                            {selectedShipment.status === 'IN_TRANSIT' ? 'In Transit' : selectedShipment.status.replace('_', ' ')}
                          </Text>
                        </View>
                      </View>

                      {/* Location Info */}
                      <Text style={[styles.selectedLocation, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
                        {lastCheckpoint?.label || 'Processing'}
                      </Text>
                      <Text style={[styles.selectedLocationDetail, { color: theme.semantic.textMuted || tokens.colors.textSecondary }]}>
                        {lastCheckpoint?.location || locations.origin} · {lastCheckpoint ? formatDate(lastCheckpoint.timeIso) : 'N/A'}
                      </Text>

                      {/* Progress Bar */}
                      <View style={styles.selectedProgress}>
                        <View style={[styles.progressTrack, { backgroundColor: theme.semantic.border || tokens.colors.border }]}>
                          <View style={[styles.progressStart, { backgroundColor: tokens.colors.statusInTransit }]} />
                          <View
                            style={[
                              styles.progressBar,
                              { 
                                width: `${getProgress(selectedShipment)}%`, 
                                backgroundColor: tokens.colors.statusInTransit 
                              },
                            ]}
                          />
                          <View
                            style={[
                              styles.progressEnd,
                              {
                                backgroundColor: getProgress(selectedShipment) === 100 ? tokens.colors.statusInTransit : 'transparent',
                                borderColor: tokens.colors.statusInTransit,
                                borderWidth: 2,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    </Pressable>
                  );
                })()}
              </View>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  placeholderWrapper: {
    flex: 1,
    justifyContent: 'center',
    padding: tokens.spacing.xl,
  },
  bottomSheet: {
    padding: tokens.spacing.lg,
    gap: tokens.spacing.md,
    borderTopLeftRadius: tokens.radii.xl,
    borderTopRightRadius: tokens.radii.xl,
    ...tokens.shadows.xl,
  },
  userModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: tokens.spacing.sm,
    marginBottom: tokens.spacing.xs,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  headerTitle: {
    ...tokens.typography.h4,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  modeLabel: {
    ...tokens.typography.captionSemibold,
  },
  
  // User Mode Content - All sections in one card
  userModeContent: {
    gap: tokens.spacing.md,
  },
  searchBarInCard: {
    backgroundColor: '#F5F5F5',
    shadowOpacity: 0,
    elevation: 0,
  },
  shipmentList: {
    gap: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xxs,
  },
  shipmentChip: {
    padding: tokens.spacing.sm,
    borderRadius: tokens.radii.md,
    borderWidth: 2,
    minWidth: 160,
    gap: tokens.spacing.xxs,
  },
  chipTitle: {
    ...tokens.typography.bodyMedium,
  },
  chipStatus: {
    ...tokens.typography.caption,
    textTransform: 'uppercase',
  },
  
  // Selected Shipment Card
  selectedShipmentWrapper: {
    marginTop: tokens.spacing.xs,
  },
  selectedShipmentCard: {
    gap: tokens.spacing.sm,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedTrackingNumber: {
    ...tokens.typography.h3,
  },
  selectedStatusBadge: {
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xxs,
    borderRadius: tokens.radii.pill,
  },
  selectedStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: tokens.colors.surface,
  },
  selectedLocation: {
    ...tokens.typography.bodyMedium,
    marginTop: tokens.spacing.xxs,
  },
  selectedLocationDetail: {
    ...tokens.typography.caption,
  },
  selectedProgress: {
    marginTop: tokens.spacing.sm,
  },
  progressTrack: {
    height: 3,
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
    left: -1,
    top: -3.5,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  progressEnd: {
    position: 'absolute',
    right: -1,
    top: -3.5,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  
  // Driver Mode Styles
  driverContent: {
    flex: 1,
    gap: tokens.spacing.sm,
  },
  driverMessage: {
    ...tokens.typography.smallMedium,
    paddingVertical: tokens.spacing.xs,
  },
  driverList: {
    flex: 1,
  },
  deliveryCard: {
    padding: tokens.spacing.md,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    marginBottom: tokens.spacing.sm,
    gap: tokens.spacing.xs,
    ...tokens.shadows.sm,
  },
  deliveryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.xxs,
  },
  deliveryTitle: {
    ...tokens.typography.h4,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: tokens.spacing.xs,
    paddingVertical: tokens.spacing.xxs,
    borderRadius: tokens.radii.xs,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.surface,
  },
  deliveryLocation: {
    ...tokens.typography.small,
  },
  emptyDriver: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.spacing.xxxl + 20,
    gap: tokens.spacing.sm,
  },
  emptyText: {
    ...tokens.typography.h4,
  },
});