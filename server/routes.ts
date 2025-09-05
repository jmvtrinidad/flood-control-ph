import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertProjectSchema,
  filtersSchema,
  uploadProjectSchema,
  insertReactionSchema,
  insertUserLocationSchema,
  projects,
  settings,
} from "@shared/schema";
import {
  setupSession,
  setupPassport,
  setupAuthRoutes,
  requireAuth,
  optionalAuth,
} from "./auth";
import { db } from "./db";
import { reactions, userLocations, users } from "@shared/schema";
import { eq, and, or } from "drizzle-orm";
import multer from "multer";
import { z } from "zod";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupSession(app);
  await setupPassport(app);
  await setupAuthRoutes(app);
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

  // Get projects with reaction summaries grouped by contractor
  app.get("/api/projects/by-reactions", async (req, res) => {
    try {
      // Get all projects with their reaction summaries
      const projectsWithReactions = await db
        .select({
          id: projects.id,
          projectname: projects.projectname,
          location: projects.location,
          region: projects.region,
          contractor: projects.contractor,
          cost: projects.cost,
          status: projects.status,
          reactionId: reactions.id,
          rating: reactions.rating,
        })
        .from(projects)
        .leftJoin(reactions, eq(projects.id, reactions.projectId));

      // Group by project and calculate reaction scores
      const projectMap = new Map();
      
      projectsWithReactions.forEach(row => {
        if (!projectMap.has(row.id)) {
          projectMap.set(row.id, {
            id: row.id,
            projectname: row.projectname,
            location: row.location,
            region: row.region,
            contractor: row.contractor,
            cost: row.cost,
            status: row.status,
            reactions: [],
            reactionScore: 0,
            reactionCount: 0
          });
        }
        
        if (row.reactionId && row.rating) {
          const project = projectMap.get(row.id);
          project.reactions.push(row.rating);
          
          // Calculate reaction score (excellent=4, standard=3, sub-standard=2, ghost=1)
          const scores: Record<string, number> = { 'excellent': 4, 'standard': 3, 'sub-standard': 2, 'ghost': 1 };
          project.reactionScore += scores[row.rating as string] || 0;
          project.reactionCount++;
        }
      });

      // Convert to array and calculate average scores
      const projectsArray = Array.from(projectMap.values()).map(project => ({
        ...project,
        averageReactionScore: project.reactionCount > 0 ? project.reactionScore / project.reactionCount : 0
      }));

      // Group by contractor and sort by reaction scores
      const contractorGroups: Record<string, any[]> = {};
      projectsArray.forEach((project: any) => {
        if (!contractorGroups[project.contractor]) {
          contractorGroups[project.contractor] = [];
        }
        contractorGroups[project.contractor].push(project);
      });

      // Sort projects within each contractor group by reaction score
      Object.keys(contractorGroups).forEach(contractor => {
        contractorGroups[contractor].sort((a: any, b: any) => b.averageReactionScore - a.averageReactionScore);
      });

      // Sort contractors by their best project's reaction score
      const sortedContractors = Object.keys(contractorGroups)
        .map(contractor => ({
          contractor,
          projects: contractorGroups[contractor],
          bestScore: contractorGroups[contractor][0]?.averageReactionScore || 0
        }))
        .sort((a, b) => b.bestScore - a.bestScore);

      res.json(sortedContractors);
    } catch (error) {
      console.error('Error fetching projects by reactions:', error);
      res.status(500).json({ error: "Failed to fetch projects by reactions" });
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
        projects,
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
      const validatedUploadProjects = z
        .array(uploadProjectSchema)
        .parse(projectsArray);

      // Filter out projects with null required values and convert to insert format
      const insertProjects = validatedUploadProjects
        .filter(
          (project) =>
            project.latitude !== null &&
            project.longitude !== null &&
            project.cost !== null,
        )
        .map((project) => ({
          ...project,
          latitude: project.latitude!.toString(),
          longitude: project.longitude!.toString(),
          cost: project.cost!.toString(),
        }));

      const projects = await storage.createProjects(insertProjects);
      const skippedCount =
        validatedUploadProjects.length - insertProjects.length;

      res.json({
        message: `Successfully uploaded ${projects.length} projects${skippedCount > 0 ? ` (${skippedCount} projects skipped due to missing coordinates or cost)` : ""}`,
        projects,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res
        .status(400)
        .json({
          error: "Failed to process uploaded file",
          details: error instanceof Error ? error.message : error,
        });
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
      const validatedUploadProjects = z
        .array(uploadProjectSchema)
        .parse(projectsArray);

      // Filter out projects with null required values and convert to insert format
      const insertProjects = validatedUploadProjects
        .filter(
          (project) =>
            project.latitude !== null &&
            project.longitude !== null &&
            project.cost !== null,
        )
        .map((project) => ({
          ...project,
          latitude: project.latitude!.toString(),
          longitude: project.longitude!.toString(),
          cost: project.cost!.toString(),
        }));

      const projects = await storage.createProjects(insertProjects);
      const skippedCount =
        validatedUploadProjects.length - insertProjects.length;

      res.json({
        message: `Successfully loaded ${projects.length} projects from URL${skippedCount > 0 ? ` (${skippedCount} projects skipped due to missing coordinates or cost)` : ""}`,
        projects,
      });
    } catch (error) {
      res
        .status(400)
        .json({ error: "Failed to load data from URL", details: error });
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

  // Get analytics with optional filters
  app.get("/api/analytics", async (req, res) => {
    try {
      const analytics = await storage.getAnalytics(req.query);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Get authentication settings
  app.get("/api/auth/settings", async (req, res) => {
    try {
      // Initialize default settings if they don't exist
      const defaultSettings = [
        {
          key: "facebook_login_enabled",
          value: true,
          description: "Enable Facebook OAuth authentication",
        },
        {
          key: "google_login_enabled",
          value: true,
          description: "Enable Google OAuth authentication",
        },
        {
          key: "twitter_login_enabled",
          value: true,
          description: "Enable X (formerly Twitter) OAuth authentication",
        },
      ];

      for (const setting of defaultSettings) {
        await db.insert(settings).values(setting).onConflictDoNothing();
      }

      // Fetch current settings
      const authSettings = await db
        .select()
        .from(settings)
        .where(
          or(
            eq(settings.key, "facebook_login_enabled"),
            eq(settings.key, "google_login_enabled"),
            eq(settings.key, "twitter_login_enabled"),
          ),
        );

      const settingsObj = authSettings.reduce(
        (acc, setting) => {
          acc[setting.key] = setting.value;
          return acc;
        },
        {} as Record<string, any>,
      );

      res.json(settingsObj);
    } catch (error) {
      console.error("Error fetching auth settings:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch authentication settings" });
    }
  });

  // Reaction routes

  // Get reactions for a project

  app.get("/api/projects/:projectId/reactions", async (req, res) => {
    try {
      const projectReactions = await db
        .select({
          id: reactions.id,
          rating: reactions.rating,
          comment: reactions.comment,
          isProximityVerified: reactions.isProximityVerified,
          createdAt: reactions.created_at,
          user: {
            id: users.id,
            name: users.name,
            username: users.username,
            avatar: users.avatar,
            isLocationVerified: users.isLocationVerified,
          },
        })
        .from(reactions)
        .leftJoin(users, eq(reactions.userId, users.id))
        .where(eq(reactions.projectId, req.params.projectId));

      res.json(projectReactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reactions" });
    }
  });

  // Add or update reaction (requires authentication)
  app.post(
    "/api/projects/:projectId/reactions",
    requireAuth,
    async (req, res) => {
      try {
        const userId = (req.user as any).id;
        const { rating, comment, userLocation } = req.body;

        // If user location is provided, update user's location record
        if (userLocation?.latitude && userLocation?.longitude) {
          try {
            await db
              .insert(userLocations)
              .values({
                userId,
                latitude: userLocation.latitude.toString(),
                longitude: userLocation.longitude.toString(),
                address: "Current Location",
              })
              .onConflictDoUpdate({
                target: userLocations.userId,
                set: {
                  latitude: userLocation.latitude.toString(),
                  longitude: userLocation.longitude.toString(),
                },
              });

            // Update user's location verification status
            await db
              .update(users)
              .set({
                isLocationVerified: true,
                lastLocationUpdate: new Date(),
              })
              .where(eq(users.id, userId));
          } catch (locationError) {
            console.error("Failed to update user location:", locationError);
          }
        }

        // Get user details for email bypass check
        const currentUser = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        const isAdminUser =
          currentUser.length > 0 &&
          currentUser[0].email === "janmvtrinidad@gmail.com";

        // Calculate proximity verification if both project and user locations are available
        let isProximityVerified = false;
        let proximityDetails = null;

        if (userLocation?.latitude && userLocation?.longitude) {
          try {
            // Get project details for proximity calculation
            const projectData = await db
              .select()
              .from(projects)
              .where(eq(projects.id, req.params.projectId))
              .limit(1);

            if (projectData.length > 0) {
              const projectLat = parseFloat(projectData[0].latitude);
              const projectLng = parseFloat(projectData[0].longitude);
              const userLat = userLocation.latitude;
              const userLng = userLocation.longitude;

              // Calculate distance (Haversine formula for better accuracy)
              const R = 6371; // Earth's radius in kilometers
              const dLat = (userLat - projectLat) * (Math.PI / 180);
              const dLon = (userLng - projectLng) * (Math.PI / 180);
              const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(projectLat * (Math.PI / 180)) *
                  Math.cos(userLat * (Math.PI / 180)) *
                  Math.sin(dLon / 2) *
                  Math.sin(dLon / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              const distance = R * c; // Distance in km
              const distanceInMeters = distance * 1000;

              proximityDetails = {
                distance: distanceInMeters,
                required: 500, // 500 meters
                projectLocation: { lat: projectLat, lng: projectLng },
                userLocation: { lat: userLat, lng: userLng },
              };

              // Bypass proximity check for admin user or consider verified if within 500 meters (0.5km)
              isProximityVerified = isAdminUser || distance <= 0.5;
            }
          } catch (proximityError) {
            console.error("Failed to calculate proximity:", proximityError);
          }
        } else if (isAdminUser) {
          // Admin user can rate without location
          isProximityVerified = true;
        }

        // Check if user already has a reaction for this project
        const existingReaction = await db
          .select()
          .from(reactions)
          .where(
            and(
              eq(reactions.userId, userId),
              eq(reactions.projectId, req.params.projectId),
            ),
          )
          .limit(1);

        let reaction;
        if (existingReaction.length > 0) {
          // Update existing reaction
          reaction = await db
            .update(reactions)
            .set({
              rating,
              comment,
              isProximityVerified,
              updated_at: new Date(),
            })
            .where(eq(reactions.id, existingReaction[0].id))
            .returning();
        } else {
          // Create new reaction
          reaction = await db
            .insert(reactions)
            .values({
              userId,
              projectId: req.params.projectId,
              rating,
              comment,
              isProximityVerified,
            })
            .returning();
        }

        // Check proximity requirements before saving (unless admin user)
        if (
          userLocation &&
          proximityDetails &&
          !isProximityVerified &&
          !isAdminUser
        ) {
          return res.status(400).json({
            error: "Proximity verification failed",
            details: {
              message: `You must be within ${proximityDetails.required}m of the project to rate it`,
              distance: Math.round(proximityDetails.distance),
              required: proximityDetails.required,
              actualDistance: `${Math.round(proximityDetails.distance)}m`,
              tooFar: true,
            },
          });
        }

        res.json({
          ...reaction[0],
          proximityVerified: isProximityVerified,
          locationCaptured: !!userLocation,
          proximityDetails,
          isAdminBypass: isAdminUser && !proximityDetails,
        });
      } catch (error) {
        console.error("Reaction save error:", error);
        res
          .status(500)
          .json({
            error:
              "Failed to save reaction" + (error as any)?.message?.toString(),
          });
      }
    },
  );

  // Update user location for proximity verification
  app.post("/api/user/location", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { latitude, longitude, address } = req.body;

      // Save user location
      const userLocation = await db
        .insert(userLocations)
        .values({
          userId,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          address,
        })
        .returning();

      // Update user's location verification status
      await db
        .update(users)
        .set({
          isLocationVerified: true,
          lastLocationUpdate: new Date(),
        })
        .where(eq(users.id, userId));

      res.json(userLocation[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to update location" });
    }
  });

  // Calculate proximity and verify reactions
  app.post(
    "/api/reactions/:reactionId/verify-proximity",
    requireAuth,
    async (req, res) => {
      try {
        const userId = (req.user as any).id;
        const reactionId = req.params.reactionId;

        // Get reaction details
        const reactionData = await db
          .select()
          .from(reactions)
          .where(
            and(eq(reactions.id, reactionId), eq(reactions.userId, userId)),
          )
          .limit(1);

        if (reactionData.length === 0) {
          return res.status(404).json({ error: "Reaction not found" });
        }

        // Get project details
        const projectData = await db
          .select()
          .from(projects)
          .where(eq(projects.id, reactionData[0].projectId))
          .limit(1);

        if (projectData.length === 0) {
          return res.status(404).json({ error: "Project not found" });
        }

        // Get user's latest location
        const userLocation = await db
          .select()
          .from(userLocations)
          .where(eq(userLocations.userId, userId))
          .orderBy(userLocations.created_at)
          .limit(1);

        if (userLocation.length === 0) {
          return res.status(400).json({ error: "User location not available" });
        }

        // Calculate distance (simplified - you might want to use a more accurate calculation)
        const projectLat = parseFloat(projectData[0].latitude);
        const projectLng = parseFloat(projectData[0].longitude);
        const userLat = parseFloat(userLocation[0].latitude);
        const userLng = parseFloat(userLocation[0].longitude);

        const distance = Math.sqrt(
          Math.pow(projectLat - userLat, 2) + Math.pow(projectLng - userLng, 2),
        );

        // Consider verified if within ~0.005 degrees (roughly 500 meters)
        const isProximityVerified = distance < 0.005;

        // Update reaction
        const updatedReaction = await db
          .update(reactions)
          .set({ isProximityVerified })
          .where(eq(reactions.id, reactionId))
          .returning();

        res.json({
          verified: isProximityVerified,
          distance: distance * 111, // Convert to approximate km
          reaction: updatedReaction[0],
        });
      } catch (error) {
        res.status(500).json({ error: "Failed to verify proximity" });
      }
    },
  );

  // Export projects as CSV
  app.get("/api/projects/export/csv", async (req, res) => {
    try {
      const filters = filtersSchema.parse(req.query);
      const projects = await storage.getProjects(filters);

      // Generate CSV
      const headers = [
        "ID",
        "Project Name",
        "Location",
        "Latitude",
        "Longitude",
        "Contractor",
        "Cost",
        "Start Date",
        "Completion Date",
        "Fiscal Year",
        "Region",
        "Status",
        "Other Details",
      ];

      const csvRows = [
        headers.join(","),
        ...projects.map((p) =>
          [
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
            p.other_details ? `"${p.other_details.replace(/"/g, '""')}"` : "",
          ].join(","),
        ),
      ];

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="projects.csv"',
      );
      res.send(csvRows.join("\n"));
    } catch (error) {
      res.status(500).json({ error: "Failed to export CSV" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
