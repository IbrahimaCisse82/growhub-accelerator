import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BudgetExecutionRow {
  project_id: string;
  nomenclature_code: string;
  nomenclature_label: string | null;
  work_package: string;
  planned_amount: number;
  spent_amount: number;
  remaining: number;
  execution_rate: number;
}

export function useBudgetExecution(projectId: string | null) {
  return useQuery({
    queryKey: ["budget_vs_actual", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_vs_actual")
        .select("*")
        .eq("project_id", projectId!);
      if (error) throw error;
      return data as BudgetExecutionRow[];
    },
  });
}

/** Aggregate execution data by nomenclature code (cross-WP) */
export function aggregateByNomenclature(rows: BudgetExecutionRow[]) {
  const map = new Map<string, { code: string; label: string; planned: number; spent: number }>();
  rows.forEach(r => {
    const key = r.nomenclature_code;
    const existing = map.get(key) || { code: key, label: r.nomenclature_label || key, planned: 0, spent: 0 };
    existing.planned += r.planned_amount || 0;
    existing.spent += r.spent_amount || 0;
    map.set(key, existing);
  });
  return Array.from(map.values()).map(r => ({
    ...r,
    remaining: r.planned - r.spent,
    rate: r.planned > 0 ? Math.round((r.spent / r.planned) * 100 * 10) / 10 : 0,
  }));
}
