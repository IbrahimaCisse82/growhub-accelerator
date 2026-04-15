import Pill from "@/components/shared/Pill";

interface GrantAlertsPanelProps {
  grant: any;
  budgetLines: any[];
  transactions: any[];
  reports: any[];
  activities: any[];
  disbursements: any[];
}

/**
 * Auto-compute risk score based on Enabel thresholds:
 * - Budget overspend, delayed activities, low disbursement, missing reports
 * Score: 0-100 where lower = higher risk (Enabel convention)
 */
function computeRiskScore(grant: any, budgetLines: any[], transactions: any[], reports: any[], activities: any[], disbursements: any[]): number {
  let score = 100;

  // Budget overspend penalty (-25 if over, -10 if >85%)
  const totalPlanned = budgetLines.reduce((s: number, b: any) => s + (b.amount_planned ?? 0), 0);
  const totalSpent = transactions.reduce((s: number, t: any) => s + (t.amount ?? 0), 0);
  if (totalPlanned > 0) {
    const ratio = totalSpent / totalPlanned;
    if (ratio > 1) score -= 25;
    else if (ratio > 0.85) score -= 10;
  }

  // Delayed activities penalty (-5 each, max -20)
  const delayed = activities.filter((a: any) => a.status === "delayed").length;
  score -= Math.min(delayed * 5, 20);

  // Overdue activities penalty (-5 each, max -20)
  const overdue = activities.filter((a: any) => a.end_date && new Date(a.end_date) < new Date() && a.status !== "completed").length;
  score -= Math.min(overdue * 5, 20);

  // Low disbursement rate penalty (-15 if <25% disbursed after 50% time elapsed)
  if (grant.amount_total > 0 && grant.end_date && grant.start_date) {
    const totalDays = Math.max(1, (new Date(grant.end_date).getTime() - new Date(grant.start_date).getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.max(0, (Date.now() - new Date(grant.start_date).getTime()) / (1000 * 60 * 60 * 24));
    const elapsedPct = (elapsedDays / totalDays) * 100;
    const disbursedPct = ((grant.amount_disbursed ?? 0) / grant.amount_total) * 100;
    if (elapsedPct > 50 && disbursedPct < 25) score -= 15;
  }

  // No reports penalty (-10 if no reports and not draft)
  if (reports.length === 0 && grant.status !== "draft") score -= 10;

  // Grant expired penalty (-15)
  if (grant.end_date) {
    const daysLeft = Math.ceil((new Date(grant.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) score -= 15;
    else if (daysLeft <= 30) score -= 5;
  }

  // Pending disbursements (info, minor penalty)
  const pending = disbursements.filter((d: any) => d.status === "pending").length;
  if (pending > 2) score -= 5;

  return Math.max(0, Math.min(100, score));
}

function getRiskLevel(score: number): { label: string; color: "green" | "blue" | "amber" | "gray" } {
  if (score >= 76) return { label: "Faible risque", color: "green" };
  if (score >= 51) return { label: "Risque modéré", color: "blue" };
  if (score >= 31) return { label: "Risque important", color: "amber" };
  return { label: "Risque élevé", color: "gray" };
}

export default function GrantAlertsPanel({ grant, budgetLines, transactions, reports, activities, disbursements }: GrantAlertsPanelProps) {
  const alerts: { type: "danger" | "warning" | "info"; message: string }[] = [];

  // Auto risk score
  const riskScore = computeRiskScore(grant, budgetLines, transactions, reports, activities, disbursements);
  const risk = getRiskLevel(riskScore);

  // Budget overspend
  const totalPlanned = budgetLines.reduce((s, b: any) => s + (b.amount_planned ?? 0), 0);
  const totalSpent = transactions.reduce((s, t: any) => s + (t.amount ?? 0), 0);
  if (totalPlanned > 0 && totalSpent > totalPlanned) {
    alerts.push({ type: "danger", message: `Budget dépassé : ${Math.round(((totalSpent - totalPlanned) / totalPlanned) * 100)}% au-dessus du planifié` });
  } else if (totalPlanned > 0 && totalSpent / totalPlanned > 0.85) {
    alerts.push({ type: "warning", message: `Budget bientôt épuisé : ${Math.round((totalSpent / totalPlanned) * 100)}% consommé` });
  }

  // Grant end date approaching
  if (grant.end_date) {
    const daysLeft = Math.ceil((new Date(grant.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) {
      alerts.push({ type: "danger", message: `Grant expiré depuis ${Math.abs(daysLeft)} jours` });
    } else if (daysLeft <= 30) {
      alerts.push({ type: "warning", message: `Échéance dans ${daysLeft} jours (${grant.end_date})` });
    } else if (daysLeft <= 90) {
      alerts.push({ type: "info", message: `Échéance dans ${daysLeft} jours (${grant.end_date})` });
    }
  }

  // Delayed activities
  const delayedActivities = activities.filter((a: any) => a.status === "delayed");
  if (delayedActivities.length > 0) {
    alerts.push({ type: "warning", message: `${delayedActivities.length} activité(s) en retard` });
  }

  // Overdue activities
  const overdueActivities = activities.filter((a: any) => a.end_date && new Date(a.end_date) < new Date() && a.status !== "completed");
  if (overdueActivities.length > 0) {
    alerts.push({ type: "danger", message: `${overdueActivities.length} activité(s) avec échéance dépassée` });
  }

  // Pending disbursements
  const pendingDisbursements = disbursements.filter((d: any) => d.status === "pending");
  if (pendingDisbursements.length > 0) {
    alerts.push({ type: "info", message: `${pendingDisbursements.length} demande(s) de décaissement en attente` });
  }

  // Low disbursement rate
  if (grant.amount_total > 0) {
    const disbursedPct = ((grant.amount_disbursed ?? 0) / grant.amount_total) * 100;
    if (grant.end_date) {
      const totalDays = Math.max(1, (new Date(grant.end_date).getTime() - new Date(grant.start_date ?? grant.created_at).getTime()) / (1000 * 60 * 60 * 24));
      const elapsedDays = Math.max(0, (Date.now() - new Date(grant.start_date ?? grant.created_at).getTime()) / (1000 * 60 * 60 * 24));
      const elapsedPct = (elapsedDays / totalDays) * 100;
      if (elapsedPct > 50 && disbursedPct < 25) {
        alerts.push({ type: "warning", message: `Taux de décaissement faible (${Math.round(disbursedPct)}%) malgré ${Math.round(elapsedPct)}% du temps écoulé` });
      }
    }
  }

  // No reports submitted
  if (reports.length === 0 && grant.status !== "draft") {
    alerts.push({ type: "info", message: "Aucun rapport financier soumis" });
  }

  return (
    <div className="space-y-2">
      {/* Risk score banner */}
      <div className={`border rounded-xl px-4 py-3 flex items-center justify-between ${
        risk.color === "green" ? "bg-green-500/10 border-green-500/20" :
        risk.color === "blue" ? "bg-primary/10 border-primary/20" :
        risk.color === "amber" ? "bg-amber-500/10 border-amber-500/20" :
        "bg-destructive/10 border-destructive/20"
      }`}>
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold text-foreground">Score de risque automatique</div>
          <Pill color={risk.color}>{risk.label}</Pill>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${
              riskScore >= 76 ? "bg-green-500" : riskScore >= 51 ? "bg-primary" : riskScore >= 31 ? "bg-amber-500" : "bg-destructive"
            }`} style={{ width: `${riskScore}%` }} />
          </div>
          <span className="font-mono text-sm font-bold text-foreground">{riskScore}/100</span>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-center gap-2">
          <span className="text-green-500">✓</span>
          <span className="text-sm text-green-500 font-medium">Aucune alerte — tout est en ordre</span>
        </div>
      ) : (
        alerts.map((alert, i) => {
          const bgCls = alert.type === "danger" ? "bg-destructive/10 border-destructive/20" : alert.type === "warning" ? "bg-amber-500/10 border-amber-500/20" : "bg-primary/10 border-primary/20";
          const textCls = alert.type === "danger" ? "text-destructive" : alert.type === "warning" ? "text-amber-500" : "text-primary";
          return (
            <div key={i} className={`${bgCls} border rounded-xl px-4 py-2.5 flex items-center gap-2`}>
              <span className={`text-sm ${textCls} font-medium`}>{alert.message}</span>
            </div>
          );
        })
      )}
    </div>
  );
}
