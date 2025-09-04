import { type Project, type InsertProject, type ProjectFilters } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getProjects(filters?: ProjectFilters): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  createProjects(projects: InsertProject[]): Promise<Project[]>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;
  clearProjects(): Promise<void>;
  getAnalytics(): Promise<{
    totalProjects: number;
    totalCost: number;
    avgCost: number;
    activeRegions: number;
    projectsByRegion: { region: string; count: number; cost: number }[];
    projectsByContractor: { contractor: string; count: number; cost: number }[];
    projectsByFiscalYear: { fy: string; count: number; cost: number }[];
  }>;
}

export class MemStorage implements IStorage {
  private projects: Map<string, Project>;

  constructor() {
    this.projects = new Map();
  }

  async getProjects(filters?: ProjectFilters): Promise<Project[]> {
    let projects = Array.from(this.projects.values());

    if (filters) {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        projects = projects.filter(p => 
          p.projectname.toLowerCase().includes(searchLower) ||
          p.location.toLowerCase().includes(searchLower) ||
          p.contractor.toLowerCase().includes(searchLower) ||
          p.region.toLowerCase().includes(searchLower) ||
          (p.other_details && p.other_details.toLowerCase().includes(searchLower))
        );
      }

      if (filters.minCost !== undefined) {
        projects = projects.filter(p => parseFloat(p.cost) >= filters.minCost!);
      }

      if (filters.maxCost !== undefined) {
        projects = projects.filter(p => parseFloat(p.cost) <= filters.maxCost!);
      }

      if (filters.region) {
        projects = projects.filter(p => p.region === filters.region);
      }

      if (filters.contractor) {
        projects = projects.filter(p => p.contractor === filters.contractor);
      }

      if (filters.fiscalYear) {
        projects = projects.filter(p => p.fy === filters.fiscalYear);
      }

      if (filters.location) {
        const locationLower = filters.location.toLowerCase();
        projects = projects.filter(p => p.location.toLowerCase().includes(locationLower));
      }

      if (filters.status) {
        projects = projects.filter(p => p.status === filters.status);
      }
    }

    return projects.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const project: Project = { 
      ...insertProject, 
      id, 
      created_at: now as any,
      updated_at: now as any 
    };
    this.projects.set(id, project);
    return project;
  }

  async createProjects(insertProjects: InsertProject[]): Promise<Project[]> {
    const projects: Project[] = [];
    for (const insertProject of insertProjects) {
      const project = await this.createProject(insertProject);
      projects.push(project);
    }
    return projects;
  }

  async updateProject(id: string, updateData: Partial<InsertProject>): Promise<Project | undefined> {
    const existing = this.projects.get(id);
    if (!existing) return undefined;

    const updated: Project = {
      ...existing,
      ...updateData,
      updated_at: new Date().toISOString() as any
    };
    this.projects.set(id, updated);
    return updated;
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.projects.delete(id);
  }

  async clearProjects(): Promise<void> {
    this.projects.clear();
  }

  async getAnalytics(filters?: any) {
    let projects = Array.from(this.projects.values());
    
    // Apply filters if provided
    if (filters) {
      projects = projects.filter(project => {
        // Search filter
        if (filters.search) {
          const search = filters.search.toLowerCase();
          if (!project.projectname.toLowerCase().includes(search) &&
              !project.location.toLowerCase().includes(search) &&
              !project.contractor.toLowerCase().includes(search)) {
            return false;
          }
        }

        // Cost range filters
        if (filters.minCost) {
          const cost = parseFloat(project.cost);
          if (cost < parseFloat(filters.minCost)) return false;
        }
        if (filters.maxCost) {
          const cost = parseFloat(project.cost);
          if (cost > parseFloat(filters.maxCost)) return false;
        }

        // Region filter
        if (filters.region && project.region !== filters.region) {
          return false;
        }

        // Contractor filter
        if (filters.contractor && !project.contractor.toLowerCase().includes(filters.contractor.toLowerCase())) {
          return false;
        }

        // Fiscal year filter
        if (filters.fiscalYear && project.fy !== filters.fiscalYear) {
          return false;
        }

        // Location filter
        if (filters.location && !project.location.toLowerCase().includes(filters.location.toLowerCase())) {
          return false;
        }

        // Status filter
        if (filters.status && project.status !== filters.status) {
          return false;
        }

        return true;
      });
    }
    const totalProjects = projects.length;
    const totalCost = projects.reduce((sum, p) => sum + parseFloat(p.cost), 0);
    const avgCost = totalProjects > 0 ? totalCost / totalProjects : 0;
    const uniqueRegions = new Set(projects.map(p => p.region));
    const activeRegions = uniqueRegions.size;

    // Group by region
    const regionMap = new Map<string, { count: number; cost: number }>();
    projects.forEach(p => {
      const existing = regionMap.get(p.region) || { count: 0, cost: 0 };
      regionMap.set(p.region, {
        count: existing.count + 1,
        cost: existing.cost + parseFloat(p.cost)
      });
    });
    const projectsByRegion = Array.from(regionMap.entries()).map(([region, data]) => ({
      region,
      ...data
    }));

    // Group by contractor (handle multiple contractors separated by "/")
    const contractorMap = new Map<string, { count: number; cost: number }>();
    projects.forEach(p => {
      const projectCost = parseFloat(p.cost);
      const contractors = p.contractor.split('/').map(c => c.trim());
      
      // If multiple contractors, divide the cost equally among them
      const costPerContractor = projectCost / contractors.length;
      
      contractors.forEach(contractor => {
        if (contractor) { // Only process non-empty contractor names
          const existing = contractorMap.get(contractor) || { count: 0, cost: 0 };
          contractorMap.set(contractor, {
            count: existing.count + 1,
            cost: existing.cost + costPerContractor
          });
        }
      });
    });
    const projectsByContractor = Array.from(contractorMap.entries()).map(([contractor, data]) => ({
      contractor,
      ...data
    }));

    // Group by fiscal year
    const fyMap = new Map<string, { count: number; cost: number }>();
    projects.forEach(p => {
      const existing = fyMap.get(p.fy) || { count: 0, cost: 0 };
      fyMap.set(p.fy, {
        count: existing.count + 1,
        cost: existing.cost + parseFloat(p.cost)
      });
    });
    const projectsByFiscalYear = Array.from(fyMap.entries()).map(([fy, data]) => ({
      fy,
      ...data
    }));

    return {
      totalProjects,
      totalCost,
      avgCost,
      activeRegions,
      projectsByRegion,
      projectsByContractor,
      projectsByFiscalYear,
    };
  }
}

export const storage = new MemStorage();
