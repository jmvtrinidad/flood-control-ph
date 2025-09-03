import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Project, ProjectFilters, Analytics } from '@/types/project';

export function useProjects(filters?: ProjectFilters) {
  const queryParams = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.set(key, String(value));
      }
    });
  }

  return useQuery<Project[]>({
    queryKey: ['/api/projects', queryParams.toString()],
    queryFn: async () => {
      const url = `/api/projects${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      return response.json();
    },
  });
}

export function useProject(id: string) {
  return useQuery<Project>({
    queryKey: ['/api/projects', id],
    enabled: !!id,
  });
}

export function useAnalytics() {
  return useQuery<Analytics>({
    queryKey: ['/api/analytics'],
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await apiRequest('POST', '/api/projects', project);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
    },
  });
}

export function useCreateProjects() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (projects: Omit<Project, 'id' | 'created_at' | 'updated_at'>[]) => {
      const response = await apiRequest('POST', '/api/projects/bulk', projects);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
    },
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/projects/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
    },
  });
}

export function useLoadFromUrl() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest('POST', '/api/projects/load-url', { url });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
    },
  });
}

export function useClearProjects() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/projects');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
    },
  });
}
