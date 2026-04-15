import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SubTask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  sort_order: number;
  created_at: string;
}

export function useSubTasks(taskId: string | null) {
  return useQuery({
    queryKey: ["sub-tasks", taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_tasks")
        .select("*")
        .eq("task_id", taskId!)
        .order("sort_order");
      if (error) throw error;
      return data as SubTask[];
    },
  });
}

export function useSubTasksByTasks(taskIds: string[]) {
  return useQuery({
    queryKey: ["sub-tasks-batch", taskIds.sort().join(",")],
    enabled: taskIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_tasks")
        .select("*")
        .in("task_id", taskIds)
        .order("sort_order");
      if (error) throw error;
      const map = new Map<string, SubTask[]>();
      for (const st of data ?? []) {
        if (!map.has(st.task_id)) map.set(st.task_id, []);
        map.get(st.task_id)!.push(st as SubTask);
      }
      return map;
    },
  });
}

export function useAddSubTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, title }: { taskId: string; title: string }) => {
      const { error } = await supabase.from("sub_tasks").insert({ task_id: taskId, title });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sub-tasks"] });
      qc.invalidateQueries({ queryKey: ["sub-tasks-batch"] });
    },
  });
}

export function useToggleSubTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const { error } = await supabase.from("sub_tasks").update({ is_completed }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sub-tasks"] });
      qc.invalidateQueries({ queryKey: ["sub-tasks-batch"] });
    },
  });
}

export function useDeleteSubTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sub_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sub-tasks"] });
      qc.invalidateQueries({ queryKey: ["sub-tasks-batch"] });
    },
  });
}
