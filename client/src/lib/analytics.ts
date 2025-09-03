import type { Project } from '@/types/project';

export function calculateMetrics(projects: Project[]) {
  if (projects.length === 0) {
    return {
      totalProjects: 0,
      totalCost: 0,
      avgCost: 0,
      activeRegions: 0,
    };
  }

  const totalProjects = projects.length;
  const totalCost = projects.reduce((sum, p) => sum + parseFloat(p.cost), 0);
  const avgCost = totalCost / totalProjects;
  const uniqueRegions = new Set(projects.map(p => p.region));
  const activeRegions = uniqueRegions.size;

  return {
    totalProjects,
    totalCost,
    avgCost,
    activeRegions,
  };
}

export function formatCurrency(amount: number): string {
  if (amount >= 1e9) {
    return `₱${(amount / 1e9).toFixed(1)}B`;
  } else if (amount >= 1e6) {
    return `₱${(amount / 1e6).toFixed(1)}M`;
  } else if (amount >= 1e3) {
    return `₱${(amount / 1e3).toFixed(1)}K`;
  } else {
    return `₱${amount.toFixed(0)}`;
  }
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

export function getPercentageChange(current: number, previous: number): {
  value: number;
  isPositive: boolean;
  formatted: string;
} {
  if (previous === 0) {
    return { value: 0, isPositive: true, formatted: '+0%' };
  }

  const change = ((current - previous) / previous) * 100;
  const isPositive = change >= 0;
  const formatted = `${isPositive ? '+' : ''}${change.toFixed(1)}%`;

  return {
    value: Math.abs(change),
    isPositive,
    formatted,
  };
}

export function groupProjectsByField<T extends keyof Project>(
  projects: Project[],
  field: T
): { [key: string]: Project[] } {
  return projects.reduce((groups, project) => {
    const key = String(project[field]);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(project);
    return groups;
  }, {} as { [key: string]: Project[] });
}

export function sortProjects(
  projects: Project[],
  sortField: keyof Project,
  sortDirection: 'asc' | 'desc'
): Project[] {
  return [...projects].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Handle numeric fields
    if (sortField === 'cost' || sortField === 'latitude' || sortField === 'longitude') {
      aValue = parseFloat(String(aValue)) as any;
      bValue = parseFloat(String(bValue)) as any;
    }

    // Handle date fields
    if (sortField === 'start_date' || sortField === 'completion_date' || 
        sortField === 'created_at' || sortField === 'updated_at') {
      aValue = new Date(String(aValue || '')).getTime() as any;
      bValue = new Date(String(bValue || '')).getTime() as any;
    }

    if ((aValue || 0) < (bValue || 0)) return sortDirection === 'asc' ? -1 : 1;
    if ((aValue || 0) > (bValue || 0)) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
}
