import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import GhCard from "@/components/shared/GhCard";
import StatCard from "@/components/shared/StatCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" };

export default function CourseStatsPanel() {
  const { data: enrollments } = useQuery({
    queryKey: ["all-enrollments-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_enrollments")
        .select("*, courses(title)");
      if (error) throw error;
      return data ?? [];
    },
  });

  const totalEnrolled = enrollments?.length ?? 0;
  const totalCompleted = enrollments?.filter(e => e.completed_at).length ?? 0;
  const avgProgress = totalEnrolled > 0
    ? Math.round(enrollments!.reduce((s, e) => s + (e.progress ?? 0), 0) / totalEnrolled)
    : 0;
  const completionRate = totalEnrolled > 0 ? Math.round((totalCompleted / totalEnrolled) * 100) : 0;

  // Per-course stats
  const courseMap = new Map<string, { title: string; enrolled: number; completed: number }>();
  enrollments?.forEach(e => {
    const title = (e.courses as any)?.title ?? "Inconnu";
    const existing = courseMap.get(e.course_id) ?? { title, enrolled: 0, completed: 0 };
    existing.enrolled++;
    if (e.completed_at) existing.completed++;
    courseMap.set(e.course_id, existing);
  });
  const chartData = Array.from(courseMap.values())
    .map(c => ({ name: c.title.length > 18 ? c.title.slice(0, 18) + "…" : c.title, inscrits: c.enrolled, complétés: c.completed }))
    .sort((a, b) => b.inscrits - a.inscrits)
    .slice(0, 8);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Inscrits" value={String(totalEnrolled)} note="" color="blue" />
        <StatCard label="Complétés" value={String(totalCompleted)} note="" color="green" />
        <StatCard label="Taux complétion" value={`${completionRate}%`} note="" color="purple" />
        <StatCard label="Progression moy." value={`${avgProgress}%`} note="" color="amber" />
      </div>
      {chartData.length > 0 && (
        <GhCard title="Inscriptions par cours">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="inscrits" fill="hsl(199,90%,48%)" radius={[4, 4, 0, 0]} name="Inscrits" />
              <Bar dataKey="complétés" fill="hsl(165,100%,41%)" radius={[4, 4, 0, 0]} name="Complétés" />
            </BarChart>
          </ResponsiveContainer>
        </GhCard>
      )}
    </div>
  );
}
