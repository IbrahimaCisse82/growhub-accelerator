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
import CourseStatsPanel from "@/components/lms/CourseStatsPanel";
import AICourseGenerator from "@/components/lms/AICourseGenerator";
import AIAssistantChat from "@/components/lms/AIAssistantChat";
import CourseCertificateDialog from "@/components/lms/CourseCertificateDialog";
import LearnerProgressPanel from "@/components/lms/LearnerProgressPanel";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Award } from "lucide-react";

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
  const [editorTab, setEditorTab] = useState<"content" | "settings" | "cohorts" | "preview">("content");
  const [selectedModuleIdx, setSelectedModuleIdx] = useState(0);
  useEffect(() => {
    if (!open || !course) return;
    setTitle(course.title ?? "");
    setDescription(course.description ?? "");
    setIsPublished(!!course.is_published);
  }, [open, course]);

  useEffect(() => {
    if (!open) return;
    setDraftModules((modules ?? []).map(m => ({ ...m })));
    setSelectedModuleIdx(0);
  }, [open, modules]);

  const selectedModule = draftModules[selectedModuleIdx] ?? null;

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
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 border border-border rounded-lg px-3 py-2 bg-surface-2">
              <div className="text-[12px] font-semibold text-foreground truncate">Course: {title || "Sans titre"}</div>
              <button onClick={() => setIsPublished(v => !v)} className={`text-[11px] px-2 py-1 rounded-lg ${isPublished ? "bg-gh-green/15 text-gh-green" : "bg-muted text-muted-foreground"}`}>
                {isPublished ? "Publish course" : "Draft content"}
              </button>
            </div>

            <div className="flex border-b border-border">
              {([
                ["content", "Content"],
                ["settings", "Settings"],
                ["cohorts", "Cohorts"],
                ["preview", "Preview"],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setEditorTab(key)}
                  className={`px-4 py-2 text-[11.5px] font-medium transition-colors relative ${editorTab === key ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {label}
                  {editorTab === key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </button>
              ))}
            </div>

            {editorTab === "settings" ? (
              <div className="border border-border rounded-lg p-4 bg-surface-2 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-muted-foreground uppercase">Titre du cours</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-card border border-border rounded-lg px-2.5 py-2 text-[12px] text-foreground" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-muted-foreground uppercase">Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full h-24 bg-card border border-border rounded-lg px-2.5 py-2 text-[12px] text-foreground resize-none" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-[11px] text-muted-foreground">Publie</label>
                  <button onClick={() => setIsPublished(v => !v)} className={`w-10 h-5 rounded-full transition-colors relative ${isPublished ? "bg-primary" : "bg-border"}`}>
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${isPublished ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-muted-foreground uppercase">Niveau</label>
                  <select className="w-full bg-card border border-border rounded-lg px-2.5 py-2 text-[12px] text-foreground">
                    <option value="beginner">Debutant</option>
                    <option value="intermediate">Intermediaire</option>
                    <option value="advanced">Avance</option>
                  </select>
                </div>
              </div>
            ) : editorTab === "cohorts" ? (
              <div className="border border-border rounded-lg p-4 bg-surface-2 space-y-3">
                <div className="text-[11px] font-medium text-foreground mb-2">Cohortes associees</div>
                <div className="space-y-2">
                  {["Cohorte 2025-A", "Cohorte 2025-B"].map(c => (
                    <label key={c} className="flex items-center gap-2 text-[12px] text-foreground cursor-pointer hover:bg-secondary/50 px-2 py-1.5 rounded-lg">
                      <input type="checkbox" className="rounded border-border" />
                      {c}
                    </label>
                  ))}
                </div>
                <div className="text-[10px] text-muted-foreground mt-2">Les cohortes selectionnees auront acces a ce cours automatiquement.</div>
              </div>
            ) : editorTab === "preview" ? (
              <div className="border border-border rounded-xl overflow-hidden bg-surface-2">
                <div className="h-[100px] flex items-center justify-center text-[40px] bg-gradient-to-br from-accent/20 to-primary/10">📚</div>
                <div className="p-4 space-y-3">
                  <h3 className="text-[15px] font-bold text-foreground">{title || "Sans titre"}</h3>
                  <p className="text-[12px] text-muted-foreground">{description || "Aucune description"}</p>
                  <div className="text-[11px] text-muted-foreground">{draftModules.length} modules</div>
                  <div className="space-y-1.5">
                    {draftModules.map((m, idx) => (
                      <div key={m.id} className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg text-[12px] text-foreground">
                        <span className="font-mono text-muted-foreground text-[11px]">{idx + 1}.</span>
                        {m.title || "Sans titre"}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
                <div className="border border-border rounded-lg p-3 bg-surface-2 space-y-3">
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-card border border-border rounded-lg px-2.5 py-2 text-[12px] text-foreground" placeholder="Titre du cours" />
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full h-20 bg-card border border-border rounded-lg px-2.5 py-2 text-[12px] text-foreground resize-none" placeholder="Description" />
                  <div className="text-[10px] font-mono text-muted-foreground uppercase">Units</div>
                  <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                    {draftModules.map((m, idx) => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedModuleIdx(idx)}
                        className={`w-full text-left px-2.5 py-2 rounded-lg border text-[12px] ${selectedModuleIdx === idx ? "bg-primary/10 border-primary/30 text-foreground" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}
                      >
                        {idx + 1}. {m.title || "Nouvelle unité"}
                      </button>
                    ))}
                  </div>
                  <GhButton
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setDraftModules(prev => [...prev, { id: `tmp-${crypto.randomUUID()}`, title: "Nouvelle unité", content: "", module_type: "lesson", duration_minutes: 30, module_order: prev.length + 1 }]);
                      setSelectedModuleIdx(draftModules.length);
                    }}
                  >
                    + Ajouter unité
                  </GhButton>
                </div>

                <div className="border border-border rounded-lg p-3 bg-surface-2 space-y-3">
                  {!selectedModule ? (
                    <div className="text-[12px] text-muted-foreground text-center py-16">Sélectionne une unité à éditer</div>
                  ) : (
                    <>
                      <div className="text-[12px] font-semibold text-foreground">Edit section</div>
                      <input
                        value={selectedModule.title ?? ""}
                        onChange={(e) => setDraftModules(prev => prev.map((it, i) => i === selectedModuleIdx ? { ...it, title: e.target.value } : it))}
                        className="w-full bg-card border border-border rounded-lg px-2.5 py-2 text-[12px] text-foreground"
                        placeholder="Section title"
                      />
                      <textarea
                        value={selectedModule.content ?? ""}
                        onChange={(e) => setDraftModules(prev => prev.map((it, i) => i === selectedModuleIdx ? { ...it, content: e.target.value } : it))}
                        className="w-full h-44 bg-card border border-border rounded-lg px-2.5 py-2 text-[12px] text-foreground resize-none"
                        placeholder="Notes / Resources"
                      />
                      <div className="flex gap-1">
                        <GhButton variant="ghost" size="sm" onClick={() => setDraftModules(prev => {
                          if (selectedModuleIdx === 0) return prev;
                          const copy = [...prev];
                          [copy[selectedModuleIdx - 1], copy[selectedModuleIdx]] = [copy[selectedModuleIdx], copy[selectedModuleIdx - 1]];
                          setSelectedModuleIdx(selectedModuleIdx - 1);
                          return copy;
                        })}>↑ Move</GhButton>
                        <GhButton variant="ghost" size="sm" onClick={() => setDraftModules(prev => {
                          if (selectedModuleIdx === prev.length - 1) return prev;
                          const copy = [...prev];
                          [copy[selectedModuleIdx], copy[selectedModuleIdx + 1]] = [copy[selectedModuleIdx + 1], copy[selectedModuleIdx]];
                          setSelectedModuleIdx(selectedModuleIdx + 1);
                          return copy;
                        })}>↓ Move</GhButton>
                        <GhButton variant="ghost" size="sm" onClick={() => {
                          removeModule.mutate(String(selectedModule.id));
                          setDraftModules(prev => {
                            const next = prev.filter((_, i) => i !== selectedModuleIdx);
                            setSelectedModuleIdx(Math.max(0, Math.min(selectedModuleIdx, next.length - 1)));
                            return next;
                          });
                        }}>Delete</GhButton>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
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
  const [certOpen, setCertOpen] = useState(false);
  const [certCourse, setCertCourse] = useState<any | null>(null);
  const { user } = useAuth();

  // Check user enrollment for certificate eligibility
  const { data: myEnrollments } = useQuery({
    queryKey: ["my-enrollments", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_enrollments")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["my-profile-lms", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name").eq("user_id", user!.id).single();
      return data;
    },
  });

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

      {/* Course Stats Dashboard */}
      <CourseStatsPanel />

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
              {(() => {
                const enrollment = myEnrollments?.find(e => e.course_id === c.id);
                if (enrollment?.completed_at) {
                  return (
                    <button
                      onClick={(e) => { e.stopPropagation(); setCertCourse(c); setCertOpen(true); }}
                      className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors"
                    >
                      <Award size={12} /> Certificat
                    </button>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        ))}
      </div>

      <AICourseGenerator open={aiGenOpen} onOpenChange={setAiGenOpen} />
      <AIAssistantChat open={aiChatOpen} onOpenChange={setAiChatOpen} />
      <CourseEditorDialog open={editorOpen} onOpenChange={setEditorOpen} course={selectedCourse} />
      <CourseCertificateDialog
        open={certOpen}
        onOpenChange={setCertOpen}
        studentName={profile?.full_name ?? "Apprenant"}
        courseTitle={certCourse?.title ?? ""}
        completedAt={myEnrollments?.find(e => e.course_id === certCourse?.id)?.completed_at ?? undefined}
        modulesCount={certCourse?.modules_count}
        durationHours={certCourse?.duration_hours}
      />
    </motion.div>
  );
}
