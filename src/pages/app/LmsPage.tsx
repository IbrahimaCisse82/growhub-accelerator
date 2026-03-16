import { useState } from "react";
import { motion } from "framer-motion";
import StatCard from "@/components/shared/StatCard";
import SectionHeader from "@/components/shared/SectionHeader";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";
import { Skeleton } from "@/components/ui/skeleton";
import { useCourses } from "@/hooks/useCourses";
import CreateCourseDialog from "@/components/dialogs/CreateCourseDialog";
import { exportToCSV } from "@/lib/exportUtils";
import AICourseGenerator from "@/components/lms/AICourseGenerator";
import AIAssistantChat from "@/components/lms/AIAssistantChat";

const levelEmoji: Record<string, string> = { beginner: "🌱", intermediate: "📊", advanced: "🚀" };

export default function LmsPage() {
  const { data: courses, isLoading } = useCourses();
  const [aiGenOpen, setAiGenOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader title="LMS & Formation" subtitle="Bibliothèque de cours et parcours d'apprentissage"
        actions={<>
          <GhButton variant="ghost" onClick={() => courses && exportToCSV(courses, "cours", [
            { key: "title", label: "Titre" }, { key: "level", label: "Niveau" },
            { key: "modules_count", label: "Modules" }, { key: "duration_hours", label: "Heures" },
            { key: "is_published", label: "Publié" },
          ])}>⤓ CSV</GhButton>
          <GhButton variant="secondary" onClick={() => setAiChatOpen(true)}>🤖 Assistant IA</GhButton>
          <GhButton variant="primary" onClick={() => setAiGenOpen(true)}>✨ Générer avec IA</GhButton>
          <CreateCourseDialog><GhButton>+ Créer cours</GhButton></CreateCourseDialog>
        </>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Cours" value={String(courses?.length ?? 0)} note="" color="blue" />
        <StatCard label="Publiés" value={String(courses?.filter((c) => c.is_published).length ?? 0)} note="" color="green" />
        <StatCard label="Brouillons" value={String(courses?.filter((c) => !c.is_published).length ?? 0)} note="" color="amber" />
        <StatCard label="Heures de contenu" value={String(courses?.reduce((a, c) => a + (c.duration_hours ?? 0), 0) ?? 0)} note="" color="purple" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[200px] rounded-xl" />) : courses?.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16">
            <span className="text-4xl mb-3">📚</span>
            <p className="text-sm text-muted-foreground mb-4">Aucun cours pour le moment</p>
            <GhButton variant="primary" onClick={() => setAiGenOpen(true)}>✨ Créer un cours avec l'IA</GhButton>
          </div>
        ) : courses?.map((c) => (
          <div key={c.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-border/80 hover:-translate-y-0.5 transition-all cursor-pointer">
            <div className="h-[80px] flex items-center justify-center text-[32px] bg-gradient-to-br from-accent/20 to-primary/10">{levelEmoji[c.level ?? "beginner"] ?? "📚"}</div>
            <div className="p-3.5">
              <div className="text-[13px] font-bold text-foreground">{c.title}</div>
              <div className="text-[11px] text-muted-foreground mt-1">{c.modules_count ?? 0} modules · {c.duration_hours ?? 0}h · {c.level ?? "—"}</div>
              {c.description && <p className="text-[10px] text-muted-foreground mt-1.5 line-clamp-2">{c.description}</p>}
            </div>
            <div className="px-3.5 py-2.5 bg-surface-2 border-t border-border flex justify-between items-center">
              <Pill color={c.is_published ? "green" : "amber"}>{c.is_published ? "● Publié" : "● Brouillon"}</Pill>
            </div>
          </div>
        ))}
      </div>

      <AICourseGenerator open={aiGenOpen} onOpenChange={setAiGenOpen} />
      <AIAssistantChat open={aiChatOpen} onOpenChange={setAiChatOpen} />
    </motion.div>
  );
}
