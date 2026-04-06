import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--chart-3, 142 71% 45%))", "hsl(var(--chart-4, 38 92% 50%))", "hsl(var(--muted-foreground))"];

interface PipelineChartProps {
  data: { label: string; value: number }[];
}

export function PipelineBarChart({ data }: PipelineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
        <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={32}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface StatusPieProps {
  data: { name: string; value: number }[];
}

export function StatusPieChart({ data }: StatusPieProps) {
  const filtered = data.filter(d => d.value > 0);
  if (filtered.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie data={filtered} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value" nameKey="name">
          {filtered.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface TrendChartProps {
  data: { label: string; value: number }[];
  color?: string;
}

export function TrendLineChart({ data, color }: TrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="label" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
        <Line type="monotone" dataKey="value" stroke={color ?? "hsl(var(--primary))"} strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
