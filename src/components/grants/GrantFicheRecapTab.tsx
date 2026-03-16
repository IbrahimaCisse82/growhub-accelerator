import Pill from "@/components/shared/Pill";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);

interface Report {
  id: string;
  period_label: string;
  period_type: string;
  status: string;
  amount_declared: number | null;
  amount_validated: number | null;
  amount_received: number | null;
  submitted_at: string | null;
  start_date: string | null;
  end_date: string | null;
}

interface Disbursement {
  id: string;
  tranche_number: number;
  label: string;
  status: string;
  amount_requested: number;
  amount_approved: number | null;
  amount_received: number | null;
  requested_at: string | null;
  approved_at: string | null;
  received_at: string | null;
}

interface GrantFicheRecapTabProps {
  grant: {
    name: string;
    code: string;
    organization: string | null;
    amount_total: number;
    amount_disbursed: number | null;
    currency: string | null;
    start_date: string | null;
    end_date: string | null;
  };
  reports: Report[];
  disbursements: Disbursement[];
}

const statusColor = (s: string): "green" | "blue" | "amber" | "gray" => {
  if (s === "validated" || s === "received" || s === "approuve") return "green";
  if (s === "submitted" || s === "approved" || s === "soumis") return "blue";
  if (s === "pending") return "amber";
  return "gray";
};

export default function GrantFicheRecapTab({ grant, reports, disbursements }: GrantFicheRecapTabProps) {
  const totalDeclared = reports.reduce((s, r) => s + (r.amount_declared ?? 0), 0);
  const totalValidated = reports.reduce((s, r) => s + (r.amount_validated ?? 0), 0);
  const totalReportReceived = reports.reduce((s, r) => s + (r.amount_received ?? 0), 0);
  const totalRequested = disbursements.reduce((s, d) => s + (d.amount_requested ?? 0), 0);
  const totalApproved = disbursements.reduce((s, d) => s + (d.amount_approved ?? 0), 0);
  const totalDisbReceived = disbursements.reduce((s, d) => s + (d.amount_received ?? 0), 0);
  const pctDisb = grant.amount_total > 0 ? Math.round((totalDisbReceived / grant.amount_total) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Header info */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-[10px] text-muted-foreground font-mono uppercase">Convention</div>
            <div className="font-semibold text-foreground">{grant.code}</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground font-mono uppercase">Organisation</div>
            <div className="font-semibold text-foreground">{grant.organization ?? "—"}</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground font-mono uppercase">Budget total</div>
            <div className="font-mono font-bold text-primary">{fmt(grant.amount_total)} €</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground font-mono uppercase">Période</div>
            <div className="font-mono text-foreground">{grant.start_date ?? "—"} → {grant.end_date ?? "—"}</div>
          </div>
        </div>
      </div>

      {/* Disbursement summary table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">Tableau des versements</span>
          <span className="font-mono text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">{pctDisb}% reçu</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="bg-secondary">
                {["N°", "Libellé", "Montant demandé", "Montant approuvé", "Date approbation", "Versement", "Date paiement", "Montant reçu", "Statut"].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-[10px] font-mono uppercase text-muted-foreground tracking-wider border-b border-border whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {disbursements.length === 0 ? (
                <tr><td colSpan={9} className="px-3 py-8 text-center text-sm text-muted-foreground">Aucun versement enregistré</td></tr>
              ) : (
                <>
                  {disbursements.map((d, i) => (
                    <tr key={d.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                      <td className="px-3 py-2.5 font-mono font-semibold text-foreground">{String(d.tranche_number).padStart(2, "0")}</td>
                      <td className="px-3 py-2.5 text-foreground font-semibold">{d.label}</td>
                      <td className="px-3 py-2.5 font-mono text-foreground">{fmt(d.amount_requested)} €</td>
                      <td className="px-3 py-2.5 font-mono text-primary">{fmt(d.amount_approved ?? 0)} €</td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground text-[11px]">{d.approved_at ? new Date(d.approved_at).toLocaleDateString("fr-FR") : "—"}</td>
                      <td className="px-3 py-2.5 text-foreground">Versement n° {String(d.tranche_number).padStart(2, "0")}</td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground text-[11px]">{d.received_at ? new Date(d.received_at).toLocaleDateString("fr-FR") : "—"}</td>
                      <td className="px-3 py-2.5 font-mono font-semibold text-green-500">{fmt(d.amount_received ?? 0)} €</td>
                      <td className="px-3 py-2.5"><Pill color={statusColor(d.status)}>{d.status === "pending" ? "En attente" : d.status === "approved" ? "Approuvé" : d.status === "received" ? "Reçu" : d.status}</Pill></td>
                    </tr>
                  ))}
                  <tr className="bg-foreground/5 font-bold">
                    <td colSpan={2} className="px-3 py-2.5 text-right text-[11px] text-foreground uppercase">Totaux</td>
                    <td className="px-3 py-2.5 font-mono text-foreground">{fmt(totalRequested)} €</td>
                    <td className="px-3 py-2.5 font-mono text-primary">{fmt(totalApproved)} €</td>
                    <td className="px-3 py-2.5" />
                    <td className="px-3 py-2.5" />
                    <td className="px-3 py-2.5" />
                    <td className="px-3 py-2.5 font-mono text-green-500">{fmt(totalDisbReceived)} €</td>
                    <td className="px-3 py-2.5" />
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reports summary table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <span className="text-xs font-bold text-foreground">Rapports financiers — Synthèse</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="bg-secondary">
                {["Période", "Type", "Début", "Fin", "Soumis le", "Déclaré", "Validé", "Reçu", "Statut"].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-[10px] font-mono uppercase text-muted-foreground tracking-wider border-b border-border whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr><td colSpan={9} className="px-3 py-8 text-center text-sm text-muted-foreground">Aucun rapport financier</td></tr>
              ) : (
                <>
                  {reports.map(r => (
                    <tr key={r.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                      <td className="px-3 py-2.5 font-semibold text-foreground">{r.period_label}</td>
                      <td className="px-3 py-2.5 text-muted-foreground capitalize">{r.period_type === "quarterly" ? "Trim." : r.period_type === "semiannual" ? "Sem." : "An."}</td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground text-[11px]">{r.start_date ?? "—"}</td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground text-[11px]">{r.end_date ?? "—"}</td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground text-[11px]">{r.submitted_at ? new Date(r.submitted_at).toLocaleDateString("fr-FR") : "—"}</td>
                      <td className="px-3 py-2.5 font-mono text-foreground">{fmt(r.amount_declared ?? 0)} €</td>
                      <td className="px-3 py-2.5 font-mono text-primary">{fmt(r.amount_validated ?? 0)} €</td>
                      <td className="px-3 py-2.5 font-mono text-green-500">{fmt(r.amount_received ?? 0)} €</td>
                      <td className="px-3 py-2.5"><Pill color={statusColor(r.status)}>{r.status === "draft" ? "Brouillon" : r.status === "submitted" ? "Soumis" : r.status === "validated" ? "Validé" : r.status}</Pill></td>
                    </tr>
                  ))}
                  <tr className="bg-foreground/5 font-bold">
                    <td colSpan={5} className="px-3 py-2.5 text-right text-[11px] text-foreground uppercase">Totaux</td>
                    <td className="px-3 py-2.5 font-mono text-foreground">{fmt(totalDeclared)} €</td>
                    <td className="px-3 py-2.5 font-mono text-primary">{fmt(totalValidated)} €</td>
                    <td className="px-3 py-2.5 font-mono text-green-500">{fmt(totalReportReceived)} €</td>
                    <td className="px-3 py-2.5" />
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
