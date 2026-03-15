import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AssignableUser {
  user_id: string;
  full_name: string;
  email: string | null;
  roles: string[];
}

export function useAssignableUsers() {
  return useQuery({
    queryKey: ["assignable-users"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .eq("is_approved", true)
        .order("full_name");
      if (error) throw error;

      const { data: allRoles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const roleMap = new Map<string, string[]>();
      allRoles?.forEach((r) => {
        const arr = roleMap.get(r.user_id) ?? [];
        arr.push(r.role);
        roleMap.set(r.user_id, arr);
      });

      return (profiles ?? []).map((p) => ({
        ...p,
        roles: roleMap.get(p.user_id) ?? [],
      })) as AssignableUser[];
    },
  });
}

/** Filter users by specific roles */
export function useUsersByRole(...targetRoles: string[]) {
  const { data, ...rest } = useAssignableUsers();
  const filtered = data?.filter(u => u.roles.some(r => targetRoles.includes(r)));
  return { data: filtered, ...rest };
}
