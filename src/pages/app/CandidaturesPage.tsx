import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import GhCard from "@/components/shared/GhCard";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";
import { Skeleton } from "@/components/ui/skeleton";
import { useApplications, useApplicationsPipeline } from "@/hooks/useApplications";

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

export default function CandidaturesPage() {
  const { data: apps, isLoading } = useApplications();
  const { data: pipeline } = useApplicationsPipeline();

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader
        title="Candidatures"
        subtitle="Évaluation et sélection des startups candidates"
        actions={<><GhButton variant="ghost">Filtrer ▾</GhButton><GhButton>+ Ouvrir appel</GhButton></>}
      />
      <div className="flex border border-border rounded-xl overflow-hidden mb-5">
        {pipelineLabels.map((step, i) => (
          <div key={step.key} className={`flex-1 min-w-[80px] py-3.5 text-center border-r border-border last:border-r-0 relative hover:bg-surface-2 cursor-pointer transition-colors ${i === 0 ? "bg-primary/8" : ""}`}>
            {i === 0 && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            <div className="font-mono text-xl font-semibold text-foreground">
              {pipeline ? (pipeline as any)[step.key] ?? 0 : "—"}
            </div>
            <div className="text-[11px] text-text-secondary mt-1">{step.label}</div>
          </div>
        ))}
      </div>
      <GhCard title="Candidatures" badge={String(apps?.length ?? 0)} noPadding>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="bg-surface-2">
                {["Startup", "Programme", "Score", "Étape", "Date", "Actions"].map((h) => (
                  <th key={h} className="px-3.5 py-2.5 font-mono text-[10px] font-semibold text-text-tertiary uppercase tracking-wider border-b border-border text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-3.5 py-2.5 border-b border-border"><Skeleton className="h-4 w-20" /></td>)}</tr>
                ))
              ) : apps?.length === 0 ? (
                <tr><td colSpan={6} className="px-3.5 py-8 text-center text-text-secondary text-sm">Aucune candidature pour le moment</td></tr>
              ) : (
                apps?.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-2 transition-colors">
                    <td className="px-3.5 py-2.5 border-b border-border font-semibold text-foreground">
                      {c.startups?.name ?? "—"}
                    </td>
                    <td className="px-3.5 py-2.5 border-b border-border text-foreground">{c.programs?.name ?? "—"}</td>
                    <td className="px-3.5 py-2.5 border-b border-border font-mono text-primary">
                      {c.score != null ? `${c.score}/100` : "—"}
                    </td>
                    <td className="px-3.5 py-2.5 border-b border-border">
                      <Pill color={stepColor[c.status] ?? "gray"}>{c.status}</Pill>
                    </td>
                    <td className="px-3.5 py-2.5 border-b border-border font-mono text-foreground">
                      {new Date(c.submitted_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-3.5 py-2.5 border-b border-border"><GhButton variant="primary">Évaluer</GhButton></td>
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
