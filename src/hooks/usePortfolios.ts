import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePortfolios() {
  return useQuery({
    queryKey: ["portfolios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolios")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function usePortfolio(id: string | undefined) {
  return useQuery({
    queryKey: ["portfolio", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolios")
        .select("*, coordinator:profiles!portfolios_owner_id_fkey(full_name, email)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function usePortfolioPrograms(portfolioId: string | undefined) {
  return useQuery({
    queryKey: ["portfolio-programs", portfolioId],
    enabled: !!portfolioId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .eq("portfolio_id", portfolioId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
