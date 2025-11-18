import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MapView, { Marker, Polyline, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { ActivityIndicator, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { LatLng, getRegionForCoordinates, toMapCoordinates } from '@/utils/map';

export type MapMarkerType = 'origin' | 'destination' | 'driver' | 'waypoint';

export type MapMarker = {
  id: string;
  coordinate: LatLng;
  title?: string;
  description?: string;
  pinColor?: string;
  type?: MapMarkerType;
  completed?: boolean;
};

export type MapViewWrapperProps = {
  routeCoordinates?: LatLng[];
  markers?: MapMarker[];
  style?: StyleProp<ViewStyle>;
  initialRegion?: Region;
  onMapReady?: () => void;
};

/**
 * MapView wrapper component with proper initialization
 * - Uses Google Maps on both iOS and Android
 * - Requires GOOGLE_MAPS_API_KEY in app.json
 */
export const MapViewWrapper: React.FC<MapViewWrapperProps> = ({
  routeCoordinates,
  markers,
  style,
  initialRegion,
  onMapReady,
}) => {
  const [isReady, setIsReady] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const mountedRef = useRef(true);

  // Wait for component to be fully mounted before rendering map
  useEffect(() => {
    mountedRef.current = true;

    // Small delay to ensure native bridge is ready
    const timer = setTimeout(() => {
      if (mountedRef.current) {
        setIsReady(true);
      }
    }, 100);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
    };
  }, []);

  const computedRegion = useMemo(() => {
    if (initialRegion) {
      return initialRegion;
    }

    if (routeCoordinates && routeCoordinates.length > 0) {
      return getRegionForCoordinates(routeCoordinates);
    }

    if (markers && markers.length > 0) {
      const coords = markers.map((marker) => marker.coordinate);
      return getRegionForCoordinates(coords);
    }

    // Default region (centered on US, required to prevent crash)
    return {
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta: 50,
      longitudeDelta: 50,
    };
  }, [initialRegion, markers, routeCoordinates]);

  const handleMapReady = useCallback(() => {
    if (mountedRef.current) {
      setIsMapReady(true);
      onMapReady?.();
    }
  }, [onMapReady]);

  // Helper function to get marker pin color based on type
  const getMarkerColor = useCallback((marker: MapMarker): string => {
    if (marker.pinColor) {
      return marker.pinColor;
    }

    if (marker.completed) {
      return '#9CA3AF'; // Gray for completed stops
    }

    switch (marker.type) {
      case 'origin':
        return '#10B981'; // Green
      case 'destination':
        return '#EF4444'; // Red
      case 'driver':
        return '#3B82F6'; // Blue
      case 'waypoint':
        return '#F59E0B'; // Amber/Orange
      default:
        return '#1497A1'; // Default teal
    }
  }, []);

  // Show loading indicator while initializing
  if (!isReady) {
    return (
      <View style={[styles.map, styles.loadingContainer, style]}>
        <ActivityIndicator size="large" color="#1497A1" />
      </View>
    );
  }

  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={[styles.map, style]}
      initialRegion={computedRegion}
      onMapReady={handleMapReady}
      loadingEnabled={true}
      loadingIndicatorColor="#1497A1"
      loadingBackgroundColor="#F6F7F9"
    >
      {routeCoordinates && routeCoordinates.length > 0 && (
        <Polyline
          coordinates={routeCoordinates.map(toMapCoordinates)}
          strokeColor="#1497A1"
          strokeWidth={5}
          lineCap="round"
          lineJoin="round"
        />
      )}
      {markers?.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={toMapCoordinates(marker.coordinate)}
          title={marker.title}
          description={marker.description}
          pinColor={getMarkerColor(marker)}
          opacity={marker.completed ? 0.5 : 1.0}
        />
      ))}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F7F9',
  },
});
