import { createInsertSchema } from 'drizzle-zod';
import { projects } from './schema/projects';
import { matrixTemplates } from './schema/matrix';
import { z } from 'zod';

const riskLevelSchema = z.object({
  id: z.number(),
  label: z.string(),
  color: z.string()
})

export const insertProjectSchema = createInsertSchema(projects, {
  name: (schema) => schema.min(3, "Le nom doit faire au moins 3 caractères"),
  description: (schema) => schema.nullable().default(""),
});

export const insertMatrixSchema = createInsertSchema(matrixTemplates, {
  name: (schema) => schema.min(3, "Le nom doit faire au moins 3 caractères"),
  size: (schema) => schema.min(1, "La taille doit être au moins 1"),
  xTitle: (schema) => schema.min(1, "Le titre X doit être au moins 1 caractère"),
  yTitle: (schema) => schema.min(1, "Le titre Y doit être au moins 1 caractère"),
  projectId: (schema) => schema.optional(),
}).extend({
  riskLevels: z.array(riskLevelSchema),
  matrixData: z.record(z.string(), z.string()),
})

export const updateMatrixSchema = insertMatrixSchema.extend({
  projectId: z.number().optional(),
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertMatrix = z.infer<typeof insertMatrixSchema>;
export type UpdateMatrix = z.infer<typeof updateMatrixSchema>;