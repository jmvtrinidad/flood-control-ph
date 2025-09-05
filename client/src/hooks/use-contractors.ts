import { useQuery } from '@tanstack/react-query';

export function useContractors() {
  return useQuery({
    queryKey: ['/api/contractors'],
    queryFn: async (): Promise<string[]> => {
      const response = await fetch('/api/contractors');
      if (!response.ok) {
        throw new Error('Failed to fetch contractors');
      }
      return response.json();
    },
  });
}