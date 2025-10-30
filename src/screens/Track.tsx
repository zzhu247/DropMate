import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, ListRenderItem, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { FilterChipOption, FilterChips } from '@/components/FilterChips';
import { SearchBar } from '@/components/SearchBar';
import { ShipmentCard } from '@/components/ShipmentCard';
import { EmptyState } from '@/components/EmptyState';
import { useShipmentsListQuery } from '@/hooks/useShipmentsQuery';
import { useTheme } from '@/theme/ThemeProvider';
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

  const renderItem = useCallback<ListRenderItem<Shipment>>(
    ({ item }) => (
      <ShipmentCard
        shipment={item}
        compactTimeline
        onPress={() => navigation.navigate(ROUTES.ShipmentDetails, { shipmentId: item.id })}
      />
    ),
    [navigation],
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.semantic.background }]}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.container}>
        <Text style={[styles.heading, { color: theme.semantic.text }]}>{t('track.title')}</Text>
        <SearchBar
          placeholder={t('home.searchPlaceholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => undefined}
        />
        <FilterChips options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
        <FlatList
          data={shipments}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, shipments.length === 0 ? styles.emptyContent : null]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          initialNumToRender={6}
          windowSize={7}
          maxToRenderPerBatch={7}
          removeClippedSubviews
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
              backgroundColor: theme.colors.primaryTeal,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
          onPress={() => navigation.navigate(ROUTES.AddTracking)}
        >
          <Text style={styles.addButtonLabel}>{t('shipments.add')}</Text>
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
    padding: 16,
    gap: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: '600',
  },
  listContent: {
    gap: 16,
    paddingBottom: 120,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: '#00000010',
  },
  addButton: {
    position: 'absolute',
    bottom: 32,
    right: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 999,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 4,
  },
  addButtonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
