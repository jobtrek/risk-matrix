import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { api } from "@/hooks/useMatrix";
import { MatrixPreview } from "@/components/matrix-preview";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SpinnerButton } from "@/components/spinner-button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { Folder, FileQuestion, ChevronRight } from "lucide-react";

type MatrixSearch = {
  highlight?: number;
};

export const Route = createFileRoute("/_authenticated/projects/")({
  validateSearch: (search: Record<string, unknown>): MatrixSearch => {
    return {
      highlight: search.highlight ? Number(search.highlight) : undefined,
    };
  },
  loader: async () => {
    const [matrixRes, projectRes] = await Promise.all([
      api.matrix.all.get(),
      api.projects.get(),
    ]);

    if (matrixRes.error || projectRes.error) {
      throw new Error("Impossible de charger les données");
    }

    const matrices = Array.isArray(matrixRes.data) ? matrixRes.data : [];
    const projects = projectRes.data || [];

    const grouped: Record<
      string,
      { name: string; matrices: any[]; isDefault?: boolean }
    > = {};

    projects.forEach((p) => {
      grouped[p.id.toString()] = { name: p.name, matrices: [] };
    });

    grouped["unassigned"] = { name: "Matrices hors projet", matrices: [], isDefault: true };

    matrices.forEach((m) => {
      const key = m.projectId ? m.projectId.toString() : "unassigned";
      if (grouped[key]) {
        grouped[key].matrices.push(m);
      } else {
        grouped["unassigned"].matrices.push(m);
      }
    });

    return { groupedMatrices: grouped };
  },
  component: MatrixSettings,
});

function MatrixSettings() {
  const { groupedMatrices } = Route.useLoaderData();
  const { highlight } = Route.useSearch();
  const highlightedRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (highlight && highlightedRef.current) {
      const timeoutId = setTimeout(() => {
        highlightedRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [highlight, groupedMatrices]);

  if (!groupedMatrices) return <SpinnerButton />;

  const defaultOpen = highlight
    ? Object.keys(groupedMatrices).filter((key) =>
        groupedMatrices[key].matrices.some((m: any) => m.id === highlight),
      )
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Bibliothèque de Matrices
          </h1>
          <p className="text-muted-foreground text-sm">
            Gérez vos modèles de risques par projet.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/projects/create">Nouveau Projet</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/matrixs/create">Nouvelle Matrice</Link>
          </Button>
        </div>
      </div>

      <Accordion
        type="multiple"
        defaultValue={defaultOpen}
        className="w-full space-y-4"
      >
        {Object.entries(groupedMatrices).map(([id, group]) => {
          if (id === "unassigned" && group.matrices.length === 0) return null;

          return (
            <AccordionItem
              key={id}
              value={id}
              className="border rounded-xl px-4 bg-card shadow-sm overflow-hidden"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-4 text-left">
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      group.isDefault
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    {group.isDefault ? (
                      <FileQuestion size={20} />
                    ) : (
                      <Folder size={20} />
                    )}
                  </div>
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="font-semibold text-base leading-tight">
                      {group.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {group.matrices.length} matrices
                    </span>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="pt-0 pb-4">
                <div className="grid gap-3 pt-2">
                  {group.matrices.length > 0 ? (
                    group.matrices.map((matrix) => {
                      const isHighlighted = matrix.id === highlight;
                      return (
                        <Link
                          to="/matrixs/$id"
                          params={{ id: String(matrix.id) }}
                          key={matrix.id}
                          ref={isHighlighted ? highlightedRef : null}
                          className="block"
                        >
                          <div
                            className={cn(
                              "flex items-center justify-between p-3 border rounded-lg transition-all group",
                              isHighlighted
                                ? "border-primary ring-1 ring-primary bg-primary/5"
                                : "hover:bg-accent/50",
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <MatrixPreview
                                size={matrix.size}
                                className="w-12 h-12 shadow-sm rounded-md"
                                data={matrix.cells}
                                riskLevels={matrix.riskLevels}
                              />
                              <div className="flex flex-col">
                                <span className="font-bold text-sm">
                                  {matrix.name}
                                </span>
                                <div className="flex gap-2 items-center text-[11px]">
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1 h-4"
                                  >
                                    {matrix.size}x{matrix.size}
                                  </Badge>
                                  <span className="text-muted-foreground truncate max-w-[150px]">
                                    {matrix.xTitle} / {matrix.yTitle}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <ChevronRight
                              size={16}
                              className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="py-6 border border-dashed rounded-lg flex flex-col items-center justify-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        Aucune matrice dans ce projet.
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        asChild
                      >
                        <Link to="/matrixs/create">Ajouter une matrice</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
