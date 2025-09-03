export type Project = {
  id: string;
  projectname: string;
  location: string;
  latitude: string;
  longitude: string;
  contractor: string;
  cost: string;
  start_date?: string;
  completion_date?: string;
  fy: string;
  region: string;
  other_details?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

export type ProjectFilters = {
  search?: string;
  minCost?: number;
  maxCost?: number;
  region?: string;
  contractor?: string;
  fiscalYear?: string;
  location?: string;
  status?: string;
};

export type Analytics = {
  totalProjects: number;
  totalCost: number;
  avgCost: number;
  activeRegions: number;
  projectsByRegion: { region: string; count: number; cost: number }[];
  projectsByContractor: { contractor: string; count: number; cost: number }[];
  projectsByFiscalYear: { fy: string; count: number; cost: number }[];
};

export type SortField = 'projectname' | 'location' | 'contractor' | 'cost' | 'fy';
export type SortDirection = 'asc' | 'desc';
