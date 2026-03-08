import Pill from "@/components/shared/Pill";

interface GrantAlertsPanelProps {
  grant: any;
  budgetLines: any[];
  transactions: any[];
  reports: any[];
  activities: any[];
  disbursements: any[];
}

export default function GrantAlertsPanel({ grant, budgetLines, transactions, reports, activities, disbursements }: GrantAlertsPanelProps) {
  const alerts: { type: "danger" | "warning" | "info"; message: string }[] = [];

  // Budget overspend
  const totalPlanned = budgetLines.reduce((s, b: any) => s + (b.amount_planned ?? 0), 0);
  const totalSpent = transactions.reduce((s, t: any) => s + (t.amount ?? 0), 0);
  if (totalPlanned > 0 && totalSpent > totalPlanned) {
    alerts.push({ type: "danger", message: `⚠️ Budget dépassé : ${Math.round(((totalSpent - totalPlanned) / totalPlanned) * 100)}% au-dessus du planifié` });
  } else if (totalPlanned > 0 && totalSpent / totalPlanned > 0.85) {
    alerts.push({ type: "warning", message: `⏳ Budget bientôt épuisé : ${Math.round((totalSpent / totalPlanned) * 100)}% consommé` });
  }

  // Grant end date approaching
  if (grant.end_date) {
    const daysLeft = Math.ceil((new Date(grant.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) {
      alerts.push({ type: "danger", message: `🔴 Grant expiré depuis ${Math.abs(daysLeft)} jours` });
    } else if (daysLeft <= 30) {
      alerts.push({ type: "warning", message: `📅 Échéance dans ${daysLeft} jours (${grant.end_date})` });
    } else if (daysLeft <= 90) {
      alerts.push({ type: "info", message: `📅 Échéance dans ${daysLeft} jours (${grant.end_date})` });
    }
  }

  // Delayed activities
  const delayedActivities = activities.filter((a: any) => a.status === "delayed");
  if (delayedActivities.length > 0) {
    alerts.push({ type: "warning", message: `⚠️ ${delayedActivities.length} activité(s) en retard` });
  }

  // Overdue activities (end_date passed but not completed)
  const overdueActivities = activities.filter((a: any) => a.end_date && new Date(a.end_date) < new Date() && a.status !== "completed");
  if (overdueActivities.length > 0) {
    alerts.push({ type: "danger", message: `🔴 ${overdueActivities.length} activité(s) avec échéance dépassée` });
  }

  // Pending disbursements
  const pendingDisbursements = disbursements.filter((d: any) => d.status === "pending");
  if (pendingDisbursements.length > 0) {
    alerts.push({ type: "info", message: `💸 ${pendingDisbursements.length} demande(s) de décaissement en attente` });
  }

  // Low disbursement rate
  if (grant.amount_total > 0) {
    const disbursedPct = ((grant.amount_disbursed ?? 0) / grant.amount_total) * 100;
    if (grant.end_date) {
      const totalDays = Math.max(1, (new Date(grant.end_date).getTime() - new Date(grant.start_date ?? grant.created_at).getTime()) / (1000 * 60 * 60 * 24));
      const elapsedDays = Math.max(0, (Date.now() - new Date(grant.start_date ?? grant.created_at).getTime()) / (1000 * 60 * 60 * 24));
      const elapsedPct = (elapsedDays / totalDays) * 100;
      if (elapsedPct > 50 && disbursedPct < 25) {
        alerts.push({ type: "warning", message: `📉 Taux de décaissement faible (${Math.round(disbursedPct)}%) malgré ${Math.round(elapsedPct)}% du temps écoulé` });
      }
    }
  }

  // No reports submitted
  if (reports.length === 0 && grant.status !== "draft") {
    alerts.push({ type: "info", message: "📋 Aucun rapport financier soumis" });
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-center gap-2">
        <span className="text-green-500">✓</span>
        <span className="text-sm text-green-500 font-medium">Aucune alerte — tout est en ordre</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert, i) => {
        const bgCls = alert.type === "danger" ? "bg-destructive/10 border-destructive/20" : alert.type === "warning" ? "bg-amber-500/10 border-amber-500/20" : "bg-primary/10 border-primary/20";
        const textCls = alert.type === "danger" ? "text-destructive" : alert.type === "warning" ? "text-amber-500" : "text-primary";
        return (
          <div key={i} className={`${bgCls} border rounded-xl px-4 py-2.5 flex items-center gap-2`}>
            <span className={`text-sm ${textCls} font-medium`}>{alert.message}</span>
          </div>
        );
      })}
    </div>
  );
}
