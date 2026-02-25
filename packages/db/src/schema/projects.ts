import { pgTable, integer, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const projects = pgTable("projects", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
});

export const evaluationSessions = pgTable("evaluation_sessions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),
});

export const projectsRelations = relations(projects, ({ many }) => ({
  sessions: many(evaluationSessions),
}));

export const evaluationSessionsRelations = relations(evaluationSessions, ({ one }) => ({
  project: one(projects, {
    fields: [evaluationSessions.projectId],
    references: [projects.id],
  }),
}));