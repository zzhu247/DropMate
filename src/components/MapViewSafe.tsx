import React from 'react';
import { View, StyleSheet } from 'react-native';

import { PlaceholderCard } from './PlaceholderCard';
import {
  MapDisabledIcon,
  MapErrorIcon,
  MapLoadingIcon,
  MapPreviewIcon,
} from './icons/MapPlaceholderIcons';
import { FEATURE_FLAGS } from '@/constants/featureFlags';

export type MapViewWrapperProps = {
  routeCoordinates?: Array<{ lat: number; lng: number }>;
  markers?: Array<{
    id: string;
    coordinate: { lat: number; lng: number };
    title?: string;
    description?: string;
    pinColor?: string;
  }>;
  style?: any;
  initialRegion?: any;
  onMapReady?: () => void;
};

/**
 * Safe wrapper that dynamically loads MapViewWrapper only when needed
 * Uses Expo SDK 54's react-native-maps - works with Expo Go
 */
export const MapViewSafe: React.FC<MapViewWrapperProps> = (props) => {
  const [hasError, setHasError] = React.useState(false);
  const [MapComponent, setMapComponent] = React.useState<React.ComponentType<MapViewWrapperProps> | null>(null);

  // Dynamically load MapViewWrapper only when maps are enabled
  React.useEffect(() => {
    if (FEATURE_FLAGS.mapsEnabled && !MapComponent && !hasError) {
      try {
        const { MapViewWrapper } = require('./MapViewWrapper');
        setMapComponent(() => MapViewWrapper);
      } catch (error) {
        console.error('Failed to load MapViewWrapper:', error);
        setHasError(true);
      }
    }
  }, [FEATURE_FLAGS.mapsEnabled, MapComponent, hasError]);

  // Show placeholder if maps are disabled
  if (!FEATURE_FLAGS.mapsEnabled) {
    return (
      <View style={styles.container}>
        <PlaceholderCard
          title="Map preview coming soon"
          description="Map feature is currently disabled. Enable it in feature flags to see live maps."
          Icon={MapPreviewIcon}
        />
      </View>
    );
  }

  // Show error placeholder if map failed to load
  if (hasError) {
    return (
      <View style={styles.container}>
        <PlaceholderCard
          title="Map unavailable"
          description="Unable to load map. This may require a development build."
          Icon={MapErrorIcon}
        />
      </View>
    );
  }

  // Show loading placeholder while map component loads
  if (!MapComponent) {
    return (
      <View style={styles.container}>
        <PlaceholderCard
          title="Loading map..."
          description="Please wait while the map loads."
          Icon={MapLoadingIcon}
        />
      </View>
    );
  }

  return (
    <ErrorBoundary onError={() => setHasError(true)}>
      <MapComponent {...props} />
    </ErrorBoundary>
  );
};

/**
 * Error boundary to catch map rendering errors
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('MapView Error:', error, errorInfo);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
});
