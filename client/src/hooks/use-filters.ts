import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'wouter';
import type { ProjectFilters } from '@/types/project';

export function useFilters() {
  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState<ProjectFilters>({});

  // Load filters from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlFilters: ProjectFilters = {};

    if (urlParams.get('search')) urlFilters.search = urlParams.get('search')!;
    if (urlParams.get('minCost')) urlFilters.minCost = Number(urlParams.get('minCost'));
    if (urlParams.get('maxCost')) urlFilters.maxCost = Number(urlParams.get('maxCost'));
    if (urlParams.get('region')) urlFilters.region = urlParams.get('region')!;
    if (urlParams.get('contractor')) urlFilters.contractor = urlParams.get('contractor')!;
    if (urlParams.get('fiscalYear')) urlFilters.fiscalYear = urlParams.get('fiscalYear')!;
    if (urlParams.get('location')) urlFilters.location = urlParams.get('location')!;
    if (urlParams.get('status')) urlFilters.status = urlParams.get('status')!;

    setFilters(urlFilters);
  }, []);

  // Update URL when filters change
  const updateFilters = useCallback((newFilters: Partial<ProjectFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    
    // Remove undefined values and "all" values
    Object.keys(updatedFilters).forEach(key => {
      if (updatedFilters[key as keyof ProjectFilters] === undefined || 
          updatedFilters[key as keyof ProjectFilters] === '' ||
          updatedFilters[key as keyof ProjectFilters] === 'all') {
        delete updatedFilters[key as keyof ProjectFilters];
      }
    });

    setFilters(updatedFilters);

    // Update URL
    const urlParams = new URLSearchParams();
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        urlParams.set(key, String(value));
      }
    });

    const newUrl = urlParams.toString() ? `/?${urlParams.toString()}` : '/';
    window.history.replaceState({}, '', newUrl);
  }, [filters]);

  const clearFilters = useCallback(() => {
    setFilters({});
    window.history.replaceState({}, '', '/');
  }, []);

  return {
    filters,
    updateFilters,
    clearFilters,
  };
}
