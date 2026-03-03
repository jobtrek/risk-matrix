import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/hooks/useMatrix";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  CircleDashed,
  XCircle,
  ArrowLeft,
  Loader2,
  LayoutGrid,
} from "lucide-react";
import { MatrixPreview } from "@/components/matrix-preview";
import { insertMatrixSchema } from "@risk-matrix/db/validation";

export const Route = createFileRoute("/_authenticated/matrixs/create")({
  loader: async () => {
    const { data, error } = await api.projects.get();
    if (error) throw new Error("Impossible de charger les projets");
    return { projects: data };
  },
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
  const { projects: projectsList } = Route.useLoaderData();

  const [isPending, setIsPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );
  const [matrixName, setMatrixName] = useState(
    "Matrix #" + Math.floor(Math.random() * 1000),
  );
  const [size, setSize] = useState(4);
  const [xAxisTitle, setXAxisTitle] = useState("Probabilité");
  const [yAxisTitle, setYAxisTitle] = useState("Gravité");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    DEFAULT_TEMPLATES[0].id,
  );

  useEffect(() => {
    const template =
      DEFAULT_TEMPLATES.find((t) => t.id === selectedTemplateId) ||
      DEFAULT_TEMPLATES[0];

    const currentPayload = {
      projectId: selectedProjectId as number,
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
    };

    const result = insertMatrixSchema.safeParse(currentPayload);
    setIsValid(result.success);

    if (!result.success) {
      const flattened = result.error.flatten().fieldErrors;
      const errors: Record<string, string> = {};
      Object.keys(flattened).forEach((key) => {
        errors[key] = flattened[key as keyof typeof flattened]?.[0] || "";
      });
      setFieldErrors(errors);
    } else {
      setFieldErrors({});
    }
  }, [
    selectedProjectId,
    matrixName,
    size,
    xAxisTitle,
    yAxisTitle,
    selectedTemplateId,
  ]);

  const saveMatrix = async () => {
    const template =
      DEFAULT_TEMPLATES.find((t) => t.id === selectedTemplateId) ||
      DEFAULT_TEMPLATES[0];

    const payload = {
      projectId: selectedProjectId as number,
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
    };

    const validation = insertMatrixSchema.safeParse(payload);
    if (!validation.success) {
      toast.error("Veuillez remplir correctement tous les champs");
      return;
    }

    setIsPending(true);
    const { data, error } = await api.matrix.create.post(validation.data);
    setIsPending(false);

    if (error) {
      toast.error(
        `Échec de la création : ${(error.value as any)?.message || "Erreur serveur"}`,
      );
      return;
    }

    toast.success(`${matrixName} créée !`);
    navigate({ to: "/projects", search: { highlight: (data as any).id } });
  };

  return (
    <div className="flex flex-col gap-8 mx-auto pb-12 w-full max-w-5xl pt-6">
      {/* Retour */}
      <div
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        onClick={() => navigate({ to: "/projects" })}
      >
        <ArrowLeft size={16} />
        <span>Retour aux projets</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <input
            className={cn(
              "text-3xl font-bold tracking-tight bg-transparent border-b-2 border-transparent focus:border-primary focus:outline-none duration-200 p-0 rounded-none w-full",
              fieldErrors.name && "border-destructive text-destructive",
            )}
            value={matrixName}
            onChange={(e) => setMatrixName(e.target.value)}
            placeholder="Nom de la matrice"
          />
          {fieldErrors.name && (
            <p className="text-sm font-medium text-destructive mt-1">
              {fieldErrors.name}
            </p>
          )}
          <p className="text-muted-foreground mt-1">
            Configure les axes et choisis un modèle de base.
          </p>
        </div>
        <Button
          onClick={saveMatrix}
          size="lg"
          disabled={isPending || !isValid}
          className="md:w-auto w-full"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Création...
            </>
          ) : (
            "Créer la matrice"
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 bg-muted/50 border rounded-2xl p-6 space-y-8">
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <LayoutGrid size={16} className="text-primary" /> Choisir un
              Projet
            </label>
            <select
              className={cn(
                "w-full p-2.5 rounded-md border bg-background focus:ring-2 focus:ring-primary outline-none transition-all",
                fieldErrors.projectId && "border-destructive ring-destructive",
              )}
              onChange={(e) => setSelectedProjectId(Number(e.target.value))}
              value={selectedProjectId || ""}
            >
              <option value="" disabled>
                Sélectionner un projet...
              </option>
              {Array.isArray(projectsList) &&
                projectsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
            {fieldErrors.projectId && (
              <p className="text-[0.8rem] font-medium text-destructive">
                {fieldErrors.projectId}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold">
              Taille de la grille: {size}x{size}
            </label>
            <Slider
              value={[size]}
              min={3}
              max={5}
              step={1}
              onValueChange={(v) => setSize(v[0])}
              className="cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">
                Axe X (Horizontal)
              </label>
              <Input
                value={xAxisTitle}
                onChange={(e) => setXAxisTitle(e.target.value)}
                className={cn(
                  "bg-background",
                  fieldErrors.xTitle && "border-destructive",
                )}
              />
              {fieldErrors.xTitle && (
                <p className="text-xs text-destructive">{fieldErrors.xTitle}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">
                Axe Y (Vertical)
              </label>
              <Input
                value={yAxisTitle}
                onChange={(e) => setYAxisTitle(e.target.value)}
                className={cn(
                  "bg-background",
                  fieldErrors.yTitle && "border-destructive",
                )}
              />
              {fieldErrors.yTitle && (
                <p className="text-xs text-destructive">{fieldErrors.yTitle}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-6 shadow-sm sticky top-6">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
            Aperçu de la matrice
          </h3>
          <div className="flex flex-col items-center">
            <MatrixPreview
              size={size}
              data={
                DEFAULT_TEMPLATES.find((t) => t.id === selectedTemplateId)
                  ?.matrixData || {}
              }
              riskLevels={
                DEFAULT_TEMPLATES.find((t) => t.id === selectedTemplateId)
                  ?.riskLevels || []
              }
              className="w-full aspect-square max-w-[280px]"
            />
            <div className="mt-6 w-full space-y-2">
              <div className="text-xs font-bold text-muted-foreground">
                LÉGENDE
              </div>
              {DEFAULT_TEMPLATES.find(
                (t) => t.id === selectedTemplateId,
              )?.riskLevels.map((rl) => (
                <div
                  key={rl.id}
                  className="flex items-center justify-between text-sm py-1 border-b border-muted"
                >
                  <span className="flex items-center gap-2">
                    <div className={cn("size-3 rounded-full", rl.color)} />{" "}
                    {rl.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight">
          Modèles de distribution des risques
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
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
                    ? "border-primary ring-2 ring-primary/20 shadow-md bg-primary/5"
                    : "hover:border-primary/50 opacity-70 hover:opacity-100",
                )}
                style={{ minWidth: "340px" }}
              >
                <div className="absolute top-3 right-3">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full border flex items-center justify-center",
                      isSelected
                        ? "bg-primary border-primary text-white"
                        : "bg-background border-muted",
                    )}
                  >
                    {isSelected && <CheckCircle2 className="size-4" />}
                  </div>
                </div>
                <MatrixPreview
                  size={template.size}
                  data={template.matrixData}
                  riskLevels={template.riskLevels}
                  className="w-24 h-24 shrink-0 shadow-sm rounded-lg overflow-hidden border"
                />
                <div className="flex flex-col justify-center gap-2 flex-1">
                  <p className="font-bold text-sm">{template.name}</p>
                  {template.riskLevels.slice(0, 3).map((level) => (
                    <div
                      key={level.id}
                      className="flex items-center justify-between text-[11px]"
                    >
                      <span className="text-muted-foreground">
                        {level.label}
                      </span>
                      <div
                        className={cn("w-3 h-3 rounded-full", level.color)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
