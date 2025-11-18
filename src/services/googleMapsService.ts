import { LatLng } from '@/utils/map';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export type DirectionsResult = {
  routeCoordinates: LatLng[];
  distance: number; // in meters
  duration: number; // in seconds
  distanceText: string; // e.g., "5.2 km"
  durationText: string; // e.g., "12 mins"
};

type DirectionsApiResponse = {
  routes: Array<{
    overview_polyline: {
      points: string;
    };
    legs: Array<{
      distance: {
        value: number;
        text: string;
      };
      duration: {
        value: number;
        text: string;
      };
    }>;
  }>;
  status: string;
  error_message?: string;
};

/**
 * Get directions between two points using Google Directions API
 * Returns route coordinates following actual roads
 */
export const getDirections = async (
  origin: LatLng,
  destination: LatLng
): Promise<DirectionsResult> => {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key is not configured');
  }

  const originStr = `${origin.lat},${origin.lng}`;
  const destinationStr = `${destination.lat},${destination.lng}`;

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await fetch(url);
    const data: DirectionsApiResponse = await response.json();

    if (data.status !== 'OK') {
      throw new Error(
        data.error_message || `Directions API error: ${data.status}`
      );
    }

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No routes found');
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    // Decode the polyline
    const routeCoordinates = decodePolyline(route.overview_polyline.points);

    return {
      routeCoordinates,
      distance: leg.distance.value,
      duration: leg.duration.value,
      distanceText: leg.distance.text,
      durationText: leg.duration.text,
    };
  } catch (error) {
    console.error('Error fetching directions:', error);
    throw error;
  }
};

/**
 * Decode Google's encoded polyline format to array of coordinates
 * Based on Google's polyline encoding algorithm
 * https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
export const decodePolyline = (encoded: string): LatLng[] => {
  const points: LatLng[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;

    // Decode latitude
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    // Decode longitude
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    points.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return points;
};

/**
 * Format distance in a human-readable way
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
};

/**
 * Format duration in a human-readable way
 */
export const formatDuration = (seconds: number): string => {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};
