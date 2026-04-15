import { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { useSubTasks, useAddSubTask, useToggleSubTask, useDeleteSubTask } from "@/hooks/useSubTasks";

interface Props {
  taskId: string;
}

export default function SubTaskChecklist({ taskId }: Props) {
  const { data: subTasks } = useSubTasks(taskId);
  const addSub = useAddSubTask();
  const toggleSub = useToggleSubTask();
  const deleteSub = useDeleteSubTask();
  const [newTitle, setNewTitle] = useState("");

  const completed = subTasks?.filter(s => s.is_completed).length ?? 0;
  const total = subTasks?.length ?? 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addSub.mutate({ taskId, title: newTitle.trim() });
    setNewTitle("");
  };

  return (
    <div className="space-y-2">
      {total > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">{completed}/{total}</span>
        </div>
      )}

      {subTasks?.map(st => (
        <div key={st.id} className="flex items-center gap-2 group">
          <button
            onClick={() => toggleSub.mutate({ id: st.id, is_completed: !st.is_completed })}
            className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
              st.is_completed
                ? "bg-primary border-primary text-primary-foreground"
                : "border-border hover:border-primary/50"
            }`}
          >
            {st.is_completed && <Check className="w-3 h-3" />}
          </button>
          <span className={`text-[12px] flex-1 ${st.is_completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {st.title}
          </span>
          <button
            onClick={() => deleteSub.mutate(st.id)}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive transition-all"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}

      <div className="flex items-center gap-1.5">
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
          placeholder="Ajouter une sous-tâche…"
          className="flex-1 text-[11px] bg-transparent border-b border-dashed border-border focus:border-primary outline-none py-1 text-foreground placeholder:text-muted-foreground"
        />
        <button onClick={handleAdd} className="p-1 text-muted-foreground hover:text-primary">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
