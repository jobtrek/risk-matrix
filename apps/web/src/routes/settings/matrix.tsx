import { createFileRoute } from "@tanstack/react-router";
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

export const Route = createFileRoute("/settings/matrix")({
  loader: async () => {
    const { data, error } = await api.matrix.all.get();
    if (error) throw new Error("Impossible load matrix");
    return { matrices: data };
  },
  component: MatrixSettings,
});

function MatrixSettings() {
  const data = Route.useLoaderData();
  if (!data || !data.matrices) return <div>Loading...</div>;

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
            {matrices.map((matrix) => (
              <div
                key={matrix.id}
                className="flex items-center justify-between p-4 border rounded-xl hover:bg-accent/50 transition-all group"
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

                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
