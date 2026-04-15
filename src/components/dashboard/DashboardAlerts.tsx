import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Clock, DollarSign } from "lucide-react";

interface Milestone {
  id: string;
  title: string;
  due_date?: string | null;
  status?: string;
  projects?: { name?: string } | null;
}

interface Grant {
  id: string;
  name: string;
  code: string;
  amount_total: number;
  amount_disbursed?: number | null;
  end_date?: string | null;
}

interface Props {
  milestones?: Milestone[];
  grants?: Grant[];
}

interface Alert {
  id: string;
  type: "overdue" | "approaching" | "budget_exceeded" | "grant_ending";
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
  severity: "error" | "warning" | "info";
}

export default function DashboardAlerts({ milestones, grants }: Props) {
  const navigate = useNavigate();
  const now = new Date();

  const alerts = useMemo<Alert[]>(() => {
    const result: Alert[] = [];

    // Overdue milestones
    milestones?.forEach((m) => {
      if (m.status === "completed" || !m.due_date) return;
      const due = new Date(m.due_date);
      const daysLeft = Math.ceil((due.getTime() - now.getTime()) / 86400000);

      if (daysLeft < 0) {
        result.push({
          id: `ms-overdue-${m.id}`,
          type: "overdue",
          icon: <AlertTriangle className="w-4 h-4 text-destructive" />,
          title: `Jalon en retard : ${m.title}`,
          description: `${Math.abs(daysLeft)}j de retard${m.projects?.name ? ` — ${m.projects.name}` : ""}`,
          link: "/app/jalons",
          severity: "error",
        });
      } else if (daysLeft <= 7) {
        result.push({
          id: `ms-approaching-${m.id}`,
          type: "approaching",
          icon: <Clock className="w-4 h-4 text-amber-500" />,
          title: `Jalon imminent : ${m.title}`,
          description: `Échéance dans ${daysLeft}j${m.projects?.name ? ` — ${m.projects.name}` : ""}`,
          link: "/app/jalons",
          severity: "warning",
        });
      }
    });

    // Budget overruns on grants
    grants?.forEach((g) => {
      if (!g.amount_total) return;
      const disbursed = g.amount_disbursed ?? 0;
      const rate = g.amount_total > 0 ? (disbursed / g.amount_total) * 100 : 0;

      if (rate > 100) {
        result.push({
          id: `grant-over-${g.id}`,
          type: "budget_exceeded",
          icon: <DollarSign className="w-4 h-4 text-destructive" />,
          title: `Budget dépassé : ${g.code}`,
          description: `Exécution à ${rate.toFixed(0)}% — ${g.name}`,
          link: `/app/grants/${g.id}`,
          severity: "error",
        });
      } else if (rate >= 90) {
        result.push({
          id: `grant-warn-${g.id}`,
          type: "budget_exceeded",
          icon: <DollarSign className="w-4 h-4 text-amber-500" />,
          title: `Budget bientôt épuisé : ${g.code}`,
          description: `Exécution à ${rate.toFixed(0)}% — ${g.name}`,
          link: `/app/grants/${g.id}`,
          severity: "warning",
        });
      }

      // Grant ending soon
      if (g.end_date) {
        const endDays = Math.ceil((new Date(g.end_date).getTime() - now.getTime()) / 86400000);
        if (endDays > 0 && endDays <= 30) {
          result.push({
            id: `grant-end-${g.id}`,
            type: "grant_ending",
            icon: <Clock className="w-4 h-4 text-amber-500" />,
            title: `Grant expire bientôt : ${g.code}`,
            description: `Fin dans ${endDays}j — ${g.name}`,
            link: `/app/grants/${g.id}`,
            severity: "warning",
          });
        }
      }
    });

    // Sort: errors first, then warnings
    result.sort((a, b) => (a.severity === "error" ? -1 : 1) - (b.severity === "error" ? -1 : 1));
    return result;
  }, [milestones, grants, now]);

  if (alerts.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mb-4">
      <div className="px-4 py-2.5 border-b border-border bg-destructive/5 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-destructive" />
        <span className="text-xs font-bold text-foreground uppercase tracking-wider">Alertes</span>
        <span className="font-mono text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">{alerts.length}</span>
      </div>
      <div className="divide-y divide-border max-h-[240px] overflow-y-auto">
        {alerts.slice(0, 8).map((alert) => (
          <div
            key={alert.id}
            onClick={() => navigate(alert.link)}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/50 transition-colors cursor-pointer"
          >
            {alert.icon}
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-foreground truncate">{alert.title}</div>
              <div className="text-[10px] text-muted-foreground">{alert.description}</div>
            </div>
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
              alert.severity === "error" ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-600"
            }`}>
              {alert.severity === "error" ? "URGENT" : "ATTENTION"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
