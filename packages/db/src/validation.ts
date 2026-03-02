import { createInsertSchema } from 'drizzle-zod';
import { projects } from './schema/projects';
import { z } from 'zod';

export const insertProjectSchema = createInsertSchema(projects, {
  name: (schema) => schema.min(3, "Le nom doit faire au moins 3 caractères"),
  description: (schema) => schema.optional(),
});

export const insertMatrixSchema = z.object({
  projectId: z.number(),
  name: z.string().min(1),
  size: z.number(),
  xTitle: z.string(),
  yTitle: z.string(),
  riskLevels: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      color: z.string().min(1), 
    })
  ),
  matrixData: z.record(z.string(), z.string()), 
});

export const updateMatrixSchema = insertMatrixSchema.extend({
  projectId: z.number().optional(),
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertMatrix = z.infer<typeof insertMatrixSchema>;
export type UpdateMatrix = z.infer<typeof updateMatrixSchema>;