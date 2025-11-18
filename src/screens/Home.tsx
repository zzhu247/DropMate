import React, { useMemo, useState, useRef, useEffect } from 'react';
import { 
  Animated,
  Image, 
  Pressable, 
  RefreshControl, 
  ScrollView, 
  StyleSheet, 
  Text, 
  View 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Package, Eye, EyeOff, Truck, Clock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Shipment } from '@/types';
import { useShipmentsListQuery } from '@/hooks/useShipmentsQuery';
import { useUserProfileQuery } from '@/hooks/useUserQuery';
import { CourierCard } from '@/components/CourierCard';
import { SearchBar } from '@/components/SearchBar';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/theme/ThemeProvider';
import { tokens } from '@/theme/tokens';
import { ROUTES, TABS } from '@/constants/routes';
import { RootStackParamList } from '@/navigation/types';
import { t } from '@/i18n/i18n';
import { extractCity } from '@/utils/addressParser';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [balanceVisible, setBalanceVisible] = useState(true);

  const { data: userData } = useUserProfileQuery();
  const { data, isLoading, refetch, isRefetching } = useShipmentsListQuery({
    query: searchQuery,
  });

  const currentShipments = useMemo(() => {
    if (!data) return [];
    // Show 3 most recent packages (excluding delivered)
    return data
      .filter(s => s.status !== 'DELIVERED')
      .slice(0, 3);
  }, [data]);

  const totalActiveShipments = useMemo(() => {
    if (!data) return 0;
    return data.filter(s => s.status !== 'DELIVERED').length;
  }, [data]);

  /* -------------------------------- ANIMATIONS -------------------------------- */

  const fadeHeader = useRef(new Animated.Value(0)).current;
  const fadeBalance = useRef(new Animated.Value(0)).current;
  const fadeActions = useRef(new Animated.Value(0)).current;
  const fadeTrackingSection = useRef(new Animated.Value(0)).current;

  const cardAnimatedValues = useRef<Animated.Value[]>([]).current;

  useEffect(() => {
    // Sequence to make items appear in order
    Animated.stagger(120, [
      Animated.timing(fadeHeader, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(fadeBalance, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(fadeActions, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(fadeTrackingSection, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const animateCard = (index: number) => {
    if (!cardAnimatedValues[index]) {
      cardAnimatedValues[index] = new Animated.Value(0);
    }

    Animated.timing(cardAnimatedValues[index], {
      toValue: 1,
      duration: 280,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  };

  const handleAddTracking = () => {
    navigation.navigate(ROUTES.AddTracking);
  };

  /* -------------------------------- HELPERS -------------------------------- */

  const getDisplayName = () => {
    if (!userData) return 'Guest';
    // Use customer_name or driver_name based on role, fallback to email
    return userData.customer_name || userData.driver_name || userData.email.split('@')[0];
  };

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

  const getVariant = (status: string): 'green' | 'yellow' | 'blue' | 'red' => {
    switch (status) {
      case 'OUT_FOR_DELIVERY':
        return 'yellow';
      case 'EXCEPTION':
        return 'red';
      case 'DELIVERED':
        return 'green';
      default:
        return 'blue';
    }
  };

  /* -------------------------------- UI -------------------------------- */

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.semantic.background || tokens.colors.primaryBeige }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isRefetching} 
            onRefresh={() => refetch()}
            tintColor={theme.semantic.text}
          />
        }
      >

        {/* Header Animation */}
        <Animated.View style={{ opacity: fadeHeader, transform: [{ translateY: fadeHeader.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
          <View style={styles.header}>
            <View style={styles.profileSection}>
              <Pressable onPress={() => navigation.navigate(ROUTES.Profile)}>
                <View style={styles.profileImage}>
                  <Package color={tokens.colors.surface} size={24} />
                </View>
              </Pressable>

              <View style={styles.profileInfo}>
                <Text style={[styles.userName, { color: theme.semantic.text }]}>{getDisplayName()}</Text>
              </View>
            </View>

            <Pressable style={styles.notificationButton}>
              <Bell color={theme.semantic.text} size={24} />
              <View style={styles.notificationBadge} />
            </Pressable>
          </View>
        </Animated.View>


        {/* Balance Card Animation */}
        <Animated.View style={{ opacity: fadeBalance, transform: [{ translateY: fadeBalance.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>
          <View style={styles.balanceCard}>
            <View style={styles.balanceInfo}>
              <Text style={[styles.balanceLabel, { color: theme.semantic.textMuted }]}>Your balance</Text>
              <View style={styles.balanceRow}>
                <Text style={[styles.balanceAmount, { color: theme.semantic.text }]}>{balanceVisible ? '$244.00' : '••••'}</Text>
                <Pressable onPress={() => setBalanceVisible(!balanceVisible)}>
                  {balanceVisible ? (
                    <Eye size={20} color={theme.semantic.textMuted} />
                  ) : (
                    <EyeOff size={20} color={theme.semantic.textMuted} />
                  )}
                </Pressable>
              </View>
            </View>
            <Pressable style={[styles.topUpButton, { backgroundColor: theme.semantic.surface }]}>
              <Text style={[styles.topUpText, { color: theme.semantic.text }]}>Top up</Text>
            </Pressable>
          </View>
        </Animated.View>


        {/* Buttons Animation */}
        <Animated.View style={{ opacity: fadeActions, transform: [{ translateY: fadeActions.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>
          <View style={styles.actionButtons}>
            <Pressable 
              style={[styles.actionButton, { backgroundColor: theme.semantic.surface }]}
              onPress={() => navigation.navigate(ROUTES.PlaceOrder)}
            >
              <Truck size={20} color={theme.semantic.text} strokeWidth={2.5} />
              <Text style={[styles.actionButtonText, { color: theme.semantic.text }]}>Order us</Text>
            </Pressable>
            
            <Pressable 
              style={[styles.actionButton, { backgroundColor: theme.semantic.surface }]}
              onPress={() => navigation.navigate(ROUTES.Main, { screen: TABS.Track })}
            >
              <Clock size={20} color={theme.semantic.text} strokeWidth={2.5} />
              <Text style={[styles.actionButtonText, { color: theme.semantic.text }]}>History</Text>
            </Pressable>
          </View>
        </Animated.View>


        {/* Tracking Section / Courier Cards */}
        <Animated.View style={{ opacity: fadeTrackingSection }}>
          <View style={[styles.trackingSection, { backgroundColor: theme.semantic.surface }]}>
            <View style={styles.searchBarWrapper}>
              <SearchBar placeholder="Search" value={searchQuery} onChangeText={setSearchQuery} style={styles.searchBarInCard} />
            </View>

            <Text style={[styles.sectionTitle, { color: theme.semantic.text }]}>Current tracking</Text>

            {isLoading && !data ? (
              <>
                {[1, 2].map((i) => (
                  <View key={i} style={styles.skeletonCard}>
                    <Skeleton height={24} width="40%" variant="rounded" />
                    <Skeleton height={20} width="60%" style={{ marginTop: 12 }} />
                    <Skeleton height={4} width="100%" style={{ marginTop: 20 }} />
                  </View>
                ))}
              </>
            ) : currentShipments.length > 0 ? (
              <>
                {currentShipments.map((shipment, index) => {
                  animateCard(index);
                  const fade = cardAnimatedValues[index] || new Animated.Value(0);
                  const translateY = fade.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

                  const loc = getShipmentLocations(shipment);
                  const firstCP = shipment.checkpoints[0];
                  const lastCP = shipment.checkpoints[shipment.checkpoints.length - 1];
                  const variant = getVariant(shipment.status);

                  return (
                    <Animated.View key={shipment.id} style={{ opacity: fade, transform: [{ translateY }] }}>
                      <CourierCard
                        trackingNumber={shipment.trackingNo}
                        status={shipment.status}
                        origin={loc.origin}
                        destination={loc.destination}
                        originDate={firstCP ? formatDate(firstCP.timeIso) : 'N/A'}
                        destinationDate={lastCP ? formatDate(lastCP.timeIso) : 'N/A'}
                        senderName={shipment.senderName}
                        receiverName={shipment.receiverName}
                        progress={getProgress(shipment)}
                        variant={variant}
                        onPress={() => navigation.navigate(ROUTES.ShipmentDetails, { shipmentId: shipment.id })}
                      />
                    </Animated.View>
                  );
                })}

                {totalActiveShipments > 3 && (
                  <Pressable
                    style={styles.viewMoreButton}
                    onPress={() => navigation.navigate(ROUTES.Main, { screen: TABS.Track })}
                  >
                    <Text style={[styles.viewMoreText, { color: theme.semantic.text }]}>
                      View More ({totalActiveShipments - 3} more)
                    </Text>
                  </Pressable>
                )}
              </>
            ) : (
              <Animated.View style={{ opacity: fadeTrackingSection }}>
                <EmptyState
                  title={t('home.emptyTitle')}
                  description={t('home.emptyBody')}
                  actionLabel={t('home.emptyAction')}
                  onActionPress={handleAddTracking}
                />
              </Animated.View>
            )}
          </View>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
};


/* -------------------------------- STYLES -------------------------------- */

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: tokens.spacing.xxxl },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.lg,
    paddingBottom: tokens.spacing.md,
  },
  profileSection: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  profileImage: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: tokens.colors.textPrimary,
    alignItems: 'center', justifyContent: 'center', marginRight: tokens.spacing.sm,
  },
  profileInfo: { justifyContent: 'center', flex: 1 },
  userName: { ...tokens.typography.h4 },

  notificationButton: { position: 'relative', padding: tokens.spacing.xs },
  notificationBadge: {
    position: 'absolute', top: tokens.spacing.xs, right: tokens.spacing.xs,
    width: 8, height: 8, borderRadius: 4, backgroundColor: tokens.colors.error
  },

  balanceCard: {
    marginHorizontal: tokens.spacing.lg,
    marginTop: tokens.spacing.xs,
    marginBottom: tokens.spacing.sm,
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  balanceInfo: { flex: 1 },
  balanceLabel: { ...tokens.typography.caption, marginBottom: tokens.spacing.xxs },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs },
  balanceAmount: { ...tokens.typography.h2 },

  topUpButton: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radii.pill,
    ...tokens.shadows.sm,
  },
  topUpText: { ...tokens.typography.button },

  actionButtons: {
    flexDirection: 'row', marginHorizontal: tokens.spacing.lg,
    marginTop: tokens.spacing.md, gap: tokens.spacing.sm,
  },
  actionButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: tokens.spacing.md, borderRadius: tokens.radii.input,
    gap: tokens.spacing.xs, ...tokens.shadows.sm,
  },
  actionButtonText: { ...tokens.typography.button },

  trackingSection: {
    marginTop: tokens.spacing.md,
    marginHorizontal: tokens.spacing.lg,
    padding: tokens.spacing.md,
    borderRadius: tokens.radii.card,
    gap: tokens.spacing.sm,
    ...tokens.shadows.sm,
  },
  searchBarWrapper: { marginBottom: 0 },
  searchBarInCard: { backgroundColor: tokens.colors.background, shadowOpacity: 0 },

  sectionTitle: { ...tokens.typography.h4, marginTop: tokens.spacing.xs, marginBottom: tokens.spacing.xxs },

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
  viewMoreText: { ...tokens.typography.bodyMedium },
});
