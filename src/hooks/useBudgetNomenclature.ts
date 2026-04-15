import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface NomenclatureItem {
  code: string;
  label: string;
  parent_code: string | null;
  level: number;
  sort_order: number;
  is_active: boolean;
}

export function useBudgetNomenclature() {
  return useQuery({
    queryKey: ["budget_nomenclature"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_nomenclature")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as NomenclatureItem[];
    },
    staleTime: 1000 * 60 * 30, // 30min — reference data
  });
}

/** Build tree structure for hierarchical display */
export function buildNomenclatureTree(items: NomenclatureItem[]) {
  const roots: (NomenclatureItem & { children: NomenclatureItem[] })[] = [];
  const map = new Map<string, NomenclatureItem & { children: NomenclatureItem[] }>();

  items.forEach(item => map.set(item.code, { ...item, children: [] }));

  items.forEach(item => {
    const node = map.get(item.code)!;
    if (item.parent_code && map.has(item.parent_code)) {
      map.get(item.parent_code)!.children.push(node);
    } else if (!item.parent_code) {
      roots.push(node);
    }
  });

  return roots;
}
