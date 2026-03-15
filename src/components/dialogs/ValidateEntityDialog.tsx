import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface ValidateEntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: "portfolios" | "programs" | "projects";
  entityId: string;
  entityName: string;
}

const entityLabel: Record<string, string> = {
  portfolios: "portefeuille",
  programs: "programme",
  projects: "projet",
};

export default function ValidateEntityDialog({ open, onOpenChange, entityType, entityId, entityName }: ValidateEntityDialogProps) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const validate = useMutation({
    mutationFn: async (action: "validate" | "reject") => {
      if (entityType === "projects") {
        const { error } = await supabase.from("projects").update({
          validation_status: action === "validate" ? "validated" : "rejected",
          validated_by: user?.id ?? null,
          validated_at: new Date().toISOString(),
          status: action === "validate" ? "active" as any : "draft" as any,
        }).eq("id", entityId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(entityType).update({
          status: action === "validate" ? "active" as any : "draft" as any,
        }).eq("id", entityId);
        if (error) throw error;
      }
    },
    onSuccess: (_, action) => {
      const key = entityType === "portfolios" ? "portfolio" : entityType === "programs" ? "program" : "project";
      qc.invalidateQueries({ queryKey: [key] });
      qc.invalidateQueries({ queryKey: [entityType] });
      onOpenChange(false);
      toast({ title: action === "validate" ? `${entityLabel[entityType].charAt(0).toUpperCase() + entityLabel[entityType].slice(1)} validé ✓` : `${entityLabel[entityType].charAt(0).toUpperCase() + entityLabel[entityType].slice(1)} rejeté` });
    },
    onError: (e) => toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">Valider le {entityLabel[entityType]}</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm mt-1">
            Voulez-vous valider ou rejeter <span className="font-semibold text-foreground">{entityName}</span> ?
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => validate.mutate("reject")}
            disabled={validate.isPending}
            className="flex-1 h-10 rounded-lg border border-destructive text-destructive font-semibold text-sm hover:bg-destructive/10 transition-all disabled:opacity-50"
          >
            Rejeter
          </button>
          <button
            onClick={() => validate.mutate("validate")}
            disabled={validate.isPending}
            className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50"
          >
            {validate.isPending ? "…" : "Valider ✓"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
