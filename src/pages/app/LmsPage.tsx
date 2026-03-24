import { useEffect, useState } from "react";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

const levelEmoji: Record<string, string> = { beginner: "🌱", intermediate: "📊", advanced: "🚀" };

function CourseEditorDialog({ open, onOpenChange, course }: { open: boolean; onOpenChange: (v: boolean) => void; course: any | null }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  const { data: modules } = useQuery({
    queryKey: ["course-modules", course?.id],
    enabled: !!course?.id && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_modules")
        .select("*")
        .eq("course_id", course.id)
        .order("module_order");
      if (error) throw error;
      return data;
    },
  });

  const [draftModules, setDraftModules] = useState<any[]>([]);
  useEffect(() => {
    if (!open || !course) return;
    setTitle(course.title ?? "");
    setDescription(course.description ?? "");
    setIsPublished(!!course.is_published);
  }, [open, course]);

  useEffect(() => {
    if (!open) return;
    setDraftModules((modules ?? []).map(m => ({ ...m })));
  }, [open, modules]);

  const saveCourse = useMutation({
    mutationFn: async () => {
      if (!course?.id) return;
      const { error } = await supabase.from("courses").update({
        title,
        description,
        is_published: isPublished,
        modules_count: draftModules.length,
      }).eq("id", course.id);
      if (error) throw error;

      for (let i = 0; i < draftModules.length; i += 1) {
        const m = draftModules[i];
        const payload = {
          title: m.title,
          content: m.content ?? "",
          module_order: i + 1,
          module_type: m.module_type ?? "lesson",
          duration_minutes: Number(m.duration_minutes) || 0,
        };
        if (m.id?.startsWith?.("tmp-")) {
          const { error: insertError } = await supabase.from("course_modules").insert({
            ...payload,
            course_id: course.id,
          });
          if (insertError) throw insertError;
        } else {
          const { error: updateError } = await supabase.from("course_modules").update(payload).eq("id", m.id);
          if (updateError) throw updateError;
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      qc.invalidateQueries({ queryKey: ["course-modules", course?.id] });
      toast({ title: "✓ Cours enregistré" });
    },
  });

  const removeModule = useMutation({
    mutationFn: async (moduleId: string) => {
      if (moduleId.startsWith("tmp-")) return;
      const { error } = await supabase.from("course_modules").delete().eq("id", moduleId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course-modules", course?.id] });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] bg-card border-border max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Éditeur de cours</DialogTitle>
        </DialogHeader>
        {!course ? null : (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
            <div className="border border-border rounded-lg p-3 bg-surface-2 space-y-2">
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-card border border-border rounded-lg px-2.5 py-2 text-[12px] text-foreground" placeholder="Titre du cours" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full h-20 bg-card border border-border rounded-lg px-2.5 py-2 text-[12px] text-foreground resize-none" placeholder="Description" />
              <button onClick={() => setIsPublished(v => !v)} className={`text-[11px] px-2 py-1 rounded-lg ${isPublished ? "bg-gh-green/15 text-gh-green" : "bg-muted text-muted-foreground"}`}>
                {isPublished ? "● Publié" : "● Brouillon"}
              </button>
              <GhButton
                variant="secondary"
                size="sm"
                onClick={() => setDraftModules(prev => [...prev, { id: `tmp-${crypto.randomUUID()}`, title: "Nouvelle unité", content: "", module_type: "lesson", duration_minutes: 30, module_order: prev.length + 1 }])}
              >
                + Ajouter unité
              </GhButton>
            </div>
            <div className="space-y-2">
              {draftModules.length === 0 ? (
                <div className="text-[12px] text-muted-foreground border border-dashed border-border rounded-lg p-4 text-center">
                  Aucune unité. Ajoutez-en une pour commencer.
                </div>
              ) : draftModules.map((m, idx) => (
                <div key={m.id} className="border border-border rounded-lg p-3 bg-surface-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-[10px] text-primary">U{idx + 1}</span>
                    <input
                      value={m.title ?? ""}
                      onChange={(e) => setDraftModules(prev => prev.map((it, i) => i === idx ? { ...it, title: e.target.value } : it))}
                      className="flex-1 bg-card border border-border rounded-lg px-2 py-1.5 text-[12px] text-foreground"
                    />
                    <GhButton variant="ghost" size="sm" onClick={() => setDraftModules(prev => {
                      if (idx === 0) return prev;
                      const copy = [...prev];
                      [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
                      return copy;
                    })}>↑</GhButton>
                    <GhButton variant="ghost" size="sm" onClick={() => setDraftModules(prev => {
                      if (idx === prev.length - 1) return prev;
                      const copy = [...prev];
                      [copy[idx], copy[idx + 1]] = [copy[idx + 1], copy[idx]];
                      return copy;
                    })}>↓</GhButton>
                    <GhButton variant="ghost" size="sm" onClick={() => {
                      removeModule.mutate(String(m.id));
                      setDraftModules(prev => prev.filter((_, i) => i !== idx));
                    }}>Suppr.</GhButton>
                  </div>
                  <textarea
                    value={m.content ?? ""}
                    onChange={(e) => setDraftModules(prev => prev.map((it, i) => i === idx ? { ...it, content: e.target.value } : it))}
                    className="w-full h-24 bg-card border border-border rounded-lg px-2 py-2 text-[12px] text-foreground resize-none"
                    placeholder="Contenu de l'unité"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex justify-end">
          <GhButton onClick={() => saveCourse.mutate()} disabled={!course || saveCourse.isPending}>
            {saveCourse.isPending ? "Sauvegarde..." : "Enregistrer"}
          </GhButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function LmsPage() {
  const { data: courses, isLoading } = useCourses();
  const [aiGenOpen, setAiGenOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);

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
          <div
            key={c.id}
            onClick={() => { setSelectedCourse(c); setEditorOpen(true); }}
            className="bg-card border border-border rounded-xl overflow-hidden hover:border-border/80 hover:-translate-y-0.5 transition-all cursor-pointer"
          >
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
      <CourseEditorDialog open={editorOpen} onOpenChange={setEditorOpen} course={selectedCourse} />
    </motion.div>
  );
}
