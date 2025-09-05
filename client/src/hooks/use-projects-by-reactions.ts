import { useQuery } from '@tanstack/react-query';

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

export function useProjectsByReactions() {
  return useQuery<ContractorGroup[]>({
    queryKey: ['projects-by-reactions'],
    queryFn: async () => {
      const response = await fetch('/api/projects/by-reactions');
      if (!response.ok) {
        throw new Error('Failed to fetch projects by reactions');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}