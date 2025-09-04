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
    mutationFn: ({ projectId, rating, comment }: { 
      projectId: string; 
      rating: string; 
      comment?: string; 
    }) =>
      apiRequest(`/api/projects/${projectId}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment }),
      }),
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
      apiRequest(`/api/reactions/${reactionId}/verify-proximity`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    },
  });
}