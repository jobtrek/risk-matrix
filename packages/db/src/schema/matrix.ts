import {
  pgTable,
  serial,
  text,
  integer,
  unique, // Ajout de l'import nécessaire
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const matrixTemplates = pgTable("matrix_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  size: integer("size").notNull(),
  xTitle: text("x_title").notNull(),
  yTitle: text("y_title").notNull(),
  projectId: integer("project_id"),
});

export const cellTypes = pgTable("cell_types", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  color: text("color").notNull(),
  icon: text("icon").notNull(),
});

export const cellMappings = pgTable(
  "cell_mappings",
  {
    id: serial("id").primaryKey(),
    templateId: integer("template_id")
      .notNull()
      .references(() => matrixTemplates.id, { onDelete: "cascade" }),
    cellTypeId: integer("cell_type_id")
      .notNull()
      .references(() => cellTypes.id),
    x: integer("x").notNull(),
    y: integer("y").notNull(),
  },
  (table) => ({
    uniqueCoordinates: unique("unique_template_coordinates").on(
      table.templateId,
      table.x,
      table.y
    ),
  })
);

export const matrixTemplatesRelations = relations(
  matrixTemplates,
  ({ many }) => ({
    mappings: many(cellMappings),
  }),
);

export const cellMappingsRelations = relations(cellMappings, ({ one }) => ({
  template: one(matrixTemplates, {
    fields: [cellMappings.templateId],
    references: [matrixTemplates.id],
  }),
  type: one(cellTypes, {
    fields: [cellMappings.cellTypeId],
    references: [cellTypes.id],
  }),
}));