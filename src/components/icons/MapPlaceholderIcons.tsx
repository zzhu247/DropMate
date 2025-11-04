import React from 'react';
import { View, StyleSheet } from 'react-native';

type IconProps = {
  size?: number;
  color?: string;
};

/**
 * Custom map placeholder icons for different states
 */

/**
 * Icon for when map is disabled
 * Shows a map with a slash through it
 */
export const MapDisabledIcon: React.FC<IconProps> = ({ size = 32, color = '#1497A1' }) => {
  return (
    <View style={[styles.iconContainer, { width: size, height: size }]}>
      {/* Map background */}
      <View
        style={[
          styles.mapBase,
          {
            borderColor: color,
            opacity: 0.3,
          },
        ]}
      />
      {/* Folded corner */}
      <View
        style={[
          styles.foldedCorner,
          {
            borderRightColor: color,
            borderBottomColor: color,
            opacity: 0.3,
            top: size * 0.15,
            right: size * 0.15,
          },
        ]}
      />
      {/* Diagonal slash */}
      <View
        style={[
          styles.slash,
          {
            backgroundColor: color,
            width: size * 1.2,
            height: size * 0.12,
            transform: [{ rotate: '-45deg' }],
          },
        ]}
      />
    </View>
  );
};

/**
 * Icon for when map is loading
 * Shows a pulsing map with location marker
 */
export const MapLoadingIcon: React.FC<IconProps> = ({ size = 32, color = '#1497A1' }) => {
  return (
    <View style={[styles.iconContainer, { width: size, height: size }]}>
      {/* Map background */}
      <View
        style={[
          styles.mapBase,
          {
            borderColor: color,
            opacity: 0.5,
          },
        ]}
      />
      {/* Folded corner */}
      <View
        style={[
          styles.foldedCorner,
          {
            borderRightColor: color,
            borderBottomColor: color,
            opacity: 0.5,
            top: size * 0.15,
            right: size * 0.15,
          },
        ]}
      />
      {/* Loading dots */}
      <View style={styles.dotsContainer}>
        <View style={[styles.dot, { backgroundColor: color, width: size * 0.1, height: size * 0.1 }]} />
        <View
          style={[
            styles.dot,
            { backgroundColor: color, width: size * 0.1, height: size * 0.1, opacity: 0.6 },
          ]}
        />
        <View
          style={[
            styles.dot,
            { backgroundColor: color, width: size * 0.1, height: size * 0.1, opacity: 0.3 },
          ]}
        />
      </View>
    </View>
  );
};

/**
 * Icon for when map fails to load
 * Shows a map with an X or error symbol
 */
export const MapErrorIcon: React.FC<IconProps> = ({ size = 32, color = '#1497A1' }) => {
  return (
    <View style={[styles.iconContainer, { width: size, height: size }]}>
      {/* Map background */}
      <View
        style={[
          styles.mapBase,
          {
            borderColor: color,
            opacity: 0.4,
          },
        ]}
      />
      {/* Folded corner */}
      <View
        style={[
          styles.foldedCorner,
          {
            borderRightColor: color,
            borderBottomColor: color,
            opacity: 0.4,
            top: size * 0.15,
            right: size * 0.15,
          },
        ]}
      />
      {/* X mark - first diagonal */}
      <View
        style={[
          styles.xMark,
          {
            backgroundColor: color,
            width: size * 0.5,
            height: size * 0.1,
            transform: [{ rotate: '45deg' }],
          },
        ]}
      />
      {/* X mark - second diagonal */}
      <View
        style={[
          styles.xMark,
          {
            backgroundColor: color,
            width: size * 0.5,
            height: size * 0.1,
            transform: [{ rotate: '-45deg' }],
          },
        ]}
      />
    </View>
  );
};

/**
 * Icon for map coming soon / preview unavailable
 * Shows a simplified map icon
 */
export const MapPreviewIcon: React.FC<IconProps> = ({ size = 32, color = '#1497A1' }) => {
  return (
    <View style={[styles.iconContainer, { width: size, height: size }]}>
      {/* Map background */}
      <View
        style={[
          styles.mapBase,
          {
            borderColor: color,
          },
        ]}
      />
      {/* Folded corner */}
      <View
        style={[
          styles.foldedCorner,
          {
            borderRightColor: color,
            borderBottomColor: color,
            top: size * 0.15,
            right: size * 0.15,
          },
        ]}
      />
      {/* Location pin */}
      <View style={styles.pinContainer}>
        <View
          style={[
            styles.pinCircle,
            {
              backgroundColor: color,
              width: size * 0.25,
              height: size * 0.25,
              borderRadius: size * 0.25,
            },
          ]}
        />
        <View
          style={[
            styles.pinPoint,
            {
              borderLeftWidth: size * 0.08,
              borderRightWidth: size * 0.08,
              borderTopWidth: size * 0.15,
              borderTopColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mapBase: {
    position: 'absolute',
    width: '85%',
    height: '85%',
    borderWidth: 2,
    borderRadius: 4,
  },
  foldedCorner: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderLeftColor: 'transparent',
    borderTopColor: 'transparent',
  },
  slash: {
    position: 'absolute',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 3,
  },
  dot: {
    borderRadius: 999,
  },
  xMark: {
    position: 'absolute',
  },
  pinContainer: {
    alignItems: 'center',
    marginTop: -4,
  },
  pinCircle: {
    borderWidth: 2,
    borderColor: 'white',
  },
  pinPoint: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
});
