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
import {
  insertProjectSchema,
  type InsertProject,
} from "@risk-matrix/db/validation";
import { useForm } from "@tanstack/react-form";

export const Route = createFileRoute("/_authenticated/projects/create")({
  component: CreateProjectComponent,
});

function CreateProjectComponent() {
  const navigate = Route.useNavigate();
  const [isPending, setIsPending] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
    } as InsertProject,
    validators: {
      onChange: insertProjectSchema as any,
    },
    onSubmit: async ({ value }) => {
      setIsPending(true);
      const payload = {
        ...value,
        description: value.description?.trim() ? value.description : null,
      };
      const { data, error } = await api.projects.post(payload);
      setIsPending(false);

      if (error || typeof data === "string") {
        toast.error(
          `Erreur: ${typeof data === "string" ? data : "Problème serveur"}`,
        );
        return;
      }

      toast.success(`Projet "${data.name}" créé avec succès !`);
      navigate({ to: "/projects", search: { highlight: data.id } });
    },
  });

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 pt-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft size={16} />
        <Link to="/projects">Retour aux projets</Link>
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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            {" "}
            {/* CHAMP NOM */}
            <form.Field
              name="name"
              children={(field) => (
                <div className="space-y-2">
                  <label htmlFor={field.name} className="text-sm font-medium">
                    Nom du projet
                  </label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="ex: Audit Interne 2024"
                    disabled={isPending}
                    className={cn(
                      field.state.meta.errors.length > 0 &&
                        "border-destructive focus-visible:ring-destructive focus-visible:ring-1",
                    )}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-[0.8rem] font-medium text-destructive">
                      {String(
                        (field.state.meta.errors[0] as any)?.message ??
                          field.state.meta.errors[0] ??
                          "",
                      )}
                    </p>
                  )}
                </div>
              )}
            />
            {/* CHAMP DESCRIPTION */}
            <form.Field
              name="description"
              children={(field) => (
                <div className="space-y-2">
                  <label htmlFor={field.name} className="text-sm font-medium">
                    Description (optionnel)
                  </label>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Décrivez l'objectif de ce projet..."
                    className="resize-none h-32"
                    disabled={isPending}
                  />
                </div>
              )}
            />
            <div className="pt-4 flex gap-3">
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={!canSubmit || isSubmitting || isPending}
                  >
                    {isPending || isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Création...
                      </>
                    ) : (
                      "Créer le projet"
                    )}
                  </Button>
                )}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: "/projects" })}
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
