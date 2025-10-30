import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MapPin } from 'lucide-react-native';

import { useShipmentQuery, useShipmentRouteQuery } from '@/hooks/useShipmentsQuery';
import { useTheme } from '@/theme/ThemeProvider';
import { Timeline } from '@/components/Timeline';
import { StatusPill } from '@/components/StatusPill';
import { CourierCard } from '@/components/CourierCard';
import { MapViewWrapper } from '@/components/MapViewWrapper';
import { PlaceholderCard } from '@/components/PlaceholderCard';
import { formatAbsoluteTime, formatShipmentTitle } from '@/utils/format';
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

  const latestCheckpoint = useMemo(() => {
    if (!shipment) {
      return undefined;
    }
    return shipment.checkpoints[shipment.checkpoints.length - 1];
  }, [shipment]);

  if (!shipment) {
    return (
      <SafeAreaView
        style={[styles.loading, { backgroundColor: theme.semantic.background }]}
        edges={['top', 'left', 'right']}
      >
        <Text style={{ color: theme.semantic.text }}>Loading shipment…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.semantic.background }]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
      <Pressable onPress={() => navigation.goBack()} style={styles.backButton} accessibilityRole="button">
        <Text style={[styles.backLabel, { color: theme.colors.accent }]}>Back</Text>
      </Pressable>
      <Text style={[styles.title, { color: theme.semantic.text }]}>{formatShipmentTitle(shipment)}</Text>
      <StatusPill status={shipment.status} />
      <CourierCard
        status={shipment.status}
        etaIso={shipment.etaIso}
        location={latestCheckpoint?.location}
        updatedIso={shipment.lastUpdatedIso}
      />
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.semantic.text }]}>Timeline</Text>
        <Timeline checkpoints={shipment.checkpoints} activeStatus={shipment.status} />
      </View>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.semantic.text }]}>Map</Text>
        <View style={styles.mapWrapper}>
          {FEATURE_FLAGS.mapsEnabled ? (
            <MapViewWrapper routeCoordinates={routeData?.coordinates} />
          ) : (
            <PlaceholderCard
              title="Map preview coming soon"
              description="We’ll surface the courier route here once live tracking is enabled."
              Icon={MapPin}
            />
          )}
        </View>
        {latestCheckpoint?.location ? (
          <View style={styles.metaRow}>
            <MapPin color={theme.semantic.textMuted} size={16} />
            <Text style={[styles.metaText, { color: theme.semantic.textMuted }]}>
              {latestCheckpoint.location} · {formatAbsoluteTime(latestCheckpoint.timeIso)}
            </Text>
          </View>
        ) : null}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 24,
    paddingBottom: 48,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  mapWrapper: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
