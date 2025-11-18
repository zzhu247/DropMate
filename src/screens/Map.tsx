import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  FlatList,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MapPin, Package } from 'lucide-react-native';

import { MapViewSafe } from '@/components/MapViewSafe';
import { PlaceholderCard } from '@/components/PlaceholderCard';
import {
  useShipmentsListQuery,
  useShipmentRouteQuery,
} from '@/hooks/useShipmentsQuery';
import { useRouteQuery } from '@/hooks/useRouteQuery';
// import { useDriverLocationSimulator } from '@/hooks/useDriverLocationSimulator';
import { useTheme } from '@/theme/ThemeProvider';
import { tokens } from '@/theme/tokens';
import { Shipment } from '@/types';
import { ROUTES } from '@/constants/routes';
import { RootStackParamList } from '@/navigation/types';
import { formatShipmentTitle } from '@/utils/format';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import { useDriver } from '@/stores/useDriver';
import { SearchBar } from '@/components/SearchBar';

export const MapScreen: React.FC = () => {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [search, setSearch] = useState('');
  const isDriverMode = useDriver((state) => state.isDriverMode);
  const setDriverMode = useDriver((state) => state.setDriverMode);

  // useDriverLocationSimulator(false);

  const { data: shipments } = useShipmentsListQuery({ query: search });
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  // ------------------------- Bottom sheet animation -------------------------

  // 0 = collapsed at natural position
  // NEGATIVE = expanded (moves sheet upward)
  const EXPANDED_POSITION = -280;
  const COLLAPSED_POSITION = 0;

  const sheetTranslateY = useRef(new Animated.Value(40)).current;
  const [sheetState, setSheetState] = useState<'collapsed' | 'expanded'>(
    'collapsed',
  );

  // smooth initial slide-up
  useEffect(() => {
    Animated.spring(sheetTranslateY, {
      toValue: COLLAPSED_POSITION,
      useNativeDriver: true,
      friction: 8,
      tension: 60,
    }).start();
  }, [sheetTranslateY]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 5,
      onPanResponderGrant: () => {
        sheetTranslateY.stopAnimation();
        const base =
          sheetState === 'expanded' ? EXPANDED_POSITION : COLLAPSED_POSITION;
        sheetTranslateY.setOffset(base);
        sheetTranslateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        sheetTranslateY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        sheetTranslateY.flattenOffset();
        const { dy, vy } = gestureState;

        const shouldExpand = dy < -60 || vy < -0.5;
        const target = shouldExpand ? EXPANDED_POSITION : COLLAPSED_POSITION;

        setSheetState(shouldExpand ? 'expanded' : 'collapsed');

        Animated.spring(sheetTranslateY, {
          toValue: target,
          useNativeDriver: true,
          friction: 8,
          tension: 60,
        }).start();
      },
    }),
  ).current;

  // ------------------------- Selection + data -------------------------

  useEffect(() => {
    if (!shipments || shipments.length === 0) return;
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

  // Fetch Google Directions route for selected shipment
  const { data: googleRoute, isLoading: isLoadingRoute } = useRouteQuery(
    selectedShipment?.origin,
    selectedShipment?.destination
  );

  const routeCoordinates = useMemo(() => {
    if (!selectedShipment) {
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
    const coords: { lat: number; lng: number }[] = [];

    if (selectedShipment.origin) {
      coords.push({
        lat: selectedShipment.origin.lat,
        lng: selectedShipment.origin.lng,
      });
    }

    if (selectedShipment.stops && selectedShipment.stops.length > 0) {
      const sortedStops = [...selectedShipment.stops].sort(
        (a, b) => a.order - b.order,
      );
      sortedStops.forEach((stop) => {
        coords.push({ lat: stop.lat, lng: stop.lng });
      });
    }

    if (selectedShipment.destination) {
      coords.push({
        lat: selectedShipment.destination.lat,
        lng: selectedShipment.destination.lng,
      });
    }

    return coords;
  }, [selectedShipment, routeData, googleRoute, isLoadingRoute]);

  const latestCheckpoint = useMemo(() => {
    if (!selectedShipment || !selectedShipment.checkpoints.length) {
      return undefined;
    }
    return selectedShipment.checkpoints[selectedShipment.checkpoints.length - 1];
  }, [selectedShipment]);

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

    if (selectedShipment.origin) {
      markerList.push({
        id: 'origin',
        coordinate: {
          lat: selectedShipment.origin.lat,
          lng: selectedShipment.origin.lng,
        },
        title: 'Origin',
        description: selectedShipment.origin.address,
        type: 'origin',
      });
    }

    if (selectedShipment.destination) {
      markerList.push({
        id: 'destination',
        coordinate: {
          lat: selectedShipment.destination.lat,
          lng: selectedShipment.destination.lng,
        },
        title: 'Destination',
        description: selectedShipment.destination.address,
        type: 'destination',
      });
    }

    if (selectedShipment.stops && selectedShipment.stops.length > 0) {
      selectedShipment.stops.forEach((stop) => {
        markerList.push({
          id: stop.id,
          coordinate: { lat: stop.lat, lng: stop.lng },
          title: `Stop ${stop.order}${stop.completed ? ' (Completed)' : ''}`,
          description: stop.address,
          type: 'waypoint',
          completed: stop.completed,
        });
      });
    }

    if (selectedShipment.driverLocation) {
      markerList.push({
        id: 'driver',
        coordinate: {
          lat: selectedShipment.driverLocation.lat,
          lng: selectedShipment.driverLocation.lng,
        },
        title: 'Driver',
        description: 'Current location',
        type: 'driver',
      });
    }

    return markerList;
  }, [selectedShipment]);

  const handleOpenDetails = useCallback(
    (shipmentId: string) => {
      navigation.navigate(ROUTES.ShipmentDetails, { shipmentId });
    },
    [navigation],
  );

  // ------------------------- Helper functions -------------------------

  const getProgress = (shipment: Shipment) => {
    const statusProgress: Record<string, number> = {
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
    if (checkpoints.length === 0)
      return { origin: 'N/A', destination: 'N/A' };

    const first = checkpoints[0];
    const last = checkpoints[checkpoints.length - 1];

    return {
      origin: first.location || 'Origin',
      destination: last.location || 'Destination',
    };
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderShipment = useCallback(
    ({ item }: { item: Shipment }) => (
      <Pressable
        onPress={() => setSelectedId(item.id)}
        style={({ pressed }) => [
          styles.shipmentChip,
          {
            borderColor:
              item.id === selectedId
                ? theme.semantic.text || tokens.colors.textPrimary
                : theme.semantic.border || tokens.colors.border,
            backgroundColor:
              item.id === selectedId
                ? tokens.colors.cardBackgroundYellow
                : theme.semantic.surface || tokens.colors.surface,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.chipTitle,
            { color: theme.semantic.text || tokens.colors.textPrimary },
          ]}
        >
          {formatShipmentTitle(item)}
        </Text>
        <Text
          style={[
            styles.chipStatus,
            {
              color:
                theme.semantic.textMuted || tokens.colors.textSecondary,
            },
          ]}
        >
          {item.status}
        </Text>
      </Pressable>
    ),
    [selectedId, theme.semantic],
  );

  // ------------------------------ Render ------------------------------

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: tokens.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.mapContainer}>
        {FEATURE_FLAGS.mapsEnabled ? (
          <MapViewSafe routeCoordinates={routeCoordinates} markers={markers} />
        ) : (
          <View
            style={[
              styles.placeholderWrapper,
              { backgroundColor: tokens.colors.background },
            ]}
          >
            <PlaceholderCard
              title="Live map coming soon"
              description="We're finishing the integration. You'll see courier locations and ETAs here once it's ready."
              Icon={MapPin}
            />
          </View>
        )}
      </View>

      {/* Draggable Bottom Sheet */}
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            backgroundColor:
              theme.semantic.surface || tokens.colors.surface,
            transform: [{ translateY: sheetTranslateY }],
          },
        ]}
      >
        {/* Header row also acts as drag handle */}
        <View
          style={[
            styles.userModeToggle,
            {
              borderBottomColor:
                theme.semantic.border || tokens.colors.border,
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.headerLeft}>
            <Package
              color={theme.semantic.text || tokens.colors.textPrimary}
              size={20}
              strokeWidth={2}
            />
            <Text
              style={[
                styles.headerTitle,
                { color: theme.semantic.text || tokens.colors.textPrimary },
              ]}
            >
              Track Package
            </Text>
          </View>
          <View style={styles.toggleContainer}>
            <Text
              style={[
                styles.modeLabel,
                {
                  color:
                    theme.semantic.textMuted ||
                    tokens.colors.textSecondary,
                },
              ]}
            >
              Driver Mode
            </Text>
            <Switch
              value={isDriverMode}
              onValueChange={setDriverMode}
              trackColor={{
                false:
                  theme.semantic.border || tokens.colors.border,
                true:
                  theme.semantic.text || tokens.colors.textPrimary,
              }}
              thumbColor={tokens.colors.surface}
            />
          </View>
        </View>

        {isDriverMode ? (
          // ---------------------- Driver Mode ----------------------
          <View style={styles.driverContent}>
            <Text
              style={[
                styles.driverMessage,
                { color: theme.semantic.text || tokens.colors.textPrimary },
              ]}
            >
              Driver mode: View all deliveries
            </Text>
            <ScrollView
              style={styles.driverList}
              showsVerticalScrollIndicator={false}
            >
              {shipments && shipments.length > 0 ? (
                shipments
                  .filter(
                    (s) =>
                      s.status === 'OUT_FOR_DELIVERY' ||
                      s.status === 'IN_TRANSIT',
                  )
                  .map((shipment) => (
                    <Pressable
                      key={shipment.id}
                      style={[
                        styles.deliveryCard,
                        {
                          backgroundColor:
                            theme.semantic.surface ||
                            tokens.colors.surface,
                          borderColor:
                            theme.semantic.border ||
                            tokens.colors.border,
                        },
                      ]}
                      onPress={() => handleOpenDetails(shipment.id)}
                    >
                      <View style={styles.deliveryCardHeader}>
                        <Text
                          style={[
                            styles.deliveryTitle,
                            {
                              color:
                                theme.semantic.text ||
                                tokens.colors.textPrimary,
                            },
                          ]}
                        >
                          #{formatShipmentTitle(shipment)}
                        </Text>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor:
                                shipment.status === 'OUT_FOR_DELIVERY'
                                  ? tokens.colors.statusOutForDelivery
                                  : tokens.colors.statusInTransit,
                            },
                          ]}
                        >
                          <Text style={styles.statusText}>
                            {shipment.status === 'OUT_FOR_DELIVERY'
                              ? 'URGENT'
                              : 'ACTIVE'}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.deliveryLocation,
                          {
                            color:
                              theme.semantic.textMuted ||
                              tokens.colors.textSecondary,
                          },
                        ]}
                      >
                        {shipment.checkpoints[
                          shipment.checkpoints.length - 1
                        ]?.location || 'Unknown location'}
                      </Text>
                    </Pressable>
                  ))
              ) : (
                <View style={styles.emptyDriver}>
                  <Package
                    size={48}
                    color={
                      theme.semantic.textMuted ||
                      tokens.colors.textMuted
                    }
                  />
                  <Text
                    style={[
                      styles.emptyText,
                      {
                        color:
                          theme.semantic.textMuted ||
                          tokens.colors.textSecondary,
                      },
                    ]}
                  >
                    No active deliveries
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        ) : (
          // ---------------------- User Mode ----------------------
          <View style={styles.userModeContent}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Search deliveries"
              style={styles.searchBarInCard}
            />

            <FlatList
              horizontal
              data={shipments}
              contentContainerStyle={styles.shipmentList}
              keyExtractor={(item) => item.id}
              renderItem={renderShipment}
              showsHorizontalScrollIndicator={false}
            />

            {selectedShipment && (
              <View style={styles.selectedShipmentWrapper}>
                {(() => {
                  const locations = getShipmentLocations(selectedShipment);
                  const firstCheckpoint =
                    selectedShipment.checkpoints[0];
                  const lastCheckpoint =
                    selectedShipment.checkpoints[
                      selectedShipment.checkpoints.length - 1
                    ];

                  return (
                    <Pressable
                      onPress={() =>
                        handleOpenDetails(selectedShipment.id)
                      }
                      style={styles.selectedShipmentCard}
                    >
                      <View style={styles.selectedHeader}>
                        <Text
                          style={[
                            styles.selectedTrackingNumber,
                            {
                              color:
                                theme.semantic.text ||
                                tokens.colors.textPrimary,
                            },
                          ]}
                        >
                          #{selectedShipment.trackingNo}
                        </Text>
                        <View
                          style={[
                            styles.selectedStatusBadge,
                            {
                              backgroundColor:
                                tokens.colors.statusInTransit,
                            },
                          ]}
                        >
                          <Text style={styles.selectedStatusText}>
                            {selectedShipment.status === 'IN_TRANSIT'
                              ? 'In Transit'
                              : selectedShipment.status.replace(
                                  '_',
                                  ' ',
                                )}
                          </Text>
                        </View>
                      </View>

                      <Text
                        style={[
                          styles.selectedLocation,
                          {
                            color:
                              theme.semantic.text ||
                              tokens.colors.textPrimary,
                          },
                        ]}
                      >
                        {lastCheckpoint?.label || 'Processing'}
                      </Text>
                      <Text
                        style={[
                          styles.selectedLocationDetail,
                          {
                            color:
                              theme.semantic.textMuted ||
                              tokens.colors.textSecondary,
                          },
                        ]}
                      >
                        {lastCheckpoint?.location || locations.origin} ·{' '}
                        {lastCheckpoint
                          ? formatDate(lastCheckpoint.timeIso)
                          : 'N/A'}
                      </Text>

                      <View style={styles.selectedProgress}>
                        <View
                          style={[
                            styles.progressTrack,
                            {
                              backgroundColor:
                                theme.semantic.border ||
                                tokens.colors.border,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.progressStart,
                              {
                                backgroundColor:
                                  tokens.colors.statusInTransit,
                              },
                            ]}
                          />
                          <View
                            style={[
                              styles.progressBar,
                              {
                                width: `${getProgress(
                                  selectedShipment,
                                )}%`,
                                backgroundColor:
                                  tokens.colors.statusInTransit,
                              },
                            ]}
                          />
                          <View
                            style={[
                              styles.progressEnd,
                              {
                                backgroundColor:
                                  getProgress(selectedShipment) === 100
                                    ? tokens.colors.statusInTransit
                                    : 'transparent',
                                borderColor:
                                  tokens.colors.statusInTransit,
                                borderWidth:
                                  getProgress(selectedShipment) === 100
                                    ? 2
                                    : 2,
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
      </Animated.View>
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
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
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
