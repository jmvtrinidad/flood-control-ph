import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectname: text("projectname").notNull(),
  location: text("location").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  contractor: text("contractor").notNull(),
  cost: decimal("cost", { precision: 15, scale: 2 }).notNull(),
  start_date: text("start_date"),
  completion_date: text("completion_date"),
  fy: text("fy").notNull(), // Fiscal year
  region: text("region").notNull(),
  other_details: text("other_details"),
  status: text("status").default("active"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Schema for JSON uploads that handles numeric values properly, including nulls
export const uploadProjectSchema = z.object({
  projectname: z.string(),
  location: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  contractor: z.string(),
  cost: z.number().nullable(),
  start_date: z.string().optional(),
  completion_date: z.string().optional(),
  fy: z.string(),
  region: z.string(),
  other_details: z.string().optional(),
  status: z.string().optional().default("active"),
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type UploadProject = z.infer<typeof uploadProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Filters schema
export const filtersSchema = z.object({
  search: z.string().optional(),
  minCost: z.number().optional(),
  maxCost: z.number().optional(),
  region: z.string().optional(),
  contractor: z.string().optional(),
  fiscalYear: z.string().optional(),
  location: z.string().optional(),
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  dateRange: z.string().optional(), // For predefined ranges like "12months"
  useFullCostForJointVentures: z.boolean().optional(), // Use full cost instead of dividing for joint ventures
});

export type ProjectFilters = z.infer<typeof filtersSchema>;
