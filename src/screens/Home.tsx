import React, { useMemo, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, ChevronDown, ChevronRight, Package, DollarSign, MapPin, Clock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Shipment } from '@/types';
import { useShipmentsListQuery } from '@/hooks/useShipmentsQuery';
import { ShipmentCard } from '@/components/ShipmentCard';
import { SearchBar } from '@/components/SearchBar';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/theme/ThemeProvider';
import { ROUTES, TABS } from '@/constants/routes';
import { RootStackParamList } from '@/navigation/types';
import { t } from '@/i18n/i18n';

type QuickAction = {
  id: string;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
};

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useTheme();

  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, refetch, isRefetching } = useShipmentsListQuery({
    query: searchQuery,
  });

  const currentShipments = useMemo(() => {
    if (!data) return [];
    return data.slice(0, 3); // Max 3 current shipments
  }, [data]);

  const recentShipments = useMemo(() => {
    if (!data) return [];
    return data.slice(3, 8); // Max 5 recent shipments (items 4-8)
  }, [data]);

  const handleAddTracking = () => {
    navigation.navigate(ROUTES.AddTracking);
  };

  const quickActions: QuickAction[] = [
    {
      id: 'check-rate',
      label: 'Check Rate',
      icon: <DollarSign color={theme.colors.primaryTeal} size={28} />,
      onPress: () => {},
    },
    {
      id: 'pick-up',
      label: 'Pick Up',
      icon: <Package color={theme.colors.primaryTeal} size={28} />,
      onPress: () => {},
    },
    {
      id: 'drop-off',
      label: 'Drop Off',
      icon: <MapPin color={theme.colors.primaryTeal} size={28} />,
      onPress: () => {},
    },
    {
      id: 'history',
      label: 'History',
      icon: <Clock color={theme.colors.primaryTeal} size={28} />,
      onPress: () => navigation.navigate(ROUTES.Main, { screen: TABS.Track }),
    },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.primaryTeal }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => { void refetch(); }} tintColor="#FFFFFF" />
        }
      >
        {/* Header Section */}
        <View style={[styles.header, { backgroundColor: theme.colors.primaryTeal }]}>
          <View style={styles.topBar}>
            <Pressable
              style={styles.profileContainer}
              onPress={() => navigation.navigate(ROUTES.Profile)}
              accessibilityRole="button"
            >
              <View style={styles.profilePicture}>
                <Package color="#FFFFFF" size={24} />
              </View>
            </Pressable>
            <Pressable style={styles.locationContainer} accessibilityRole="button">
              <View>
                <Text style={styles.locationTitle}>Your Location</Text>
                <View style={styles.locationRow}>
                  <Text style={styles.locationText}>Select location</Text>
                  <ChevronDown color="#FFFFFF" size={16} />
                </View>
              </View>
            </Pressable>
            <Pressable style={styles.notificationButton} accessibilityRole="button">
              <Bell color="#FFFFFF" size={24} />
            </Pressable>
          </View>

          <Text style={styles.mainHeading}>Let's Track Your Package</Text>

          <SearchBar
            placeholder="Enter your tracking number"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.headerSearchBar}
          />
        </View>

        {/* Quick Actions Section */}
        <View style={[styles.contentSection, { backgroundColor: theme.semantic.background }]}>
          <View style={styles.quickActionsContainer}>
            {quickActions.map((action) => (
              <Pressable
                key={action.id}
                style={({ pressed }) => [
                  styles.quickActionButton,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={action.onPress}
                accessibilityRole="button"
              >
                <View style={[styles.quickActionIcon, { backgroundColor: theme.semantic.surface }]}>
                  {action.icon}
                </View>
                <Text style={[styles.quickActionLabel, { color: theme.semantic.text }]}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Current Shipment Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.semantic.text }]}>Current Shipment</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.navigate(ROUTES.Main, { screen: TABS.Track })}
                style={styles.viewAll}
              >
                <Text style={[styles.viewAllLabel, { color: theme.colors.primaryTeal }]}>View All</Text>
              </Pressable>
            </View>

            {isLoading && !data ? (
              <>
                {[1, 2, 3].map((i) => (
                  <View key={i} style={[styles.skeletonCard, { borderColor: theme.semantic.border }]}>
                    <Skeleton height={20} width="60%" />
                    <Skeleton height={14} width="40%" />
                  </View>
                ))}
              </>
            ) : currentShipments.length > 0 ? (
              currentShipments.map((shipment) => (
                <ShipmentCard
                  key={shipment.id}
                  shipment={shipment}
                  onPress={() => navigation.navigate(ROUTES.ShipmentDetails, { shipmentId: shipment.id })}
                  style={styles.shipmentCard}
                />
              ))
            ) : (
              <EmptyState
                title={t('home.emptyTitle')}
                description={t('home.emptyBody')}
                actionLabel={t('home.emptyAction')}
                onActionPress={handleAddTracking}
              />
            )}
          </View>

          {/* Recent Shipment Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.semantic.text }]}>Recent Shipment</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.navigate(ROUTES.Main, { screen: TABS.Track })}
                style={styles.viewAll}
              >
                <Text style={[styles.viewAllLabel, { color: theme.colors.primaryTeal }]}>View All</Text>
              </Pressable>
            </View>

            {recentShipments.length > 0 ? (
              recentShipments.map((shipment) => (
                <ShipmentCard
                  key={shipment.id}
                  shipment={shipment}
                  onPress={() => navigation.navigate(ROUTES.ShipmentDetails, { shipmentId: shipment.id })}
                  style={styles.shipmentCard}
                />
              ))
            ) : !isLoading && currentShipments.length > 0 ? (
              <Text style={[styles.emptyText, { color: theme.semantic.textMuted }]}>
                No recent shipments
              </Text>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: theme.colors.primaryTeal,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
        onPress={handleAddTracking}
      >
        <Package color="#FFFFFF" size={28} />
      </Pressable>
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
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  profileContainer: {
    width: 48,
  },
  profilePicture: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  locationTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
    textAlign: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainHeading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  headerSearchBar: {
    backgroundColor: '#FFFFFF',
  },
  contentSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    marginTop: -16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  viewAll: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  shipmentCard: {
    marginBottom: 12,
  },
  skeletonCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
});
