import { useQuery } from '@tanstack/react-query';

export function useFiscalYears() {
  return useQuery({
    queryKey: ['/api/fiscal-years'],
    queryFn: async (): Promise<string[]> => {
      const response = await fetch('/api/fiscal-years');
      if (!response.ok) {
        throw new Error('Failed to fetch fiscal years');
      }
      return response.json();
    },
  });
}