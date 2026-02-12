CREATE TABLE "cell_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer NOT NULL,
	"cell_type_id" integer NOT NULL,
	"x" integer NOT NULL,
	"y" integer NOT NULL,
	CONSTRAINT "unique_template_coordinates" UNIQUE("template_id","x","y")
);
--> statement-breakpoint
CREATE TABLE "cell_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"color" text NOT NULL,
	"icon" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matrix_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"size" integer NOT NULL,
	"x_title" text NOT NULL,
	"y_title" text NOT NULL,
	"project_id" integer
);
--> statement-breakpoint
ALTER TABLE "cell_mappings" ADD CONSTRAINT "cell_mappings_template_id_matrix_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."matrix_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cell_mappings" ADD CONSTRAINT "cell_mappings_cell_type_id_cell_types_id_fk" FOREIGN KEY ("cell_type_id") REFERENCES "public"."cell_types"("id") ON DELETE no action ON UPDATE no action;