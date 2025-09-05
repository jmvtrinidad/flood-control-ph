import { type Project, type InsertProject, type ProjectFilters, uploadProjectSchema, projects } from "@shared/schema";
import { randomUUID } from "crypto";
import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { db } from "./db";

export interface IStorage {
  initialize(): Promise<void>;
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

  async initialize(): Promise<void> {
    try {
      // Load the initial dataset from the JSON file
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      
      // Try multiple possible paths for the data file
      const possiblePaths = [
        join(__dirname, 'initial-data.json'),
        join(__dirname, '..', 'server', 'initial-data.json'),
        join(process.cwd(), 'server', 'initial-data.json'),
        'server/initial-data.json'
      ];
      
      let rawData: string | null = null;
      let usedPath: string | null = null;
      
      for (const dataPath of possiblePaths) {
        try {
          rawData = await readFile(dataPath, 'utf-8');
          usedPath = dataPath;
          break;
        } catch (error) {
          // Try next path
          continue;
        }
      }
      
      if (!rawData) {
        throw new Error('Could not find initial-data.json in any expected location');
      }
      const parsedData = JSON.parse(rawData);
      console.log(`Successfully loaded data from: ${usedPath}`);
      
      // Validate and create projects
      const validProjects: InsertProject[] = [];
      for (const item of parsedData) {
        try {
          const validatedProject = uploadProjectSchema.parse(item);
          if (validatedProject.latitude && validatedProject.longitude && validatedProject.cost) {
            const insertProject: InsertProject = {
              ...validatedProject,
              latitude: validatedProject.latitude.toString(),
              longitude: validatedProject.longitude.toString(),
              cost: validatedProject.cost.toString(),
              status: validatedProject.status || "active"
            };
            validProjects.push(insertProject);
          }
        } catch (error) {
          // Skip invalid projects silently
          continue;
        }
      }
      
      // Create all valid projects
      await this.createProjects(validProjects);
      console.log(`Loaded ${validProjects.length} infrastructure projects from initial dataset`);
    } catch (error) {
      console.warn('Could not load initial dataset:', error);
      // Continue without initial data if file doesn't exist or is invalid
    }
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
    const now = new Date();
    const project: Project = {
      ...insertProject,
      status: insertProject.status || "active",
      start_date: insertProject.start_date || null,
      completion_date: insertProject.completion_date || null,
      other_details: insertProject.other_details || null,
      id,
      created_at: now,
      updated_at: now
    };
    
    // Save to memory
    this.projects.set(id, project);
    
    // Also save to database for foreign key constraints
    try {
      await db.insert(projects).values(project);
    } catch (error) {
      console.warn('Failed to save project to database:', error);
      // Continue with memory storage even if DB fails
    }
    
    return project;
  }

  async createProjects(insertProjects: InsertProject[]): Promise<Project[]> {
    const createdProjects: Project[] = [];
    const projectsForDb: Project[] = [];
    
    // Create all projects in memory first
    for (const insertProject of insertProjects) {
      const id = randomUUID();
      const now = new Date();
      const project: Project = {
        ...insertProject,
        status: insertProject.status || "active",
        start_date: insertProject.start_date || null,
        completion_date: insertProject.completion_date || null,
        other_details: insertProject.other_details || null,
        id,
        created_at: now,
        updated_at: now
      };
      
      this.projects.set(id, project);
      createdProjects.push(project);
      projectsForDb.push(project);
    }
    
    // Bulk save to database in batches to avoid stack overflow
    try {
      if (projectsForDb.length > 0) {
        const batchSize = 100; // Process in batches of 100
        for (let i = 0; i < projectsForDb.length; i += batchSize) {
          const batch = projectsForDb.slice(i, i + batchSize);
          await db.insert(projects).values(batch);
        }
        console.log(`Successfully saved ${projectsForDb.length} projects to database`);
      }
    } catch (error) {
      console.warn('Failed to bulk save projects to database:', error);
      // Continue with memory storage even if DB fails
    }
    
    return createdProjects;
  }

  async updateProject(id: string, updateData: Partial<InsertProject>): Promise<Project | undefined> {
    const existing = this.projects.get(id);
    if (!existing) return undefined;

    const updated: Project = {
      ...existing,
      ...updateData,
      updated_at: new Date()
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

        // Date range filter
        if (filters.dateRange) {
          const now = new Date();
          let cutoffDate: Date;
          
          switch (filters.dateRange) {
            case '12months':
              cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
              break;
            case '24months':
              cutoffDate = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
              break;
            case 'alltime':
              cutoffDate = new Date(0); // Beginning of time
              break;
            default:
              cutoffDate = new Date(0);
          }
          
          // Check if project falls within date range using start_date or completion_date
          const projectStartDate = project.start_date ? new Date(project.start_date) : null;
          const projectCompletionDate = project.completion_date ? new Date(project.completion_date) : null;
          
          const hasValidDate = (projectStartDate && projectStartDate >= cutoffDate) || 
                              (projectCompletionDate && projectCompletionDate >= cutoffDate);
          
          if (!hasValidDate && filters.dateRange !== 'alltime') {
            return false;
          }
        }

        // Custom date range filter  
        if (filters.dateFrom || filters.dateTo) {
          const projectStartDate = project.start_date ? new Date(project.start_date) : null;
          const projectCompletionDate = project.completion_date ? new Date(project.completion_date) : null;
          
          if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom);
            const hasValidFromDate = (projectStartDate && projectStartDate >= fromDate) ||
                                    (projectCompletionDate && projectCompletionDate >= fromDate);
            if (!hasValidFromDate) return false;
          }
          
          if (filters.dateTo) {
            const toDate = new Date(filters.dateTo);
            const hasValidToDate = (projectStartDate && projectStartDate <= toDate) ||
                                  (projectCompletionDate && projectCompletionDate <= toDate);
            if (!hasValidToDate) return false;
          }
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

    // Group by location within regions if a specific region filter is provided
    let projectsByLocation: { location: string; count: number; cost: number }[] = [];
    if (filters?.region) {
      const regionProjects = projects.filter(p => p.region === filters.region);
      const locationMap = new Map<string, { count: number; cost: number }>();
      regionProjects.forEach(p => {
        const existing = locationMap.get(p.location) || { count: 0, cost: 0 };
        locationMap.set(p.location, {
          count: existing.count + 1,
          cost: existing.cost + parseFloat(p.cost)
        });
      });
      projectsByLocation = Array.from(locationMap.entries()).map(([location, data]) => ({
        location,
        ...data
      }));
    }

    // Group by contractor (handle multiple contractors separated by "/")
    const contractorMap = new Map<string, { count: number; cost: number }>();
    projects.forEach(p => {
      const projectCost = parseFloat(p.cost);
      const contractors = p.contractor.split('/').map(c => c.trim());
      
      // Choose cost calculation method based on filter option
      const useFullCost = filters?.useFullCostForJointVentures || false;
      const costPerContractor = useFullCost ? projectCost : projectCost / contractors.length;
      
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
      projectsByLocation,
      projectsByContractor,
      projectsByFiscalYear,
    };
  }
}

export const storage = new MemStorage();