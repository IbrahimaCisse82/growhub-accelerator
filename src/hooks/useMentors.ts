import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MentorWithProfile = Awaited<ReturnType<typeof fetchMentors>>[number];

async function fetchMentors() {
  const { data: mentors, error } = await supabase
    .from("mentor_profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const userIds = (mentors ?? []).map(m => m.user_id).filter(Boolean);
  let profiles: Record<string, { full_name: string; email: string | null }> = {};
  if (userIds.length > 0) {
    const { data: pData } = await supabase
      .from("profiles_safe")
      .select("user_id, full_name, email")
      .in("user_id", userIds);
    profiles = Object.fromEntries((pData ?? []).map(p => [p.user_id, { full_name: p.full_name, email: p.email }]));
  }

  return (mentors ?? []).map(m => ({
    ...m,
    profile: profiles[m.user_id] ?? { full_name: "Mentor", email: null },
  }));
}

export function useMentors() {
  return useQuery({
    queryKey: ["mentors"],
    queryFn: fetchMentors,
  });
}
