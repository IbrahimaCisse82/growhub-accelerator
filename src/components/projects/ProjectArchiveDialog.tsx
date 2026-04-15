import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface Props {
  projectId: string;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProjectArchiveDialog({ projectId, projectName, open, onOpenChange }: Props) {
  const [closureNotes, setClosureNotes] = useState("");
  const [lessonsLearned, setLessonsLearned] = useState("");
  const qc = useQueryClient();

  const archiveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("projects")
        .update({
          is_archived: true,
          archived_at: new Date().toISOString(),
          status: "completed",
          closure_notes: closureNotes || null,
          lessons_learned: lessonsLearned || null,
        })
        .eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Projet clôturé et archivé" });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      onOpenChange(false);
    },
    onError: () => toast({ title: "Erreur lors de l'archivage", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Clôturer le projet : {projectName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            La clôture archive le projet définitivement. Renseignez le rapport final et les leçons apprises.
          </p>
          <div className="space-y-2">
            <Label>Rapport de clôture</Label>
            <Textarea
              value={closureNotes}
              onChange={e => setClosureNotes(e.target.value)}
              placeholder="Résumé des résultats, objectifs atteints, livrables finaux…"
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>Leçons apprises</Label>
            <Textarea
              value={lessonsLearned}
              onChange={e => setLessonsLearned(e.target.value)}
              placeholder="Points forts, difficultés rencontrées, recommandations pour les projets futurs…"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={() => archiveMutation.mutate()} disabled={archiveMutation.isPending}>
            {archiveMutation.isPending ? "Archivage…" : "Clôturer et archiver"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
