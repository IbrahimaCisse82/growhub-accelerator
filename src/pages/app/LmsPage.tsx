import { motion } from "framer-motion";
import StatCard from "@/components/shared/StatCard";
import SectionHeader from "@/components/shared/SectionHeader";
import GhButton from "@/components/shared/GhButton";
import Pill from "@/components/shared/Pill";
import { Skeleton } from "@/components/ui/skeleton";
import { useCourses } from "@/hooks/useCourses";
import CreateCourseDialog from "@/components/dialogs/CreateCourseDialog";

const levelEmoji: Record<string, string> = { beginner: "🌱", intermediate: "📊", advanced: "🚀" };

export default function LmsPage() {
  const { data: courses, isLoading } = useCourses();

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SectionHeader title="LMS & Formation" subtitle="Bibliothèque de cours et parcours d'apprentissage"
        actions={<CreateCourseDialog><GhButton>+ Créer cours</GhButton></CreateCourseDialog>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-5">
        <StatCard label="Cours" value={String(courses?.length ?? 0)} note="" color="blue" />
        <StatCard label="Publiés" value={String(courses?.filter((c) => c.is_published).length ?? 0)} note="" color="green" />
        <StatCard label="Brouillons" value={String(courses?.filter((c) => !c.is_published).length ?? 0)} note="" color="amber" />
        <StatCard label="Heures de contenu" value={String(courses?.reduce((a, c) => a + (c.duration_hours ?? 0), 0) ?? 0)} note="" color="purple" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[200px] rounded-xl" />) : courses?.length === 0 ? (
          <div className="col-span-3 text-center text-muted-foreground py-12 text-sm">Aucun cours</div>
        ) : courses?.map((c) => (
          <div key={c.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-border/80 hover:-translate-y-0.5 transition-all cursor-pointer">
            <div className="h-[80px] flex items-center justify-center text-[32px] bg-gradient-to-br from-accent/20 to-primary/10">{levelEmoji[c.level ?? "beginner"] ?? "📚"}</div>
            <div className="p-3.5">
              <div className="text-[13px] font-bold text-foreground">{c.title}</div>
              <div className="text-[11px] text-muted-foreground mt-1">{c.modules_count ?? 0} modules · {c.duration_hours ?? 0}h · {c.level ?? "—"}</div>
            </div>
            <div className="px-3.5 py-2.5 bg-surface-2 border-t border-border flex justify-between items-center">
              <Pill color={c.is_published ? "green" : "amber"}>{c.is_published ? "● Publié" : "● Brouillon"}</Pill>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
