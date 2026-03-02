import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { api } from "@/hooks/useMatrix";
import { FolderPlus, ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { insertProjectSchema } from "@risk-matrix/db/validation";

export const Route = createFileRoute("/_authenticated/projects/create")({
  component: CreateProjectComponent,
});

function CreateProjectComponent() {
  const navigate = Route.useNavigate();
  const [isPending, setIsPending] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    description?: string;
  }>({});

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    const result = insertProjectSchema.safeParse(newFormData);

    setIsValid(result.success);

    if (result.success) {
      setFieldErrors({});
    } else {
      const errors = result.error.flatten().fieldErrors;
      setFieldErrors({
        ...fieldErrors,
        [field]: errors[field]?.[0],
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation finale avant envoi
    const validation = insertProjectSchema.safeParse(formData);

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      setFieldErrors({
        name: errors.name?.[0],
        description: errors.description?.[0],
      });
      toast.error("Veuillez corriger les erreurs");
      return;
    }

    setIsPending(true);
    const { data, error } = await api.projects.post(validation.data);
    setIsPending(false);

    if (error) {
      toast.error(
        "Erreur lors de la création du projet (" + error.status + ")",
      );
      console.error("Détails de l'erreur :", error.value);
      return;
    }

    toast.success(`Projet "${data.name}" créé avec succès !`);
    navigate({ to: "/projects", search: { highlight: data.id } });
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 pt-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft size={16} />
        <Link to="/pojects">Retour aux matrices</Link>
      </div>

      <Card className="border-2 shadow-sm">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <FolderPlus size={24} />
            </div>
            <div>
              <CardTitle className="text-2xl">Nouveau Projet</CardTitle>
              <CardDescription>
                Créez un conteneur pour vos futures matrices de risques.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* CHAMP NOM */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Nom du projet
              </label>
              <Input
                id="name"
                placeholder="ex: Audit Interne 2024"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                disabled={isPending}
                className={cn(
                  fieldErrors.name &&
                    "border-destructive focus-visible:ring-destructive focus-visible:ring-1",
                )}
              />
              {/* Le petit texte rouge qui s'affiche si erreur */}
              {fieldErrors.name && (
                <p className="text-[0.8rem] font-medium text-destructive animate-in fade-in slide-in-from-top-1">
                  {fieldErrors.name}
                </p>
              )}
            </div>

            {/* CHAMP DESCRIPTION */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description (optionnel)
              </label>
              <Textarea
                id="description"
                placeholder="Décrivez l'objectif de ce projet..."
                className="resize-none h-32"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                disabled={isPending}
              />
            </div>

            <div className="pt-4 flex gap-3">
              <Button
                type="submit"
                className="flex-1"
                disabled={isPending || !isValid}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  "Créer le projet"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: "/matrixs" })}
                disabled={isPending}
              >
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
