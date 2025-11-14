import React, { useMemo, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, ChevronDown, Plus, Package, Eye, EyeOff, Truck, Clock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Shipment } from '@/types';
import { useShipmentsListQuery } from '@/hooks/useShipmentsQuery';
import { CourierCard } from '@/components/CourierCard';
import { SearchBar } from '@/components/SearchBar';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/theme/ThemeProvider';
import { tokens } from '@/theme/tokens';
import { ROUTES, TABS } from '@/constants/routes';
import { RootStackParamList } from '@/navigation/types';
import { t } from '@/i18n/i18n';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [balanceVisible, setBalanceVisible] = useState(true);

  const { data, isLoading, refetch, isRefetching } = useShipmentsListQuery({
    query: searchQuery,
  });

  const currentShipments = useMemo(() => {
    if (!data) return [];
    return data.filter(s => s.status === 'IN_TRANSIT' || s.status === 'OUT_FOR_DELIVERY').slice(0, 5);
  }, [data]);

  const totalActiveShipments = useMemo(() => {
    if (!data) return 0;
    return data.filter(s => s.status === 'IN_TRANSIT' || s.status === 'OUT_FOR_DELIVERY').length;
  }, [data]);

  const handleAddTracking = () => {
    navigation.navigate(ROUTES.AddTracking);
  };

  // Calculate mock progress for shipments
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

  // Get first and last checkpoint locations
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

  // Get variant color based on status
  const getVariant = (status: string): 'green' | 'yellow' | 'blue' | 'red' => {
    switch (status) {
      case 'OUT_FOR_DELIVERY':
        return 'blue';
      case 'IN_TRANSIT':
        return 'green';
      case 'EXCEPTION':
        return 'red';
      case 'DELIVERED':
        return 'green';
      default:
        return 'yellow';
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.semantic.background || tokens.colors.primaryBeige }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isRefetching} 
            onRefresh={() => { void refetch(); }}
            tintColor={theme.semantic.text || tokens.colors.textPrimary}
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <Pressable
              onPress={() => navigation.navigate(ROUTES.Profile)}
              accessibilityRole="button"
            >
              <View style={styles.profileImage}>
                <Package color={tokens.colors.surface} size={24} />
              </View>
            </Pressable>
            <View style={styles.profileInfo}>
              <Text style={[styles.userName, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
                Sri Julaekha
              </Text>
              <Pressable style={styles.locationContainer} accessibilityRole="button">
                <Text style={[styles.userLocation, { color: theme.semantic.textMuted || tokens.colors.textSecondary }]}>
                  Jakarta, ID
                </Text>
                <ChevronDown color={theme.semantic.textMuted || tokens.colors.textSecondary} size={14} />
              </Pressable>
            </View>
          </View>
          <Pressable style={styles.notificationButton} accessibilityRole="button">
            <Bell color={theme.semantic.text || tokens.colors.textPrimary} size={24} />
            <View style={styles.notificationBadge} />
          </Pressable>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceInfo}>
            <Text style={[styles.balanceLabel, { color: theme.semantic.textMuted || tokens.colors.textSecondary }]}>
              Your balance
            </Text>
            <View style={styles.balanceRow}>
              <Text style={[styles.balanceAmount, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
                {balanceVisible ? '$244.00' : '••••'}
              </Text>
              <Pressable onPress={() => setBalanceVisible(!balanceVisible)}>
                {balanceVisible ? (
                  <Eye size={20} color={theme.semantic.textMuted || tokens.colors.textTertiary} />
                ) : (
                  <EyeOff size={20} color={theme.semantic.textMuted || tokens.colors.textTertiary} />
                )}
              </Pressable>
            </View>
          </View>
          <Pressable style={[styles.topUpButton, { backgroundColor: theme.semantic.surface || tokens.colors.surface }]}>
            <Text style={[styles.topUpText, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
              Top up
            </Text>
          </Pressable>
        </View>

        {/* Action Buttons - 2 Buttons */}
        <View style={styles.actionButtons}>
          <Pressable 
            style={[styles.actionButton, { backgroundColor: theme.semantic.surface || tokens.colors.surface }]}
            onPress={handleAddTracking}
          >
            <Truck size={20} color={theme.semantic.text || tokens.colors.textPrimary} strokeWidth={2.5} />
            <Text style={[styles.actionButtonText, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
              Order us
            </Text>
          </Pressable>
          
          <Pressable 
            style={[styles.actionButton, { backgroundColor: theme.semantic.surface || tokens.colors.surface }]}
            onPress={() => navigation.navigate(ROUTES.Main, { screen: TABS.Track })}
          >
            <Clock size={20} color={theme.semantic.text || tokens.colors.textPrimary} strokeWidth={2.5} />
            <Text style={[styles.actionButtonText, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
              History
            </Text>
          </Pressable>
        </View>

        {/* Search Bar + Current Tracking Section - Combined Card */}
        <View style={[styles.trackingSection, { backgroundColor: theme.semantic.surface || tokens.colors.surface }]}>
          {/* Search Bar */}
          <View style={styles.searchBarWrapper}>
            <SearchBar
              placeholder="Search"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchBarInCard}
            />
          </View>

          <Text style={[styles.sectionTitle, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
            Current tracking
          </Text>

          {isLoading && !data ? (
            <>
              {[1, 2].map((i) => (
                <View 
                  key={i} 
                  style={styles.skeletonCard}
                >
                  <Skeleton height={24} width="40%" variant="rounded" />
                  <Skeleton height={20} width="60%" style={{ marginTop: 12 }} />
                  <Skeleton height={4} width="100%" style={{ marginTop: 20 }} />
                  <View style={{ flexDirection: 'row', gap: 40, marginTop: 16 }}>
                    <View style={{ flex: 1 }}>
                      <Skeleton height={14} width="60%" />
                      <Skeleton height={12} width="80%" style={{ marginTop: 4 }} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Skeleton height={14} width="60%" />
                      <Skeleton height={12} width="80%" style={{ marginTop: 4 }} />
                    </View>
                  </View>
                </View>
              ))}
            </>
          ) : currentShipments.length > 0 ? (
            <>
              {currentShipments.map((shipment, index) => {
                const locations = getShipmentLocations(shipment);
                const firstCheckpoint = shipment.checkpoints[0];
                const lastCheckpoint = shipment.checkpoints[shipment.checkpoints.length - 1];
                const variant = getVariant(shipment.status);

                return (
                  <CourierCard
                    key={shipment.id}
                    trackingNumber={shipment.trackingNo}
                    status={shipment.status}
                    origin={locations.origin}
                    destination={locations.destination}
                    originDate={firstCheckpoint ? formatDate(firstCheckpoint.timeIso) : 'N/A'}
                    destinationDate={lastCheckpoint ? formatDate(lastCheckpoint.timeIso) : 'N/A'}
                    progress={getProgress(shipment)}
                    variant={variant}
                    onPress={() => navigation.navigate(ROUTES.ShipmentDetails, { shipmentId: shipment.id })}
                  />
                );
              })}
              
              {/* View More Button - Show if there are more than 5 shipments */}
              {totalActiveShipments > 5 && (
                <Pressable
                  style={styles.viewMoreButton}
                  onPress={() => navigation.navigate(ROUTES.Main, { screen: TABS.Track })}
                >
                  <Text style={[styles.viewMoreText, { color: theme.semantic.text || tokens.colors.textPrimary }]}>
                    View More ({totalActiveShipments - 5} more)
                  </Text>
                </Pressable>
              )}
            </>
          ) : (
            <EmptyState
              title={t('home.emptyTitle')}
              description={t('home.emptyBody')}
              actionLabel={t('home.emptyAction')}
              onActionPress={handleAddTracking}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: tokens.spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.lg,
    paddingBottom: tokens.spacing.md,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: tokens.colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.sm,
  },
  profileInfo: {
    justifyContent: 'center',
    flex: 1,
  },
  userName: {
    ...tokens.typography.h4,
    marginBottom: tokens.spacing.xxs,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xxs,
  },
  userLocation: {
    ...tokens.typography.small,
  },
  notificationButton: {
    position: 'relative',
    padding: tokens.spacing.xs,
  },
  notificationBadge: {
    position: 'absolute',
    top: tokens.spacing.xs,
    right: tokens.spacing.xs,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: tokens.colors.error,
  },
  balanceCard: {
    marginHorizontal: tokens.spacing.lg,
    marginTop: tokens.spacing.xs,
    marginBottom: tokens.spacing.sm,
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    ...tokens.typography.caption,
    marginBottom: tokens.spacing.xxs,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  balanceAmount: {
    ...tokens.typography.h2,
  },
  topUpButton: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radii.pill,
    ...tokens.shadows.sm,
  },
  topUpText: {
    ...tokens.typography.button,
  },
  actionButtons: {
    flexDirection: 'row',
    marginHorizontal: tokens.spacing.lg,
    marginTop: tokens.spacing.md,
    gap: tokens.spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.radii.input,
    gap: tokens.spacing.xs,
    ...tokens.shadows.sm,
  },
  actionButtonText: {
    ...tokens.typography.button,
  },
  trackingSection: {
    marginTop: tokens.spacing.md,
    marginHorizontal: tokens.spacing.lg,
    padding: tokens.spacing.md,
    borderRadius: tokens.radii.card,
    gap: tokens.spacing.sm,
    ...tokens.shadows.sm,
  },
  searchBarWrapper: {
    marginBottom: 0,
  },
  searchBarInCard: {
    backgroundColor: tokens.colors.background,
    shadowOpacity: 0,
    elevation: 0,
  },
  sectionTitle: {
    ...tokens.typography.h4,
    marginTop: tokens.spacing.xs,
    marginBottom: tokens.spacing.xxs,
  },
  skeletonCard: {
    padding: tokens.spacing.lg,
    borderRadius: tokens.radii.card,
    backgroundColor: tokens.colors.background,
    marginTop: tokens.spacing.sm,
  },
  viewMoreButton: {
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    alignItems: 'center',
    marginTop: tokens.spacing.xs,
  },
  viewMoreText: {
    ...tokens.typography.bodyMedium,
  },
});