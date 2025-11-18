import { useQuery } from '@tanstack/react-query';
import { getDirections, DirectionsResult } from '@/services/googleMapsService';
import { LatLng } from '@/utils/map';

/**
 * Hook to fetch route between two points using Google Directions API
 * Automatically caches results to avoid redundant API calls
 */
export const useRouteQuery = (origin?: LatLng, destination?: LatLng) => {
  const enabled = Boolean(origin && destination);

  return useQuery<DirectionsResult | null>({
    queryKey: ['route', origin?.lat, origin?.lng, destination?.lat, destination?.lng],
    queryFn: async () => {
      if (!origin || !destination) {
        return null;
      }
      return getDirections(origin, destination);
    },
    enabled,
    staleTime: 15 * 60 * 1000, // Cache for 15 minutes (routes don't change frequently)
    retry: 2, // Retry failed requests twice
    retryDelay: 1000, // Wait 1 second between retries
  });
};
