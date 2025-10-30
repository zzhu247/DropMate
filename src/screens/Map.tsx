import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MapPin, Package } from 'lucide-react-native';

import { MapViewWrapper } from '@/components/MapViewWrapper';
import { CourierCard } from '@/components/CourierCard';
import { SearchBar } from '@/components/SearchBar';
import { ShipmentCard } from '@/components/ShipmentCard';
import { PlaceholderCard } from '@/components/PlaceholderCard';
import { useShipmentsListQuery, useShipmentRouteQuery } from '@/hooks/useShipmentsQuery';
import { useTheme } from '@/theme/ThemeProvider';
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

  const latestCheckpoint = useMemo(() => {
    if (!selectedShipment || !selectedShipment.checkpoints.length) return undefined;
    return selectedShipment.checkpoints[selectedShipment.checkpoints.length - 1];
  }, [selectedShipment]);

  // User mode markers (courier + destination)
  const markers = useMemo(() => {
    if (!routeData?.coordinates || routeData.coordinates.length === 0) {
      return [];
    }

    const first = routeData.coordinates[0];
    const last = routeData.coordinates[routeData.coordinates.length - 1];

    return [
      {
        id: 'courier',
        coordinate: first,
        title: 'Courier',
        description: 'Current position',
        pinColor: theme.colors.primaryTeal,
      },
      {
        id: 'destination',
        coordinate: last,
        title: 'Destination',
        description: 'Delivery address',
        pinColor: theme.colors.accent,
      },
    ];
  }, [routeData, theme.colors]);

  const handleOpenDetails = useCallback((shipmentId: string) => {
    navigation.navigate(ROUTES.ShipmentDetails, { shipmentId });
  }, [navigation]);

  const renderShipment = useCallback(({ item }: { item: Shipment }) => (
    <Pressable
      onPress={() => setSelectedId(item.id)}
      style={({ pressed }) => [
        styles.shipmentChip,
        {
          borderColor: item.id === selectedId ? theme.colors.primaryTeal : theme.semantic.border,
          backgroundColor:
            item.id === selectedId ? `${theme.colors.primaryTeal}20` : theme.semantic.surface,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <Text style={{ color: theme.semantic.text, fontWeight: '500' }}>{formatShipmentTitle(item)}</Text>
      <Text style={{ color: theme.semantic.textMuted, fontSize: 12 }}>{item.status}</Text>
    </Pressable>
  ), [selectedId, theme.colors, theme.semantic]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.semantic.background }]}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.mapContainer}>
        {FEATURE_FLAGS.mapsEnabled ? (
          <MapViewWrapper routeCoordinates={routeData?.coordinates} markers={markers} />
        ) : (
          <View style={styles.placeholderWrapper}>
            <PlaceholderCard
              title="Live map coming soon"
              description="We're finishing the integration. You'll see courier locations and ETAs here once it's ready."
              Icon={MapPin}
            />
          </View>
        )}
      </View>

      {/* User Mode View */}
      <View style={[styles.bottomSheet, { backgroundColor: theme.semantic.surface }]}>
        <View style={styles.userModeToggle}>
          <View style={styles.headerLeft}>
            <Package color={theme.colors.primaryTeal} size={20} />
            <Text style={[styles.headerTitle, { color: theme.semantic.text }]}>
              Track Package
            </Text>
          </View>
          <View style={styles.toggleContainer}>
            <Text style={[styles.modeLabel, { color: theme.semantic.textMuted }]}>Driver Mode</Text>
            <Switch
              value={isDriverMode}
              onValueChange={setDriverMode}
              trackColor={{ false: theme.semantic.border, true: theme.colors.primaryTeal }}
            />
          </View>
        </View>

        {isDriverMode ? (
          /* Driver Mode Content */
          <View style={styles.driverContent}>
            <Text style={[styles.driverMessage, { color: theme.semantic.text }]}>
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
                        backgroundColor: theme.semantic.surface,
                        borderColor: theme.semantic.border,
                      }]}
                      onPress={() => handleOpenDetails(shipment.id)}
                    >
                      <View style={styles.deliveryCardHeader}>
                        <Text style={[styles.deliveryTitle, { color: theme.semantic.text }]}>
                          {formatShipmentTitle(shipment)}
                        </Text>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: shipment.status === 'OUT_FOR_DELIVERY' ? `${theme.colors.error}20` : `${theme.colors.accent}20` }
                        ]}>
                          <Text style={[
                            styles.statusText,
                            { color: shipment.status === 'OUT_FOR_DELIVERY' ? theme.colors.error : theme.colors.accent }
                          ]}>
                            {shipment.status === 'OUT_FOR_DELIVERY' ? 'URGENT' : 'ACTIVE'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.deliveryLocation, { color: theme.semantic.textMuted }]}>
                        {shipment.checkpoints[shipment.checkpoints.length - 1]?.location || 'Unknown location'}
                      </Text>
                    </Pressable>
                  ))
              ) : (
                <View style={styles.emptyDriver}>
                  <Package size={48} color={theme.semantic.textMuted} />
                  <Text style={[styles.emptyText, { color: theme.semantic.textMuted }]}>
                    No active deliveries
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        ) : (
          /* User Mode Content */
          <>
            <CourierCard
              status={selectedShipment?.status ?? 'IN_TRANSIT'}
              etaIso={selectedShipment?.etaIso}
              location={latestCheckpoint?.location}
              updatedIso={selectedShipment?.lastUpdatedIso}
              onPress={() => selectedShipment && handleOpenDetails(selectedShipment.id)}
            />
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Search deliveries"
              style={styles.searchBar}
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
              <ShipmentCard
                shipment={selectedShipment}
                compactTimeline
                onPress={() => handleOpenDetails(selectedShipment.id)}
              />
            )}
          </>
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
    padding: 24,
  },
  bottomSheet: {
    padding: 16,
    gap: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  userModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  searchBar: {
    marginTop: 8,
  },
  shipmentList: {
    gap: 12,
  },
  shipmentChip: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 160,
    gap: 4,
  },
  // Driver Mode Styles
  driverContent: {
    flex: 1,
    gap: 12,
  },
  driverMessage: {
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 8,
  },
  driverList: {
    flex: 1,
  },
  deliveryCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  deliveryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deliveryLocation: {
    fontSize: 14,
  },
  emptyDriver: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
