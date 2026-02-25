import {
  pgTable,
  text,
  integer,
  unique,
  smallint,
  varchar,
  char,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { projects } from "./projects";

export const matrixTemplates = pgTable("matrix_templates", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  size: smallint("size").notNull(),
  xTitle: text("x_title").notNull(),
  yTitle: text("y_title").notNull(),
  projectId: integer("project_id").references(() => projects.id, {
    onDelete: "cascade",
  }),
});

export const cellTypes = pgTable("cell_types", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: varchar("title", { length: 50}).notNull(),
  color: char("color", { length: 7}).notNull(),
  icon: varchar("icon", {length: 50}).notNull(),
});

export const cellMappings = pgTable(
  "cell_mappings",
  {
id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
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
      table.y,
    ),
  }),
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