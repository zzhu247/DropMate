import { LatLng } from './map';
import { DeliveryItem } from '@/types';

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export const calculateDistance = (point1: LatLng, point2: LatLng): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(point2.lat - point1.lat);
  const dLng = toRad(point2.lng - point1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) *
      Math.cos(toRad(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

const toRad = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

/**
 * Estimate travel time based on distance
 * Assumes average speed of 40 km/h in urban areas
 * Returns time in minutes
 */
export const estimateTravelTime = (distanceKm: number): number => {
  const AVERAGE_SPEED_KMH = 40;
  const timeHours = distanceKm / AVERAGE_SPEED_KMH;
  const timeMinutes = timeHours * 60;
  return Math.round(timeMinutes);
};

/**
 * Calculate total route distance for a series of waypoints
 */
export const calculateTotalRouteDistance = (waypoints: LatLng[]): number => {
  if (waypoints.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    totalDistance += calculateDistance(waypoints[i], waypoints[i + 1]);
  }

  return totalDistance;
};

/**
 * Optimize delivery route using nearest neighbor algorithm
 * This is a simple greedy algorithm - can be replaced with more sophisticated routing later
 */
export const optimizeDeliveryRoute = (
  startLocation: LatLng,
  deliveries: DeliveryItem[],
  deliveryLocations: Map<string, LatLng>,
): DeliveryItem[] => {
  if (deliveries.length === 0) return [];

  const unvisited = [...deliveries];
  const optimizedRoute: DeliveryItem[] = [];
  let currentLocation = startLocation;

  // Greedy nearest neighbor
  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    unvisited.forEach((delivery, index) => {
      const deliveryLoc = deliveryLocations.get(delivery.id);
      if (!deliveryLoc) return;

      const distance = calculateDistance(currentLocation, deliveryLoc);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    const nearest = unvisited.splice(nearestIndex, 1)[0];
    optimizedRoute.push(nearest);

    const nextLoc = deliveryLocations.get(nearest.id);
    if (nextLoc) {
      currentLocation = nextLoc;
    }
  }

  return optimizedRoute;
};

/**
 * Calculate ETA for a delivery based on current location and route
 */
export const calculateDeliveryETA = (
  currentLocation: LatLng,
  deliveryLocation: LatLng,
  previousDeliveries: number = 0,
): Date => {
  const distance = calculateDistance(currentLocation, deliveryLocation);
  const travelTime = estimateTravelTime(distance);

  // Add 5 minutes per previous delivery for stop time
  const stopTime = previousDeliveries * 5;

  const totalMinutes = travelTime + stopTime;
  const eta = new Date();
  eta.setMinutes(eta.getMinutes() + totalMinutes);

  return eta;
};

/**
 * Generate route waypoints between two locations
 * For now returns a straight line, can be replaced with actual routing API
 */
export const generateRouteWaypoints = (
  start: LatLng,
  end: LatLng,
  numPoints: number = 5,
): LatLng[] => {
  const waypoints: LatLng[] = [];

  for (let i = 0; i <= numPoints; i++) {
    const ratio = i / numPoints;
    waypoints.push({
      lat: start.lat + (end.lat - start.lat) * ratio,
      lng: start.lng + (end.lng - start.lng) * ratio,
    });
  }

  return waypoints;
};

/**
 * Check if a location is within delivery radius
 */
export const isWithinDeliveryRadius = (
  location: LatLng,
  centerLocation: LatLng,
  radiusKm: number,
): boolean => {
  const distance = calculateDistance(location, centerLocation);
  return distance <= radiusKm;
};
