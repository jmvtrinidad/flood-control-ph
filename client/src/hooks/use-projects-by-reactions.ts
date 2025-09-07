import { useQuery } from '@tanstack/react-query';
import type { ProjectFilters } from '@/types/project';

interface ProjectWithReactions {
  id: string;
  projectname: string;
  location: string;
  region: string;
  contractor: string;
  cost: string;
  status: string;
  reactions: string[];
  reactionScore: number;
  reactionCount: number;
  averageReactionScore: number;
}

interface ContractorGroup {
  contractor: string;
  projects: ProjectWithReactions[];
  bestScore: number;
}

export function useProjectsByReactions(sortBy?: string, filters?: ProjectFilters) {
  const queryParams = new URLSearchParams();
  if (sortBy) {
    queryParams.set('sortBy', sortBy);
  }
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.set(key, String(value));
      }
    });
  }

  return useQuery<ContractorGroup[]>({
    queryKey: ['projects-by-reactions', sortBy, queryParams.toString()],
    queryFn: async () => {
      const url = `/api/projects/by-reactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch projects by reactions');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
