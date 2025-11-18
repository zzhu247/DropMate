import { useQuery } from '@tanstack/react-query';
import { userService } from '@/api/userService';
import { userKeys } from '@/api/queryKeys';

/**
 * Hook to fetch the current user's profile
 */
export const useUserProfileQuery = () => {
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: () => userService.getProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch the current user's statistics
 */
export const useUserStatsQuery = () => {
  return useQuery({
    queryKey: userKeys.stats(),
    queryFn: () => userService.getStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
