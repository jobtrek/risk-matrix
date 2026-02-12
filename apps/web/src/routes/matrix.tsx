import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/matrix")({
  component: PlaygroundComponent,
});

function PlaygroundComponent() {
  const [size, setSize] = useState(5);
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Matrix Playground</h1>
          <p className="text-muted-foreground text-sm">Configurez votre matrice de risque en temps réel.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Aperçu de la Matrice {selectedCell && <span className="text-primary ml-2">({selectedCell.x}, {selectedCell.y})</span>}</CardTitle>
          </CardHeader>
          <CardContent className="flex aspect-square max-h-[600px] items-center justify-center">
            <div 
              className="grid w-full h-full gap-1 border p-1 rounded-lg bg-muted/50"
              style={{ 
                gridTemplateColumns: `repeat(${size}, 1fr)`,
                gridTemplateRows: `repeat(${size}, 1fr)` 
              }}
            >
              {Array.from({ length: size * size }).map((_, i) => {
                const x = (i % size) + 1;
                const y = size - Math.floor(i / size); 
                const isSelected = selectedCell?.x === x && selectedCell?.y === y;

                return (
                  <div
                    key={i}
                    onClick={() => setSelectedCell({ x, y })}
                    className={cn(
                      "flex items-center justify-center bg-background border rounded-sm transition-all cursor-pointer text-[10px] font-medium",
                      isSelected 
                        ? "ring-2 ring-primary border-primary z-10 scale-105 shadow-md" 
                        : "hover:bg-accent border-border text-muted-foreground"
                    )}
                  >
                    {x},{y}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Taille : {size}x{size}</span>
                </div>
                <Slider 
                  value={[size]} 
                  min={3} 
                  max={5} 
                  step={1} 
                  onValueChange={(v) => {
                    setSize(v[0]);
                    setSelectedCell(null);
                  }} 
                />
              </div>

              <Tabs defaultValue="colors">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="colors">Couleurs</TabsTrigger>
                  <TabsTrigger value="labels">Libellés</TabsTrigger>
                </TabsList>
                <TabsContent value="colors" className="py-4 space-y-4">
                   {selectedCell ? (
                     <div className="p-3 border rounded-md bg-muted/20">
                        <p className="text-sm font-medium mb-2">Cellule sélectionnée : {selectedCell.x}, {selectedCell.y}</p>
                        <div className="grid grid-cols-4 gap-2">
                          <div className="h-8 w-full bg-green-500 rounded cursor-pointer border-2 border-transparent hover:border-white" />
                          <div className="h-8 w-full bg-yellow-500 rounded cursor-pointer border-2 border-transparent hover:border-white" />
                          <div className="h-8 w-full bg-orange-500 rounded cursor-pointer border-2 border-transparent hover:border-white" />
                          <div className="h-8 w-full bg-red-500 rounded cursor-pointer border-2 border-transparent hover:border-white" />
                        </div>
                     </div>
                   ) : (
                     <p className="text-xs text-muted-foreground italic">Cliquez sur une cellule pour la modifier.</p>
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