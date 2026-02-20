import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
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
import * as LucideIcons from "lucide-react";
import { api } from "@/hooks/useMatrix";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/matrixs/$id")({
  beforeLoad: async ({ params }) => {
    // si le id est pas un number on redirect 404
    if (isNaN(Number(params.id))) {
      toast.error("Invalid matrix ID");
      throw redirect({ to: "/404" });
    }
  },

  loader: async ({ params }) => {
    const { id } = params;

    try {
      const { data, error } = await api.matrix({ id }).get();

      if (error || !data) {
        toast.error("failed to load matrix data");
        throw redirect({ to: "/404" });
      }

      return { initialData: data };
    } catch (e) {
      toast.error("Failed to fetch matrix data");
      throw redirect({ to: "/404" });
    }
  },

  component: MatrixEditorComponent,
});

type RiskLevel = {
  id: string;
  label: string;
  color: string;
  icon: LucideIcons.LucideIcon;
};

type Cell = { x: number; y: number };

function MatrixEditorComponent() {
  const { initialData } = Route.useLoaderData();
  const { id } = Route.useParams();
  const navigate = Route.useNavigate();

  const [isPending, setIsPending] = useState(false);

  // init initialData
  const [size, setSize] = useState(initialData.size);
  const [matrixName, setMatrixName] = useState(initialData.name);
  const [xAxisTitle, setXAxisTitle] = useState(initialData.xTitle);
  const [yAxisTitle, setYAxisTitle] = useState(initialData.yTitle);
  const [matrixData, setMatrixData] = useState<Record<string, string>>(
    initialData.cells,
  );

  const [riskLevels, setRiskLevels] = useState<RiskLevel[]>(() => {
    // Si risklevels on map pour ajouter les icones
    if (initialData?.riskLevels) {
      return initialData.riskLevels.map((l: any) => ({
        ...l,
        icon: (LucideIcons as any)[l.iconName] || LucideIcons.CircleDashed,
      }));
    }
  });

  // stocke cases cliquées
  // set = bloque doublons, impossible d'avoir deux fois cordonnée "1-2"
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());

  // stocke cordonée denrière cell ({x, y}) pour shift clic
  const [lastClicked, setLastClicked] = useState<Cell | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // initialise la couleur bg-green-300 par défau
  const [newLevelColor, setNewLevelColor] = useState("bg-green-300");

  // peint les cases sélectionnées
  const applyRiskLevel = (levelId: string) => {
    const newData = { ...matrixData };
    selectedCells.forEach((key) => {
      newData[key] = levelId;
    });

    // met a jour les cases
    setMatrixData(newData);
  };

  // renomme le label
  const updateLevelLabel = (id: string, newLabel: string) => {
    // prends les anciens niveaux de risque (prev) et ajoute le nouveau label (grace a l'id)
    setRiskLevels((prev) =>
      prev.map((l) => (l.id === id ? { ...l, label: newLabel } : l)),
    );
  };

  // gère sélection cases (ctrl clic, shift clic)
  const handleCellClick = useCallback(
    (x: number, y: number, event: React.MouseEvent) => {
      const isCtrl = event.ctrlKey || event.metaKey;
      const isShift = event.shiftKey;
      const cellKey = `${x}-${y}`;

      // 3 scénarios :

      // 1. calcule zone entre dernière case cliquée et celle qu'on vient de cliquer
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
      }

      // 2. si on maintien ctrl : si case existante dans set alors on la supprime sinon ajoute
      else if (isCtrl) {
        const next = new Set(selectedCells);
        if (next.has(cellKey)) next.delete(cellKey);
        else next.add(cellKey);
        setSelectedCells(next);
        setLastClicked({ x, y });
      }

      // 3. clic simple
      else {
        setSelectedCells(new Set([cellKey]));
        setLastClicked({ x, y });
      }
    },
    [lastClicked, selectedCells],
  );

  const isSelected = useCallback(
    (x: number, y: number) => selectedCells.has(`${x}-${y}`),
    [selectedCells],
  );

  const getBorderClasses = (x: number, y: number) => {
    // bordure de base si pas sélectionné
    if (!isSelected(x, y)) return "border-border";

    const hasTop = isSelected(x, y + 1);
    const hasBottom = isSelected(x, y - 1);
    const hasLeft = isSelected(x - 1, y);
    const hasRight = isSelected(x + 1, y);

    // z-20 : pour que la bordure passe au déssus des cases
    return cn(
      "border-primary z-20",

      // si cases autour sélectionnées : bordure transparente sinon 2px noir
      !hasTop ? "border-t-2" : "border-t-transparent",
      !hasBottom ? "border-b-2" : "border-b-transparent",
      !hasLeft ? "border-l-2" : "border-l-transparent",
      !hasRight ? "border-r-2" : "border-r-transparent",
    );
  };

  // désactive btn si champs vides
  // trim = supp espaces (" test  " => "test")
  const isFormInvalid =
    !matrixName.trim() ||
    !xAxisTitle.trim() ||
    !yAxisTitle.trim() ||
    Object.keys(matrixData).length === 0;

  const TAILWIND_COLORS = [
    "bg-cyan-400",
    "bg-sky-400",
    "bg-indigo-400",
    "bg-fuchsia-400",
    "bg-purple-400",
    "bg-green-300",
    "bg-lime-300",
    "bg-yellow-300",
    "bg-amber-300",
    "bg-orange-300",
    "bg-red-300",
    "bg-rose-300",
    "bg-pink-300",
    "bg-red-900",
    "bg-black",
  ];

  // sauvegarde matrix
  const saveMatrix = async () => {
    setIsPending(true);

    // appel de put
    const { data, error } = await api.matrix({ id }).put({
      name: matrixName,
      size: size,
      xTitle: xAxisTitle,
      yTitle: yAxisTitle,

      // (rl = risk level)
      riskLevels: riskLevels.map((rl) => ({
        id: rl.id,
        label: rl.label,
        color: rl.color,
      })),
      matrixData: matrixData,
    });

    setIsPending(false);

    if (error) {
      toast.error("Échec de la sauvegarde");
      return;
    }

    // renvoie vers list avec id pour faire higlight et message de succès
    toast.success(`${matrixName} mise à jour !`);
    navigate({ to: "/matrixs", search: { highlight: Number(id) } });
  };

  return (
    <div className="flex flex-col gap-6 select-none">
      <div className="flex items-center justify-between">
        <div>
          <input
            className="text-2xl font-bold tracking-tight bg-transparent border-b-2 border-transparent focus:border-primary focus:outline-none duration-200 p-0 rounded-none"
            value={matrixName}
            onChange={(e) => setMatrixName(e.target.value)}
          />
          <p className="text-muted-foreground text-sm">
            Édition de la matrice #{id}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Badge variant="outline">{selectedCells.size} cells</Badge>
          <button
            onClick={() => {
              setSelectedCells(new Set());
              setMatrixData({});
            }}
            className="text-xs text-muted-foreground hover:text-destructive underline mx-2"
          >
            Reset
          </button>
          <Button
            onClick={saveMatrix}
            size="sm"
            disabled={isPending || isFormInvalid}
          >
            {isPending ? "Saving..." : "Save"}
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
                    <input
                      className="-translate-y-1/2 -rotate-90 bg-black text-white border-none rounded-full px-4 py-0 text-xs focus:outline focus:outline-offset-2 duration-200 text-center"
                      value={yAxisTitle}
                      onChange={(e) => setYAxisTitle(e.target.value)}
                    />
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
                            />
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
                    <input
                      className="bg-black text-white border-none rounded-full px-4 py-0 text-xs focus:outline focus:outline-offset-2 duration-200 text-center"
                      value={xAxisTitle}
                      onChange={(e) => setXAxisTitle(e.target.value)}
                    />
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
                  <div className="flex flex-col p-4 border rounded-xl bg-muted/10 mb-4 transition-all duration-300">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nom du niveau..."
                        className="h-8 text-xs"
                        id="new-level-name"
                        onFocus={() => setIsCreating(true)}
                        onBlur={() =>
                          setTimeout(() => setIsCreating(false), 200)
                        }
                      />
                      <Button
                        size="sm"
                        className="h-8"
                        onClick={() => {
                          const input = document.getElementById(
                            "new-level-name",
                          ) as HTMLInputElement;
                          if (!input.value) return;
                          setRiskLevels([
                            ...riskLevels,
                            {
                              id: Math.random().toString(36).substr(2, 9),
                              label: input.value,
                              color: newLevelColor,
                              icon: LucideIcons.CircleDashed,
                            },
                          ]);
                          input.value = "";
                          setIsCreating(false);
                        }}
                      >
                        <LucideIcons.Plus className="size-4 mr-1" /> Add
                      </Button>
                    </div>

                    <div
                      className={cn(
                        "flex gap-1 flex-wrap transition-all duration-500 transform",
                        isCreating
                          ? "opacity-100 mt-4 translate-y-0 h-auto"
                          : "opacity-0 translate-y-4 h-0 overflow-hidden pointer-events-none",
                      )}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <p className="w-full text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Pick a color
                      </p>
                      {TAILWIND_COLORS.map((color) => (
                        <div
                          key={color}
                          className={cn(
                            "w-6 h-6 rounded-sm cursor-pointer border-2 transition-transform hover:scale-110",
                            color,
                            newLevelColor === color
                              ? "outline outline-2 outline-primary"
                              : "outline-none",
                          )}
                          onClick={() => setNewLevelColor(color)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {riskLevels.map((level) => (
                      <div
                        key={level.id}
                        onClick={() => applyRiskLevel(level.id)}
                        className={cn(
                          "group flex items-center gap-3 p-2 border rounded-xl transition-all cursor-pointer hover:bg-accent/50",
                          selectedCells.size > 0
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
