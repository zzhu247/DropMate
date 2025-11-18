import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  ListRenderItem,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
import { extractCity } from '@/utils/addressParser';

/* ----------------------------- FILTERS ----------------------------- */

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
  const [refreshing, setRefreshing] = useState(false);

  const { data, refetch, isLoading } = useShipmentsListQuery({
    query: searchQuery,
    status: statusFilter === 'ALL' ? undefined : (statusFilter as Shipment['status']),
  });

  const shipments = useMemo(() => data ?? [], [data]);

  /* ----------------------------- ANIMATIONS ----------------------------- */

  const fadeSearch = useRef(new Animated.Value(0)).current;
  const fadeChips = useRef(new Animated.Value(0)).current;

  const animatedValues = useRef<Animated.Value[]>([]).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeSearch, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeChips, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const animateCard = (index: number) => {
    if (!animatedValues[index]) {
      animatedValues[index] = new Animated.Value(0);
    }

    Animated.timing(animatedValues[index], {
      toValue: 1,
      duration: 280,
      delay: index * 80, // staggered animation
      useNativeDriver: true,
    }).start();
  };

  /* ----------------------------- HELPERS ----------------------------- */

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
    return {
      origin: shipment.origin ? extractCity(shipment.origin.address) : 'N/A',
      destination: shipment.destination ? extractCity(shipment.destination.address) : 'N/A',
    };
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getVariant = useCallback((status: string): 'green' | 'yellow' | 'blue' | 'red' => {
    switch (status) {
      case 'OUT_FOR_DELIVERY':
        return 'yellow';
      case 'DELIVERED':
        return 'green';
      case 'EXCEPTION':
        return 'red';
      default:
        return 'blue';
    }
  }, []);

  /* ----------------------------- RENDER ITEM ----------------------------- */

  const renderItem = useCallback<ListRenderItem<Shipment>>(
    ({ item, index }) => {
      animateCard(index);

      const fade = animatedValues[index] || new Animated.Value(0);

      const translateY = fade.interpolate({
        inputRange: [0, 1],
        outputRange: [16, 0],
      });

      const locations = getShipmentLocations(item);
      const firstCheckpoint = item.checkpoints[0];
      const lastCheckpoint = item.checkpoints[item.checkpoints.length - 1];
      const variant = getVariant(item.status);

      return (
        <Animated.View
          style={{
            opacity: fade,
            transform: [{ translateY }],
          }}
        >
          <CourierCard
            trackingNumber={item.trackingNo}
            status={item.status}
            origin={locations.origin}
            destination={locations.destination}
            originDate={firstCheckpoint ? formatDate(firstCheckpoint.timeIso) : 'N/A'}
            destinationDate={lastCheckpoint ? formatDate(lastCheckpoint.timeIso) : 'N/A'}
            senderName={item.senderName}
            receiverName={item.receiverName}
            progress={getProgress(item)}
            variant={variant}
            onPress={() =>
              navigation.navigate(ROUTES.ShipmentDetails, { shipmentId: item.id })
            }
          />
        </Animated.View>
      );
    },
    [navigation, getVariant],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  /* ----------------------------- UI ----------------------------- */

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme.semantic.background || tokens.colors.primaryBeige },
      ]}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.container}>
        <Text style={[styles.heading, { color: theme.semantic.text }]}>
          {t('track.title')}
        </Text>

        {/* Search animation */}
        <Animated.View style={{ opacity: fadeSearch }}>
          <SearchBar
            placeholder={t('home.searchPlaceholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => undefined}
          />
        </Animated.View>

        {/* Chips animation */}
        <Animated.View style={{ opacity: fadeChips, transform: [{ translateY: 8 }] }}>
          <FilterChips
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            style={styles.filterChips}
          />
        </Animated.View>

        <FlatList
          data={shipments}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={[
            styles.listContent,
            shipments.length === 0 ? styles.emptyContent : null,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          initialNumToRender={6}
          windowSize={7}
          removeClippedSubviews
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !isLoading ? (
              <Animated.View style={{ opacity: fadeChips }}>
                <EmptyState
                  title={t('home.emptyTitle')}
                  description={t('home.emptyBody')}
                  actionLabel={t('home.emptyAction')}
                  onActionPress={() => navigation.navigate(ROUTES.PlaceOrder)}
                />
              </Animated.View>
            ) : null
          }
        />

        {/* Floating Add Button */}
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.addButton,
            {
              backgroundColor: theme.semantic.text,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
          onPress={() => navigation.navigate(ROUTES.PlaceOrder)}
        >
          <Plus color={tokens.colors.surface} size={24} strokeWidth={2.5} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

/* ----------------------------- STYLES ----------------------------- */

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
    paddingTop: tokens.spacing.xs,
    paddingBottom: 120,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  separator: {
    height: 0,
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
