import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import { useMilestones } from "@/hooks/useMilestones";
import type { Database } from "@/integrations/supabase/types";

type Priority = Database["public"]["Enums"]["task_priority"];
const inputCls = "flex h-10 w-full rounded-lg border border-input bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors";

export default function CreateTaskDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [projectId, setProjectId] = useState("");
  const [milestoneId, setMilestoneId] = useState("");
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: projects } = useProjects();
  const { data: milestones } = useMilestones();

  // Filter milestones by selected project
  const projectMilestones = milestones?.filter(m => m.project_id === projectId) ?? [];

  // Reset milestone when project changes
  const handleProjectChange = (pid: string) => {
    setProjectId(pid);
    setMilestoneId("");
  };

  const create = useMutation({
    mutationFn: async () => {
      if (!projectId) throw new Error("Veuillez sélectionner un projet");
      const { error } = await supabase.from("tasks").insert({
        title,
        description: description || null,
        priority,
        due_date: dueDate || null,
        assignee_id: user?.id,
        project_id: projectId,
        tags: milestoneId ? [milestoneId] : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      setOpen(false);
      setTitle("");
      setDescription("");
      setProjectId("");
      setMilestoneId("");
      toast({ title: "Tâche créée" });
    },
    onError: (e) => toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader><DialogTitle className="font-display">Nouvelle tâche</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Titre *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required className={inputCls} />
          </div>

          {/* Project selector (required) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Projet *</label>
            <select value={projectId} onChange={e => handleProjectChange(e.target.value)} required className={inputCls}>
              <option value="">Sélectionner un projet…</option>
              {projects?.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Milestone selector (optional, filtered by project) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Jalon</label>
            <select
              value={milestoneId}
              onChange={e => setMilestoneId(e.target.value)}
              className={inputCls}
              disabled={!projectId || projectMilestones.length === 0}
            >
              <option value="">{!projectId ? "Sélectionnez d'abord un projet" : projectMilestones.length === 0 ? "Aucun jalon pour ce projet" : "Aucun jalon (optionnel)"}</option>
              {projectMilestones.map(m => (
                <option key={m.id} value={m.id}>{m.title}{m.due_date ? ` — ${new Date(m.due_date).toLocaleDateString("fr-FR")}` : ""}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Priorité</label>
              <select value={priority} onChange={e => setPriority(e.target.value as Priority)} className={inputCls}>
                <option value="low">Basse</option><option value="medium">Moyenne</option><option value="high">Haute</option><option value="critical">Critique</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Échéance</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className={inputCls + " h-20 resize-none"} />
          </div>

          <button type="submit" disabled={create.isPending || !projectId} className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50">
            {create.isPending ? "Création…" : "Créer"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
