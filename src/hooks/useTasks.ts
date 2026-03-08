import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type TaskStatus = Database["public"]["Enums"]["task_status"];

export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*, projects(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch milestone titles for tasks that have a milestone id stored in tags[0]
      const milestoneIds = data
        .map(t => t.tags?.[0])
        .filter((id): id is string => !!id && id.length === 36);

      let milestoneMap: Record<string, string> = {};
      if (milestoneIds.length > 0) {
        const { data: ms } = await supabase
          .from("milestones")
          .select("id, title")
          .in("id", milestoneIds);
        if (ms) {
          milestoneMap = Object.fromEntries(ms.map(m => [m.id, m.title]));
        }
      }

      return data.map(t => ({
        ...t,
        milestone_title: t.tags?.[0] ? milestoneMap[t.tags[0]] ?? null : null,
      }));
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
