import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MapPin } from 'lucide-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { MapViewWrapper, MapViewWrapperProps } from './MapViewWrapper';
import { PlaceholderCard } from './PlaceholderCard';

/**
 * Safe wrapper around MapViewWrapper that catches errors
 * and shows a fallback UI instead of crashing
 */
export const MapViewSafe: React.FC<MapViewWrapperProps> = (props) => {
  const theme = useTheme();
  const [hasError, setHasError] = React.useState(false);

  // Reset error state when props change
  React.useEffect(() => {
    setHasError(false);
  }, [props.routeCoordinates, props.markers]);

  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <PlaceholderCard
          title="Map unavailable"
          description="Unable to load map. Please check your configuration and try again."
          Icon={MapPin}
        />
      </View>
    );
  }

  try {
    return (
      <ErrorBoundary onError={() => setHasError(true)}>
        <MapViewWrapper {...props} />
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('MapView error:', error);
    return (
      <View style={styles.errorContainer}>
        <PlaceholderCard
          title="Map unavailable"
          description="Unable to load map. Please check your configuration."
          Icon={MapPin}
        />
      </View>
    );
  }
};

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
    console.error('MapView Error Boundary caught:', error, errorInfo);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <MapPin size={48} color="#888" />
          <Text style={styles.errorText}>Map unavailable</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#888',
  },
});
