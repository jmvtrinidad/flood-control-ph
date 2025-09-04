import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface Reaction {
  id: string;
  rating: 'excellent' | 'standard' | 'sub-standard' | 'ghost';
  comment?: string;
  isProximityVerified: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    isLocationVerified: boolean;
  };
}

export function useProjectReactions(projectId: string) {
  return useQuery<Reaction[]>({
    queryKey: [`/api/projects/${projectId}/reactions`],
    enabled: !!projectId,
  });
}

export function useAddReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, rating, comment, userLocation }: { 
      projectId: string; 
      rating: string; 
      comment?: string;
      userLocation?: { latitude: number; longitude: number };
    }) =>
      apiRequest('POST', `/api/projects/${projectId}/reactions`, { rating, comment, userLocation }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/projects/${variables.projectId}/reactions`] 
      });
    },
  });
}

export function useVerifyProximity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reactionId: string) =>
      apiRequest('POST', `/api/reactions/${reactionId}/verify-proximity`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    },
  });
}