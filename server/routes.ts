import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, filtersSchema, uploadProjectSchema } from "@shared/schema";
import multer from "multer";
import { z } from "zod";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get projects with optional filters
  app.get("/api/projects", async (req, res) => {
    try {
      const filters = filtersSchema.parse(req.query);
      const projects = await storage.getProjects(filters);
      res.json(projects);
    } catch (error) {
      res.status(400).json({ error: "Invalid filters", details: error });
    }
  });

  // Get single project
  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  // Create single project
  app.post("/api/projects", async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ error: "Invalid project data", details: error });
    }
  });

  // Bulk create projects
  app.post("/api/projects/bulk", async (req, res) => {
    try {
      const projectsData = z.array(insertProjectSchema).parse(req.body);
      const projects = await storage.createProjects(projectsData);
      res.status(201).json({ 
        message: `Created ${projects.length} projects`,
        projects 
      });
    } catch (error) {
      res.status(400).json({ error: "Invalid projects data", details: error });
    }
  });

  // Upload JSON file
  app.post("/api/projects/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fileContent = req.file.buffer.toString("utf-8");
      let jsonData;
      
      try {
        jsonData = JSON.parse(fileContent);
      } catch (parseError) {
        return res.status(400).json({ error: "Invalid JSON file" });
      }

      // Ensure it's an array
      const projectsArray = Array.isArray(jsonData) ? jsonData : [jsonData];
      const validatedUploadProjects = z.array(uploadProjectSchema).parse(projectsArray);
      
      // Convert upload format to insert format
      const insertProjects = validatedUploadProjects.map(project => ({
        ...project,
        latitude: project.latitude.toString(),
        longitude: project.longitude.toString(),
        cost: project.cost.toString(),
      }));
      
      const projects = await storage.createProjects(insertProjects);
      res.json({
        message: `Successfully uploaded ${projects.length} projects`,
        projects
      });
    } catch (error) {
      res.status(400).json({ error: "Failed to process uploaded file", details: error });
    }
  });

  // Load data from external URL
  app.post("/api/projects/load-url", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      const response = await fetch(url);
      if (!response.ok) {
        return res.status(400).json({ error: "Failed to fetch data from URL" });
      }

      const jsonData = await response.json();
      const projectsArray = Array.isArray(jsonData) ? jsonData : [jsonData];
      const validatedUploadProjects = z.array(uploadProjectSchema).parse(projectsArray);
      
      // Convert upload format to insert format
      const insertProjects = validatedUploadProjects.map(project => ({
        ...project,
        latitude: project.latitude.toString(),
        longitude: project.longitude.toString(),
        cost: project.cost.toString(),
      }));
      
      const projects = await storage.createProjects(insertProjects);
      res.json({
        message: `Successfully loaded ${projects.length} projects from URL`,
        projects
      });
    } catch (error) {
      res.status(400).json({ error: "Failed to load data from URL", details: error });
    }
  });

  // Update project
  app.put("/api/projects/:id", async (req, res) => {
    try {
      const updateData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(req.params.id, updateData);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data", details: error });
    }
  });

  // Delete project
  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const success = await storage.deleteProject(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // Clear all projects
  app.delete("/api/projects", async (req, res) => {
    try {
      await storage.clearProjects();
      res.json({ message: "All projects cleared successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear projects" });
    }
  });

  // Get analytics
  app.get("/api/analytics", async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Export projects as CSV
  app.get("/api/projects/export/csv", async (req, res) => {
    try {
      const filters = filtersSchema.parse(req.query);
      const projects = await storage.getProjects(filters);
      
      // Generate CSV
      const headers = [
        "ID", "Project Name", "Location", "Latitude", "Longitude", 
        "Contractor", "Cost", "Start Date", "Completion Date", 
        "Fiscal Year", "Region", "Status", "Other Details"
      ];
      
      const csvRows = [
        headers.join(","),
        ...projects.map(p => [
          p.id,
          `"${p.projectname.replace(/"/g, '""')}"`,
          `"${p.location.replace(/"/g, '""')}"`,
          p.latitude,
          p.longitude,
          `"${p.contractor.replace(/"/g, '""')}"`,
          p.cost,
          p.start_date || "",
          p.completion_date || "",
          p.fy,
          `"${p.region.replace(/"/g, '""')}"`,
          p.status || "",
          p.other_details ? `"${p.other_details.replace(/"/g, '""')}"` : ""
        ].join(","))
      ];

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="projects.csv"');
      res.send(csvRows.join("\n"));
    } catch (error) {
      res.status(500).json({ error: "Failed to export CSV" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
