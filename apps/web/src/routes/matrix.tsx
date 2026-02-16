import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/matrix")({
  component: PlaygroundComponent,
});

type Cell = { x: number; y: number };

function PlaygroundComponent() {
  const [size, setSize] = useState(5);
  const [selectedCells, setSelectedCells] = useState<Cell[]>([]);
  const [lastClicked, setLastClicked] = useState<Cell | null>(null);

  const handleCellClick = useCallback((x: number, y: number, event: React.MouseEvent) => {
    const isCtrl = event.ctrlKey || event.metaKey;
    const isShift = event.shiftKey;

    if (isShift && lastClicked) {
      const minX = Math.min(lastClicked.x, x);
      const maxX = Math.max(lastClicked.x, x);
      const minY = Math.min(lastClicked.y, y);
      const maxY = Math.max(lastClicked.y, y);

      const newSelection: Cell[] = [];
      for (let i = minX; i <= maxX; i++) {
        for (let j = minY; j <= maxY; j++) {
          newSelection.push({ x: i, y: j });
        }
      }
      setSelectedCells(isCtrl ? [...selectedCells, ...newSelection] : newSelection);
    } 
    else if (isCtrl) {
      const exists = selectedCells.some(c => c.x === x && c.y === y);
      if (exists) {
        setSelectedCells(selectedCells.filter(c => !(c.x === x && c.y === y)));
      } else {
        setSelectedCells([...selectedCells, { x, y }]);
      }
      setLastClicked({ x, y });
    } 
    else {
      setSelectedCells([{ x, y }]);
      setLastClicked({ x, y });
    }
  }, [lastClicked, selectedCells]);

  const isSelected = (x: number, y: number) => 
    selectedCells.some(c => c.x === x && c.y === y);

  // Fonction magique pour calculer les bordures
  const getBorderClasses = (x: number, y: number) => {
    if (!isSelected(x, y)) return "border-border";

    const hasTop = isSelected(x, y + 1);
    const hasBottom = isSelected(x, y - 1);
    const hasLeft = isSelected(x - 1, y);
    const hasRight = isSelected(x + 1, y);

    return cn(
      "border-primary z-20 bg-primary/10",
      // On applique une bordure épaisse seulement s'il n'y a pas de voisin sélectionné
      !hasTop ? "border-t-2" : "border-t-transparent",
      !hasBottom ? "border-b-2" : "border-b-transparent",
      !hasLeft ? "border-l-2" : "border-l-transparent",
      !hasRight ? "border-r-2" : "border-r-transparent"
    );
  };

  return (
    <div className="flex flex-col gap-6 select-none">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Matrix Playground</h1>
          <p className="text-muted-foreground text-sm">Sélection de zone intelligente (Excel Style)</p>
        </div>
        <div className="flex gap-2">
           <Badge variant="outline">{selectedCells.length} cellules</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Aperçu de la Matrice</CardTitle>
            <button 
              onClick={() => setSelectedCells([])}
              className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              Réinitialiser
            </button>
          </CardHeader>
          <CardContent className="flex aspect-square max-h-[600px] items-center justify-center p-4">
            <div 
              className="grid w-full h-full border border-border bg-muted/20 shadow-inner overflow-hidden"
              style={{ 
                gridTemplateColumns: `repeat(${size}, 1fr)`,
                gridTemplateRows: `repeat(${size}, 1fr)` 
              }}
            >
              {Array.from({ length: size * size }).map((_, i) => {
                const x = (i % size) + 1;
                const y = size - Math.floor(i / size); 
                const selected = isSelected(x, y);

                return (
                  <div
                    key={`${x}-${y}`}
                    onClick={(e) => handleCellClick(x, y, e)}
                    className={cn(
                      "flex items-center justify-center transition-all duration-75 cursor-cell text-[10px] font-semibold border-collapse",
                      // Si pas sélectionné, on met une bordure fine standard
                      !selected ? "border border-border/40 hover:bg-accent hover:z-10" : "",
                      // Si sélectionné, on appelle notre logique de bordure de bloc
                      getBorderClasses(x, y)
                    )}
                  >
                    <span className={cn(selected ? "text-primary" : "text-muted-foreground/50")}>
                      {x},{y}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Taille de grille</span>
                  <span className="text-muted-foreground font-mono">{size}x{size}</span>
                </div>
                <Slider 
                  value={[size]} min={3} max={5} step={1} 
                  onValueChange={(v) => {
                    setSize(v[0]);
                    setSelectedCells([]);
                  }} 
                />
              </div>

              <Separator />

              <Tabs defaultValue="colors">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="colors">Couleurs</TabsTrigger>
                  <TabsTrigger value="labels">Edition</TabsTrigger>
                </TabsList>
                <TabsContent value="colors" className="py-4 space-y-4">
                   {selectedCells.length > 0 ? (
                     <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-3 border rounded-lg bg-accent/50 text-center">
                          <p className="text-xs font-bold text-accent-foreground uppercase tracking-wider">
                            Zone active : {selectedCells.length} cases
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button className="h-12 w-full bg-green-500/80 hover:bg-green-500 rounded-md border border-black/5 transition-all active:scale-95 shadow-sm" />
                          <button className="h-12 w-full bg-yellow-400/80 hover:bg-yellow-400 rounded-md border border-black/5 transition-all active:scale-95 shadow-sm" />
                          <button className="h-12 w-full bg-orange-500/80 hover:bg-orange-500 rounded-md border border-black/5 transition-all active:scale-95 shadow-sm" />
                          <button className="h-12 w-full bg-red-600/80 hover:bg-red-600 rounded-md border border-black/5 transition-all active:scale-95 shadow-sm" />
                        </div>
                     </div>
                   ) : (
                     <div className="text-center py-10 border-2 border-dashed rounded-xl bg-muted/5">
                        <p className="text-xs text-muted-foreground px-4">
                          Sélectionnez une zone sur la matrice pour appliquer une règle de risque.
                        </p>
                     </div>
                   )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}