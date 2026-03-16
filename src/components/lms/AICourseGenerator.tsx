import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import GhButton from "@/components/shared/GhButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { usePrograms } from "@/hooks/usePrograms";

interface GeneratedModule {
  title: string;
  content: string;
  duration_minutes: number;
  module_type: string;
  quiz_questions?: Array<{ question: string; options: string[]; correct: number; explanation: string }>;
}

interface GeneratedCourse {
  title: string;
  description: string;
  level: string;
  duration_hours: number;
  modules: GeneratedModule[];
}

export default function AICourseGenerator({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { user } = useAuth();
  const { data: programs } = usePrograms();
  const qc = useQueryClient();
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("beginner");
  const [modulesCount, setModulesCount] = useState("5");
  const [programId, setProgramId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<GeneratedCourse | null>(null);
  const [saving, setSaving] = useState(false);

  const generate = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setPreview(null);

    try {
      const { data, error } = await supabase.functions.invoke("elearning-ai", {
        body: { action: "generate_course", topic, level, modules_count: Number(modulesCount) },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setPreview(data as GeneratedCourse);
      toast.success("Cours généré ! Vérifiez le contenu avant d'enregistrer.");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la génération");
    } finally {
      setGenerating(false);
    }
  };

  const saveCourse = async () => {
    if (!preview || !user) return;
    setSaving(true);

    try {
      // Create course
      const { data: course, error: courseErr } = await supabase.from("courses").insert({
        title: preview.title,
        description: preview.description,
        level: preview.level,
        duration_hours: preview.duration_hours,
        modules_count: preview.modules.length,
        instructor_id: user.id,
        program_id: programId || null,
        is_published: false,
      } as any).select().single();

      if (courseErr) throw courseErr;

      // Create modules
      const modules = preview.modules.map((m, i) => ({
        course_id: course.id,
        title: m.title,
        content: m.content,
        module_order: i + 1,
        duration_minutes: m.duration_minutes,
        module_type: m.module_type,
        quiz_questions: m.quiz_questions ?? [],
      }));

      const { error: modErr } = await supabase.from("course_modules").insert(modules as any);
      if (modErr) throw modErr;

      qc.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Cours enregistré avec succès !");
      setPreview(null);
      setTopic("");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const levelLabels: Record<string, string> = { beginner: "Débutant", intermediate: "Intermédiaire", advanced: "Avancé" };
  const typeLabels: Record<string, string> = { lesson: "📖 Leçon", exercise: "✏️ Exercice", quiz: "❓ Quiz", case_study: "📋 Étude de cas" };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">🤖 Générateur de cours IA</DialogTitle>
        </DialogHeader>

        {!preview ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Décrivez le thème du cours et l'IA générera un contenu complet avec modules, exercices et quiz.</p>

            <div>
              <Label>Thème du cours *</Label>
              <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Ex: Marketing digital pour startups, Gestion financière, Pitch investisseurs…" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Niveau</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">🌱 Débutant</SelectItem>
                    <SelectItem value="intermediate">📊 Intermédiaire</SelectItem>
                    <SelectItem value="advanced">🚀 Avancé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nombre de modules</Label>
                <Select value={modulesCount} onValueChange={setModulesCount}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[3,4,5,6,7,8].map(n => <SelectItem key={n} value={String(n)}>{n} modules</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Programme</Label>
                <Select value={programId} onValueChange={setProgramId}>
                  <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                  <SelectContent>
                    {programs?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <GhButton variant="primary" onClick={generate} disabled={generating || !topic.trim()} className="w-full">
              {generating ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Génération en cours… (30-60s)
                </span>
              ) : "🤖 Générer le cours"}
            </GhButton>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Preview header */}
            <div className="bg-secondary rounded-xl p-4">
              <h3 className="font-bold text-foreground text-lg">{preview.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{preview.description}</p>
              <div className="flex gap-3 mt-2 text-[11px] text-muted-foreground">
                <span>📚 {preview.modules.length} modules</span>
                <span>⏱ {preview.duration_hours}h</span>
                <span>📊 {levelLabels[preview.level] ?? preview.level}</span>
              </div>
            </div>

            {/* Modules preview */}
            <div className="space-y-2">
              {preview.modules.map((m, i) => (
                <details key={i} className="bg-card border border-border rounded-lg overflow-hidden group">
                  <summary className="px-4 py-3 cursor-pointer hover:bg-secondary/50 transition-colors flex items-center gap-2">
                    <span className="text-[11px] font-mono text-muted-foreground">#{i + 1}</span>
                    <span className="text-[13px] font-semibold text-foreground flex-1">{m.title}</span>
                    <span className="text-[10px] text-muted-foreground">{typeLabels[m.module_type] ?? m.module_type} · {m.duration_minutes}min</span>
                  </summary>
                  <div className="px-4 pb-3 border-t border-border">
                    <p className="text-[12px] text-foreground/80 whitespace-pre-line mt-2 line-clamp-6">{m.content?.slice(0, 500)}…</p>
                    {m.quiz_questions && m.quiz_questions.length > 0 && (
                      <div className="mt-2 text-[11px] text-primary font-medium">❓ {m.quiz_questions.length} question{m.quiz_questions.length > 1 ? "s" : ""} de quiz</div>
                    )}
                  </div>
                </details>
              ))}
            </div>

            <div className="flex gap-2">
              <GhButton variant="secondary" onClick={() => setPreview(null)} className="flex-1">← Modifier les paramètres</GhButton>
              <GhButton variant="primary" onClick={saveCourse} disabled={saving} className="flex-1">
                {saving ? "Enregistrement…" : "💾 Enregistrer le cours"}
              </GhButton>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
