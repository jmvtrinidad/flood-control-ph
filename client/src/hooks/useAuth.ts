import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  avatar?: string;
  provider: string;
  isLocationVerified: boolean;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
  };
}

export function useLogout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiRequest('POST', '/api/auth/logout'),
    onSuccess: () => {
      // Clear all auth-related data from cache
      queryClient.setQueryData(['/api/auth/user'], null);
      queryClient.removeQueries({ queryKey: ['/api/auth/user'] });
      queryClient.clear(); // Clear all cached data
      // Redirect to root to fully clear state
      window.location.href = '/';
    },
    onError: (error) => {
      console.error('Logout error:', error);
      // Even if logout fails on server, clear client state
      queryClient.setQueryData(['/api/auth/user'], null);
      queryClient.removeQueries({ queryKey: ['/api/auth/user'] });
      queryClient.clear();
      // Still redirect to clear state
      window.location.href = '/';
    }
  });
}

export function useUpdateLocation() {
  return useMutation({
    mutationFn: (location: { latitude: number; longitude: number; address?: string }) =>
      apiRequest('POST', '/api/user/location', location),
  });
}