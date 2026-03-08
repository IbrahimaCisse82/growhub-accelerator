import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import SectionHeader from "@/components/shared/SectionHeader";
import GhCard from "@/components/shared/GhCard";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";
import EmptyState from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useApplications, useApplicationsPipeline } from "@/hooks/useApplications";
import { useCohorts } from "@/hooks/useCohorts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

const pipelineLabels: { key: string; label: string }[] = [
  { key: "submitted", label: "Reçues" },
  { key: "screening", label: "Examen" },
  { key: "interview", label: "Entretien" },
  { key: "due_diligence", label: "Due Diligence" },
  { key: "accepted", label: "Acceptées" },
  { key: "rejected", label: "Refusées" },
];

const stepColor: Record<string, "blue" | "amber" | "purple" | "green" | "rose" | "gray"> = {
  submitted: "gray", screening: "amber", interview: "blue",
  due_diligence: "purple", accepted: "green", rejected: "rose",
};

const nextStatus: Record<string, string> = {
  submitted: "screening", screening: "interview", interview: "due_diligence", due_diligence: "accepted",
};

export default function CandidaturesPage() {
  const { data: apps, isLoading } = useApplications();
  const { data: pipeline } = useApplicationsPipeline();
  const { data: cohorts } = useCohorts();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string | null>(null);
  const [cohortFilter, setCohortFilter] = useState<string | null>(searchParams.get("cohort"));
  const qc = useQueryClient();

  const advance = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("applications").update({ status: status as any, reviewed_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["applications"] }); qc.invalidateQueries({ queryKey: ["applications-pipeline"] }); toast({ title: "✓ Candidature mise à jour" }); },
  });

  const reject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("applications").update({ status: "rejected" as any, reviewed_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["applications"] }); qc.invalidateQueries({ queryKey: ["applications-pipeline"] }); toast({ title: "Candidature refusée" }); },
  });

  let filtered = filter ? apps?.filter(a => a.status === filter) : apps;
  if (cohortFilter) filtered = filtered?.filter(a => a.cohort_id === cohortFilter);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader
        title="Candidatures"
        subtitle="Évaluation et sélection des startups candidates"
      />
      {/* Pipeline summary */}
      <div className="flex flex-wrap border border-border rounded-xl overflow-hidden mb-4">
        {pipelineLabels.map((step) => (
          <div key={step.key} onClick={() => setFilter(filter === step.key ? null : step.key)}
            className={`flex-1 min-w-[80px] py-3.5 text-center border-r border-border last:border-r-0 relative hover:bg-secondary cursor-pointer transition-colors ${filter === step.key ? "bg-primary/10" : ""}`}>
            {filter === step.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            <div className="font-mono text-xl font-semibold text-foreground">
              {pipeline ? (pipeline as any)[step.key] ?? 0 : "—"}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">{step.label}</div>
          </div>
        ))}
      </div>

      {/* Cohort filter */}
      {cohorts && cohorts.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider">Cohorte :</span>
          <button onClick={() => setCohortFilter(null)} className={`text-[11.5px] px-2.5 py-1 rounded-lg transition-colors ${!cohortFilter ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-secondary"}`}>Toutes</button>
          {cohorts.map(c => (
            <button key={c.id} onClick={() => setCohortFilter(cohortFilter === c.id ? null : c.id)} className={`text-[11.5px] px-2.5 py-1 rounded-lg transition-colors ${cohortFilter === c.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-secondary"}`}>{c.name}</button>
          ))}
        </div>
      )}

      <GhCard title={filter ? `Candidatures — ${pipelineLabels.find(p => p.key === filter)?.label}` : "Toutes les candidatures"} badge={String(filtered?.length ?? 0)} noPadding>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="bg-secondary">
                {["Startup", "Programme", "Score", "Étape", "Date", "Actions"].map((h) => (
                  <th key={h} className="px-3.5 py-2.5 font-mono text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-3.5 py-2.5 border-b border-border"><Skeleton className="h-4 w-20" /></td>)}</tr>
                ))
              ) : !filtered || filtered.length === 0 ? (
                <tr><td colSpan={6}><EmptyState icon="📋" title="Aucune candidature" description="Les candidatures apparaîtront ici" /></td></tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-secondary transition-colors">
                    <td className="px-3.5 py-2.5 border-b border-border font-semibold text-foreground">
                      {c.startup_id ? (
                        <button onClick={() => navigate(`/app/startups/${c.startup_id}`)} className="hover:text-primary transition-colors text-left">{(c as any).startups?.name ?? "—"}</button>
                      ) : ((c as any).startups?.name ?? "—")}
                    </td>
                    <td className="px-3.5 py-2.5 border-b border-border text-foreground">{(c as any).programs?.name ?? "—"}</td>
                    <td className="px-3.5 py-2.5 border-b border-border font-mono text-primary">{c.score != null ? `${c.score}/100` : "—"}</td>
                    <td className="px-3.5 py-2.5 border-b border-border"><Pill color={stepColor[c.status] ?? "gray"}>{c.status}</Pill></td>
                    <td className="px-3.5 py-2.5 border-b border-border font-mono text-foreground">{new Date(c.submitted_at).toLocaleDateString("fr-FR")}</td>
                    <td className="px-3.5 py-2.5 border-b border-border">
                      <div className="flex gap-1">
                        {nextStatus[c.status] && (
                          <GhButton variant="primary" disabled={advance.isPending} onClick={() => advance.mutate({ id: c.id, status: nextStatus[c.status] })}>
                            Avancer →
                          </GhButton>
                        )}
                        {c.status !== "rejected" && c.status !== "accepted" && (
                          <GhButton variant="ghost" disabled={reject.isPending} onClick={() => reject.mutate(c.id)}>Refuser</GhButton>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GhCard>
    </motion.div>
  );
}
