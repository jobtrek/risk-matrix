import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/hooks/useMatrix";
import { MatrixPreview } from "@/components/matrix-preview";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SpinnerButton } from "@/components/spinner-button";

type MatrixSearch = {
  highlight?: number;
};

export const Route = createFileRoute("/matrixs/")({
  validateSearch: (search: Record<string, unknown>): MatrixSearch => {
    // si j'ai un param hl : convertir en number, sinon undefined
    return {
      highlight: search.highlight ? Number(search.highlight) : undefined,
    };
  },
  loader: async () => {
    // Récup matirces depuis le loader
    const { data, error } = await api.matrix.all.get();
    if (error) throw new Error("Impossible load matrix");
    return { matrices: data };
  },
  component: MatrixSettings,
});

function MatrixSettings() {
  // Récup data + param hl depuis route
  const data = Route.useLoaderData();
  const { highlight } = Route.useSearch();

  // si hl: scroll vers élém
  useEffect(() => {
    if (highlight) {
      const timeoutId = setTimeout(() => {
        const element = document.getElementById(`matrix-${highlight}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        } 
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [highlight]);


  // si pas data ou matrix : loading
  if (!data || !data.matrices) return <SpinnerButton />;

  const { matrices } = data;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Matrix Templates</CardTitle>
          <CardDescription>
            Visual overview of your saved grids.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {matrices.map((matrix) => {
              const isHighlighted = matrix.id === highlight;
              return (
                <Link
                  to={`/matrixs/${matrix.id}`}
                  key={matrix.id}
                  id={`matrix-${matrix.id}`}
                  className="block"
                >
                  <div
                    className={cn(
                      "flex items-center justify-between p-4 border rounded-xl transition-all group",
                      isHighlighted
                        ? "border-primary ring-1 ring-primary bg-primary/5"
                        : "hover:bg-accent/50",
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <MatrixPreview
                        size={matrix.size}
                        className="w-16 h-16 shadow-sm"
                        data={matrix.cells}
                        riskLevels={matrix.riskLevels}
                      />

                      <div className="flex flex-col gap-1">
                        <span className="font-bold">{matrix.name}</span>
                        <div className="flex gap-2 items-center">
                          <Badge variant="outline" className="text-[10px] h-5">
                            {matrix.size}x{matrix.size}
                          </Badge>
                          <span className="text-xs text-muted-foreground italic">
                            {matrix.xTitle} vs {matrix.yTitle}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button variant="ghost" size="sm" disabled>
                      Edit
                    </Button>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
