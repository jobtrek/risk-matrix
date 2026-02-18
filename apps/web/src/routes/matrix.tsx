import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  CheckCircle2,
  Plus,
  CircleDashed,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/hooks/useMatrix";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/matrix")({
  component: PlaygroundComponent,
});

type RiskLevel = {
  id: string;
  label: string;
  color: string;
  icon: LucideIcon;
};

type Cell = { x: number; y: number };

function PlaygroundComponent() {
  const [size, setSize] = useState(5);

  const [riskLevels, setRiskLevels] = useState<RiskLevel[]>([
    { id: "1", label: "Ok", color: "bg-green-300", icon: CheckCircle2 },
    {
      id: "2",
      label: "Acceptable",
      color: "bg-yellow-300",
      icon: CircleDashed,
    },
    { id: "3", label: "Tolerable", color: "bg-orange-300", icon: CircleDashed },
    { id: "4", label: "Critical", color: "bg-red-300", icon: CircleDashed },
    { id: "5", label: "Intolerable", color: "bg-red-900", icon: XCircle },
  ]);

  const [matrixData, setMatrixData] = useState<Record<string, string>>({});
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());

  const [lastClicked, setLastClicked] = useState<Cell | null>(null);

  const applyRiskLevel = (levelId: string) => {
    const newData = { ...matrixData };
    selectedCells.forEach((key) => {
      newData[key] = levelId;
    });
    setMatrixData(newData);
  };

  const updateLevelLabel = (id: string, newLabel: string) => {
    setRiskLevels((prev) =>
      prev.map((l) => (l.id === id ? { ...l, label: newLabel } : l)),
    );
  };

  const handleCellClick = useCallback(
    (x: number, y: number, event: React.MouseEvent) => {
      const isCtrl = event.ctrlKey || event.metaKey;
      const isShift = event.shiftKey;
      const cellKey = `${x}-${y}`;

      if (isShift && lastClicked) {
        const minX = Math.min(lastClicked.x, x);
        const maxX = Math.max(lastClicked.x, x);
        const minY = Math.min(lastClicked.y, y);
        const maxY = Math.max(lastClicked.y, y);

        const newSelection = isCtrl
          ? new Set(selectedCells)
          : new Set<string>();
        for (let i = minX; i <= maxX; i++) {
          for (let j = minY; j <= maxY; j++) {
            newSelection.add(`${i}-${j}`);
          }
        }
        setSelectedCells(newSelection);
      } else if (isCtrl) {
        const next = new Set(selectedCells);
        if (next.has(cellKey)) {
          next.delete(cellKey);
        } else {
          next.add(cellKey);
        }
        setSelectedCells(next);
        setLastClicked({ x, y });
      } else {
        setSelectedCells(new Set([cellKey]));
        setLastClicked({ x, y });
      }
    },
    [lastClicked, selectedCells],
  );

  const saveMatrix = async () => {
    const { data, error } = await api.matrix.create.post({
      name: "Ma Matrice Complète",
      size: size,
      xTitle: "Vraisemblance",
      yTitle: "Impact",
      riskLevels: riskLevels.map((rl) => ({
        id: rl.id,
        label: rl.label,
        color: rl.color,
      })),

      matrixData: matrixData,
    });

    if (error) {
      toast.error("Failed to save matrix");
      console.error("Erreur détaillée:", error.value);
      return;
    }

    console.log("Tout a été sauvegardé (Template + Levels + Cells) !", data);
  };

  const isSelected = useCallback(
    (x: number, y: number) => selectedCells.has(`${x}-${y}`),
    [selectedCells],
  );

  const getBorderClasses = (x: number, y: number) => {
    if (!isSelected(x, y)) return "border-border";
    const hasTop = isSelected(x, y + 1);
    const hasBottom = isSelected(x, y - 1);
    const hasLeft = isSelected(x - 1, y);
    const hasRight = isSelected(x + 1, y);

    return cn(
      "border-primary z-20",
      !hasTop ? "border-t-2" : "border-t-transparent",
      !hasBottom ? "border-b-2" : "border-b-transparent",
      !hasLeft ? "border-l-2" : "border-l-transparent",
      !hasRight ? "border-r-2" : "border-r-transparent",
    );
  };

  return (
    <div className="flex flex-col gap-6 select-none">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Matrix Playground
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage axes and risk levels.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">{selectedCells.size} cells</Badge>

          <button
            onClick={() => {
              setSelectedCells(new Set());
              setMatrixData({});
            }}
            className="text-xs text-muted-foreground hover:text-destructive underline"
          >
            Reset
          </button>

         <Button onClick={saveMatrix} size="sm">
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-3 overflow-hidden">
          <CardContent className="flex items-center justify-center p-12">
            <div className="relative flex flex-col gap-2">
              <div className="flex gap-4">
                <div className="flex">
                  <div className="h-full flex items-center justify-center w-8">
                    <Badge className="bg-black text-white px-4 py-0 -translate-y-1/2 -rotate-90">
                      Vraisemblance
                    </Badge>
                  </div>

                  <div className="h-full w-4 border-r-2 border-dashed border-muted-foreground/30 mr-1" />
                </div>

                <div
                  className="grid border border-border bg-muted/20 shadow-inner overflow-hidden"
                  style={{
                    gridTemplateColumns: `repeat(${size}, 1fr)`,
                    gridTemplateRows: `repeat(${size}, 1fr)`,
                    width: "500px",
                    height: "500px",
                  }}
                >
                  {Array.from({ length: size * size }).map((_, i) => {
                    const x = (i % size) + 1;
                    const y = size - Math.floor(i / size);
                    const selected = isSelected(x, y);
                    const cellKey = `${x}-${y}`;
                    const levelId = matrixData[cellKey];
                    const currentLevel = riskLevels.find(
                      (l) => l.id === levelId,
                    );
                    const cellColor = currentLevel?.color || "bg-background";

                    return (
                      <TooltipProvider key={cellKey}>
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger asChild>
                            <div
                              onClick={(e) => handleCellClick(x, y, e)}
                              className={cn(
                                "flex items-center justify-center transition-all duration-75 cursor-cell text-[10px] font-semibold border-collapse relative",
                                cellColor,
                                selected &&
                                  "after:absolute after:inset-0 after:bg-white/20 after:pointer-events-none",
                                !selected
                                  ? "border border-border/40 hover:bg-accent group"
                                  : "",
                                getBorderClasses(x, y),
                              )}
                            ></div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="text-[15px] p-2"
                          >
                            <div className="flex flex-col gap-1">
                              <p className="font-bold">
                                Cell: {x}, {y}
                              </p>
                              {currentLevel?.label && (
                                <p className="flex items-center gap-2">
                                  Risk:
                                  <span
                                    className={cn(
                                      "px-1 rounded text-white",
                                      currentLevel?.color || "bg-muted",
                                    )}
                                  >
                                    <span className="invert">
                                      {currentLevel?.label}
                                    </span>
                                  </span>
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end mt-2">
                <div className="w-[500px]">
                  <div className="w-full h-2 border-t-2 border-dashed border-muted-foreground/30 mb-1" />

                  <div className="flex justify-center mt-2">
                    <Badge className="bg-black text-white px-4 py-0">
                      Impact
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Color Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-muted-foreground">
                    Grid Size
                  </span>
                  <span className="font-mono">
                    {size}x{size}
                  </span>
                </div>
                <Slider
                  value={[size]}
                  min={3}
                  max={5}
                  step={1}
                  onValueChange={(v) => {
                    setSize(v[0]);
                    setSelectedCells(new Set());
                  }}
                />
              </div>
              <Separator />
              <Tabs defaultValue="levels">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="levels">Levels</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                <TabsContent value="levels" className="pt-4 space-y-2">
                  <div className="flex items-center gap-3 px-3 py-2 text-muted-foreground opacity-50 cursor-not-allowed">
                    <Plus className="size-5 border-2 border-dashed rounded-full p-0.5" />
                    <span className="text-sm">Create</span>
                  </div>
                  <div className="space-y-1.5">
                    {riskLevels.map((level) => (
                      <div
                        key={level.id}
                        onClick={() => applyRiskLevel(level.id)}
                        className={cn(
                          "group flex items-center gap-3 p-2 border rounded-xl transition-all cursor-pointer hover:bg-accent/50",
                          selectedCells.length > 0
                            ? "border-primary/20 ring-1 ring-primary/5"
                            : "border-transparent",
                        )}
                      >
                        <level.icon className="size-5 text-muted-foreground" />
                        <Input
                          value={level.label}
                          onChange={(e) =>
                            updateLevelLabel(level.id, e.target.value)
                          }
                          className="h-7 border-none bg-transparent p-0 text-sm focus-visible:ring-0 shadow-none font-medium"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div
                          className={cn(
                            "ml-auto size-5 p-2 rounded-sm shadow-sm",
                            level.color,
                          )}
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent
                  value="settings"
                  className="py-10 text-center text-xs text-muted-foreground"
                >
                  Matrix configuration...
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
