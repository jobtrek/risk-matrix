import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/hooks/useMatrix";
import { cn } from "@/lib/utils";
import { CheckCircle2, CircleDashed, XCircle } from "lucide-react";

import { MatrixPreview } from "@/components/matrix-preview";

export const Route = createFileRoute("/matrixs/create")({
  component: CreateMatrixComponent,
});

const DEFAULT_TEMPLATES = [
  {
    id: "tpl-1",
    name: "Diagonale 4x4",
    size: 4,
    riskLevels: [
      { id: "1", label: "Ok", color: "bg-green-300", icon: CheckCircle2 },
      {
        id: "2",
        label: "Acceptable",
        color: "bg-yellow-300",
        icon: CircleDashed,
      },
      { id: "3", label: "Intolérable", color: "bg-red-900", icon: XCircle },
    ],
    matrixData: {
      "1-1": "1",
      "2-1": "1",
      "3-1": "1",
      "1-2": "1",
      "2-2": "1",
      "1-3": "1",
      "4-1": "2",
      "3-2": "2",
      "2-3": "2",
      "1-4": "2",
      "4-2": "3",
      "4-3": "3",
      "3-3": "3",
      "2-4": "3",
      "3-4": "3",
      "4-4": "3",
    },
  },
  {
    id: "tpl-2",
    name: "Concentré 4x4",
    size: 4,
    riskLevels: [
      { id: "1", label: "Ok", color: "bg-green-300", icon: CheckCircle2 },
      {
        id: "2",
        label: "Surveillance",
        color: "bg-yellow-300",
        icon: CircleDashed,
      },
      { id: "3", label: "Critique", color: "bg-red-900", icon: XCircle },
    ],
    matrixData: {
      "1-1": "1",
      "2-1": "1",
      "1-2": "1",
      "3-1": "2",
      "4-1": "2",
      "2-2": "2",
      "3-2": "2",
      "4-2": "2",
      "1-3": "2",
      "2-3": "2",
      "3-3": "2",
      "1-4": "2",
      "2-4": "2",
      "4-3": "3",
      "3-4": "3",
      "4-4": "3",
    },
  },
  {
    id: "tpl-3",
    name: "Océan 4x4 (Bleu)",
    size: 4,
    riskLevels: [
      { id: "1", label: "Mineur", color: "bg-cyan-400", icon: CheckCircle2 },
      { id: "2", label: "Majeur", color: "bg-indigo-400", icon: CircleDashed },
      { id: "3", label: "Sévère", color: "bg-black", icon: XCircle },
    ],
    matrixData: {
      "1-1": "1",
      "2-1": "1",
      "3-1": "1",
      "1-2": "1",
      "2-2": "1",
      "1-3": "1",
      "4-1": "2",
      "3-2": "2",
      "2-3": "2",
      "1-4": "2",
      "4-2": "3",
      "4-3": "3",
      "3-3": "3",
      "2-4": "3",
      "3-4": "3",
      "4-4": "3",
    },
  },
];

function CreateMatrixComponent() {
  const navigate = Route.useNavigate();

  const [isPending, setIsPending] = useState(false);
  // exemple : Matrix #123
  const customMatrixName = "Matrix #" + Math.floor(Math.random() * 1000);
  const [matrixName, setMatrixName] = useState(customMatrixName);

  // Matrix de 4x4 par défau (slider)
  const [size, setSize] = useState(4);
  const [xAxisTitle, setXAxisTitle] = useState("Probabilité");
  const [yAxisTitle, setYAxisTitle] = useState("Gravité");

  // Sélection du premier template par défau
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    DEFAULT_TEMPLATES[0].id,
  );

  // Sauvegarder la matrice
  const saveMatrix = async () => {
    setIsPending(true);

    // Template sélectionné ou le premier par défaut
    const template =
      DEFAULT_TEMPLATES.find((t) => t.id === selectedTemplateId) ||
      DEFAULT_TEMPLATES[0];

    // Appel au post de l'api
    const { data, error } = await api.matrix.create.post({
      name: matrixName,
      size: size,
      xTitle: xAxisTitle,
      yTitle: yAxisTitle,
      riskLevels: template.riskLevels.map((rl) => ({
        id: rl.id,
        label: rl.label,
        color: rl.color,
      })),
      matrixData: template.matrixData,
    });

    setIsPending(false);

    if (error) {
      toast.error("Failed to create matrix");
      return;
    }

    // renvoie vers list avec id pour faire higlight et message de succès
    toast.success(`${matrixName} créée !`);
    navigate({ to: "/matrixs", search: { highlight: data.id } });
  };

  // désactive btn si champs vides
  // trim = supp espaces (" test  " => "test")
  const isFormInvalid =
    !matrixName.trim() || !xAxisTitle.trim() || !yAxisTitle.trim();

  return (
    <div className="flex flex-col gap-8 mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <input
            className="text-3xl font-bold tracking-tight bg-transparent border-b-2 border-transparent focus:border-primary focus:outline-none duration-200 p-0 rounded-none"
            value={matrixName}
            onChange={(e) => setMatrixName(e.target.value)}
            placeholder="Nom de la matrice"
          />
          <p className="text-muted-foreground mt-1">
            Configure les axes et choisis un modèle de base.
          </p>
        </div>
        <Button
          onClick={saveMatrix}
          size="lg"
          disabled={isPending || isFormInvalid}
        >
          {isPending ? "Création..." : "Créer la matrice"}
        </Button>
      </div>

      <div className="bg-muted/50 border rounded-2xl p-8 space-y-8">
        <div className="space-y-4 max-w-xl">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold">
              Taille de la grille: {size}x{size}
            </label>
          </div>
          <Slider
            value={[size]}
            min={3}
            max={5}
            step={1}
            onValueChange={(v) => setSize(v[0])}
            className="cursor-pointer"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">
              Titre Axe X (Horizontal)
            </label>
            <Input
              value={xAxisTitle}
              onChange={(e) => setXAxisTitle(e.target.value)}
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">
              Titre Axe Y (Vertical)
            </label>
            <Input
              value={yAxisTitle}
              onChange={(e) => setYAxisTitle(e.target.value)}
              className="bg-background"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight">
          Modèles par défaut
        </h3>

        <div className="flex gap-4 overflow-x-auto p-4 max-w-4xl">
          {DEFAULT_TEMPLATES.map((template) => {
            const isSelected = selectedTemplateId === template.id;

            return (
              <div
                key={template.id}
                onClick={() => {
                  setSelectedTemplateId(template.id);
                  setSize(template.size);
                }}
                className={cn(
                  "relative flex-shrink-0 flex items-stretch gap-6 p-4 rounded-xl border bg-card cursor-pointer transition-all snap-start",
                  isSelected
                    ? "border-primary ring-1 ring-primary shadow-sm"
                    : "hover:border-primary/50",
                )}
                style={{ minWidth: "320px" }}
              >
                <div className="absolute top-3 right-3">
                  <div
                    className={cn(
                      "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                      isSelected
                        ? "bg-black border-black"
                        : "border-muted-foreground/30",
                    )}
                  >
                    {isSelected && (
                      <CheckCircle2 className="size-3 text-white" />
                    )}
                  </div>
                </div>

                <MatrixPreview
                  size={template.size}
                  data={template.matrixData}
                  riskLevels={template.riskLevels}
                  className="w-20 h-20 shrink-0 shadow-sm"
                />

                <div className="flex flex-col justify-center gap-2 flex-1">
                  <p className="font-semibold text-sm mb-1">{template.name}</p>

                  {/* Slice: coupe tableau pour boucler que sur 3 premiers rl */}
                  {template.riskLevels.slice(0, 3).map((level) => (
                    <div
                      key={level.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <CircleDashed className="size-3" />
                        {level.label}
                      </span>
                      <div className={cn("w-4 h-4 rounded-sm", level.color)} />
                    </div>
                  ))}

                  {/* Si j'ai plus de 3 rl : */}
                  {template.riskLevels.length > 3 && (
                    // Calule différence (length - 3) pour afficher autres rl
                    <span className="text-[10px] text-muted-foreground">
                      +{template.riskLevels.length - 3} autres
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
