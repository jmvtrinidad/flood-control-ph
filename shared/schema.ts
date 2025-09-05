import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, jsonb, boolean, integer, unique } from "drizzle-orm/pg-core";
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

// Users table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  name: text("name").notNull(),
  username: text("username"), // Optional username for anonymous posting
  avatar: text("avatar"), // Profile picture URL
  provider: text("provider").notNull(), // 'google' or 'facebook'
  providerId: text("provider_id").notNull(), // ID from OAuth provider
  isLocationVerified: boolean("is_location_verified").default(false),
  lastLocationUpdate: timestamp("last_location_update"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// User locations for proximity verification
export const userLocations = pgTable("user_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  address: text("address"),
  verifiedAt: timestamp("verified_at").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
});

// Project reactions
export const reactions = pgTable("reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  projectId: varchar("project_id").references(() => projects.id).notNull(),
  rating: text("rating").notNull(), // 'excellent', 'standard', 'sub-standard', 'ghost'
  comment: text("comment"),
  isProximityVerified: boolean("is_proximity_verified").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userProjectUnique: unique().on(table.userId, table.projectId)
}));

// Schema types
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertReactionSchema = createInsertSchema(reactions).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertUserLocationSchema = createInsertSchema(userLocations).omit({
  id: true,
  created_at: true,
  verifiedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertReaction = z.infer<typeof insertReactionSchema>;
export type Reaction = typeof reactions.$inferSelect;
export type InsertUserLocation = z.infer<typeof insertUserLocationSchema>;
export type UserLocation = typeof userLocations.$inferSelect;

// App settings table
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").unique().notNull(),
  value: jsonb("value").notNull(),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;
