import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SectionHeader from "@/components/shared/SectionHeader";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";
import EmptyState from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/useProjects";
import { exportToCSV } from "@/lib/exportUtils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const statusColor: Record<string, "green" | "blue" | "amber" | "gray"> = {
  active: "green", draft: "gray", paused: "amber", completed: "blue", cancelled: "gray",
};

const validationColor: Record<string, "green" | "blue" | "amber" | "gray"> = {
  draft: "gray", pending_review: "amber", validated: "green", rejected: "gray",
};

const validationLabel: Record<string, string> = {
  draft: "Brouillon", pending_review: "En attente", validated: "Validé", rejected: "Rejeté",
};

const inputCls = "flex h-10 w-full rounded-lg border border-input bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors";

export default function ProjetsPage() {
  const { data: projects, isLoading } = useProjects();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [openAppDialog, setOpenAppDialog] = useState<string | null>(null);
  const [appStartDate, setAppStartDate] = useState("");
  const [appEndDate, setAppEndDate] = useState("");

  const validateProject = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase.from("projects").update({ validation_status: "validated", validated_at: new Date().toISOString() }).eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects"] }); toast.success("Projet validé !"); },
    onError: () => toast.error("Erreur de validation"),
  });

  const openApplications = useMutation({
    mutationFn: async () => {
      if (!openAppDialog) return;
      const { error } = await supabase.from("projects").update({
        applications_open: true,
        applications_start_date: appStartDate || null,
        applications_end_date: appEndDate || null,
      }).eq("id", openAppDialog);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      setOpenAppDialog(null);
      toast.success("Candidatures ouvertes !");
    },
    onError: () => toast.error("Erreur"),
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader
        title="Projets"
        subtitle="Liste des projets rattachés aux programmes"
        actions={
          <>
            <GhButton variant="ghost" onClick={() => projects && exportToCSV(projects, "projets", [
              { key: "name", label: "Nom" }, { key: "code", label: "Code" }, { key: "status", label: "Statut" }, { key: "progress", label: "Progression" },
            ])}>⤓ CSV</GhButton>
            <GhButton onClick={() => navigate("/app/projets/nouveau")}>+ Nouveau projet</GhButton>
          </>
        }
      />
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : !projects || projects.length === 0 ? (
        <EmptyState icon="📁" title="Aucun projet" description="Créez un projet avec le parcours structuré" />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary">
                <th className="text-left px-4 py-3 text-[10px] font-mono uppercase text-muted-foreground">Nom</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono uppercase text-muted-foreground">Programme</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono uppercase text-muted-foreground">Validation</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono uppercase text-muted-foreground">Candidatures</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono uppercase text-muted-foreground">Budget</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono uppercase text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => {
                const vs = p.validation_status ?? "draft";
                const appOpen = p.applications_open ?? false;
                return (
                  <tr key={p.id} className="border-b border-border last:border-b-0 hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 cursor-pointer" onClick={() => navigate(`/app/projets/${p.id}`)}>
                      <div className="font-semibold text-foreground text-xs">{p.name}</div>
                      {p.code && <div className="text-[10px] font-mono text-muted-foreground">{p.code}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{p.programs?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Pill color={validationColor[vs] ?? "gray"}>{validationLabel[vs] ?? vs}</Pill>
                    </td>
                    <td className="px-4 py-3">
                      {appOpen ? (
                        <Pill color="green">Ouvertes</Pill>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Fermées</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-foreground">{p.budget ? `${Number(p.budget).toLocaleString("fr-FR")} XOF` : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {vs === "draft" && (
                          <GhButton size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); navigate(`/app/projets/nouveau?id=${p.id}`); }}>
                            Continuer ✏️
                          </GhButton>
                        )}
                        {vs === "pending_review" && (
                          <GhButton size="sm" variant="accent" onClick={(e) => { e.stopPropagation(); validateProject.mutate(p.id); }}>
                            Valider
                          </GhButton>
                        )}
                        {vs === "validated" && !appOpen && (
                          <GhButton size="sm" onClick={(e) => { e.stopPropagation(); setOpenAppDialog(p.id); }}>
                            Ouvrir candidatures
                          </GhButton>
                        )}
                        {appOpen && (
                          <GhButton size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/app/candidatures?project=${p.id}`); }}>
                            Voir candidatures
                          </GhButton>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog: Open applications */}
      <Dialog open={!!openAppDialog} onOpenChange={() => setOpenAppDialog(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display">Ouvrir les candidatures</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Définissez la fenêtre de candidature pour ce projet. Les startups pourront soumettre leur candidature pendant cette période.</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><label className="text-sm font-medium text-foreground">Date d'ouverture</label><input type="date" value={appStartDate} onChange={e => setAppStartDate(e.target.value)} className={inputCls} /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-foreground">Date de clôture</label><input type="date" value={appEndDate} onChange={e => setAppEndDate(e.target.value)} className={inputCls} /></div>
            </div>
            <GhButton size="md" onClick={() => openApplications.mutate()} disabled={openApplications.isPending} className="w-full justify-center">
              {openApplications.isPending ? "Ouverture…" : "Confirmer l'ouverture"}
            </GhButton>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
