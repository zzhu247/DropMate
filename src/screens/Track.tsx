import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, ListRenderItem, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Plus } from 'lucide-react-native';

import { FilterChipOption, FilterChips } from '@/components/FilterChips';
import { SearchBar } from '@/components/SearchBar';
import { CourierCard } from '@/components/CourierCard';
import { EmptyState } from '@/components/EmptyState';
import { useShipmentsListQuery } from '@/hooks/useShipmentsQuery';
import { useTheme } from '@/theme/ThemeProvider';
import { tokens } from '@/theme/tokens';
import { Shipment } from '@/types';
import { ROUTES } from '@/constants/routes';
import { RootStackParamList } from '@/navigation/types';
import { t } from '@/i18n/i18n';

const statusOptions: FilterChipOption[] = [
  { label: t('filters.all'), value: 'ALL' },
  { label: 'Out for delivery', value: 'OUT_FOR_DELIVERY' },
  { label: t('filters.inTransit'), value: 'IN_TRANSIT' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Exceptions', value: 'EXCEPTION' },
];

type StatusValue = typeof statusOptions[number]['value'];

export const TrackScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusValue>('ALL');

  const { data, isLoading } = useShipmentsListQuery({
    query: searchQuery,
    status: statusFilter === 'ALL' ? undefined : (statusFilter as Shipment['status']),
  });

  const shipments = useMemo(() => data ?? [], [data]);

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

  const renderItem = useCallback<ListRenderItem<Shipment>>(
    ({ item }) => {
      const locations = getShipmentLocations(item);
      const firstCheckpoint = item.checkpoints[0];
      const lastCheckpoint = item.checkpoints[item.checkpoints.length - 1];
      
      // Use green for delivered, yellow for others
      const variant = item.status === 'DELIVERED' ? 'green' : 'yellow';
      
      return (
        <CourierCard
          trackingNumber={item.trackingNo}
          status={item.status}
          origin={locations.origin}
          destination={locations.destination}
          originDate={firstCheckpoint ? formatDate(firstCheckpoint.timeIso) : 'N/A'}
          destinationDate={lastCheckpoint ? formatDate(lastCheckpoint.timeIso) : 'N/A'}
          progress={getProgress(item)}
          variant={variant}
          onPress={() => navigation.navigate(ROUTES.ShipmentDetails, { shipmentId: item.id })}
        />
      );
    },
    [navigation],
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.semantic.background || tokens.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.container}>
        <Text style={[styles.heading, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
          {t('track.title')}
        </Text>
        
        <SearchBar
          placeholder={t('home.searchPlaceholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => undefined}
        />
        
        <FilterChips 
          options={statusOptions} 
          value={statusFilter} 
          onChange={setStatusFilter}
          style={styles.filterChips}
        />
        
        <FlatList
          data={shipments}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent, 
            shipments.length === 0 ? styles.emptyContent : null
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          initialNumToRender={6}
          windowSize={7}
          maxToRenderPerBatch={7}
          removeClippedSubviews
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !isLoading ? (
              <EmptyState
                title={t('home.emptyTitle')}
                description={t('home.emptyBody')}
                actionLabel={t('home.emptyAction')}
                onActionPress={() => navigation.navigate(ROUTES.AddTracking)}
              />
            ) : null
          }
        />
        
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.addButton,
            {
              backgroundColor: theme.semantic.text || tokens.colors.textPrimary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
          onPress={() => navigation.navigate(ROUTES.AddTracking)}
        >
          <Plus 
            color={tokens.colors.surface} 
            size={24} 
            strokeWidth={2.5}
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.lg,
    gap: tokens.spacing.md,
  },
  heading: {
    ...tokens.typography.h2,
  },
  filterChips: {
    marginTop: tokens.spacing.xxs,
  },
  listContent: {
    paddingBottom: 100,
    paddingTop: tokens.spacing.xs,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  cardWrapper: {
    marginHorizontal: tokens.spacing.lg,
  },
  separator: {
    height: 0, // No separator needed since CourierCard has margins
  },
  addButton: {
    position: 'absolute',
    bottom: tokens.spacing.xxxl - 8,
    right: tokens.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...tokens.shadows.lg,
  },
});