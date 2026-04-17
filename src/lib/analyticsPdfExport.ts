/**
 * Rich Analytics PDF export — opens a new window with formatted report
 * and triggers print dialog (user can save as PDF).
 */

interface AnalyticsReportData {
  title: string;
  period: string;
  generatedAt: string;
  topStats: { label: string; value: string | number; note?: string }[];
  impactKpis: { label: string; value: string | number; note?: string }[];
  projectsByStatus: { name: string; value: number }[];
  grantsByStatus: { name: string; value: number }[];
  cohortRetention: { name: string; total: number; active: number; graduated: number; retentionPct: number }[];
  appFunnel: { name: string; value: number }[];
  topStartups?: { name: string; score: number; sector?: string }[];
}

export function exportAnalyticsToPDF(data: AnalyticsReportData) {
  const css = `<style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:40px;color:#1a1a1a;background:#fff}
    h1{font-size:24px;margin-bottom:6px;color:#0a0a0a}
    h2{font-size:14px;margin:24px 0 12px 0;color:#1a1a1a;border-bottom:2px solid #e4e4e7;padding-bottom:6px;text-transform:uppercase;letter-spacing:0.5px}
    .meta{color:#666;font-size:11px;margin-bottom:24px}
    .stats-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:8px}
    .impact-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
    .stat{background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;padding:12px}
    .stat .label{font-size:9px;color:#666;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px}
    .stat .value{font-size:18px;font-weight:700;color:#0a0a0a;font-family:ui-monospace,monospace}
    .stat .note{font-size:9px;color:#888;margin-top:2px}
    table{width:100%;border-collapse:collapse;font-size:11px;margin-top:8px}
    th{background:#f4f4f5;padding:8px 10px;text-align:left;border-bottom:2px solid #e4e4e7;font-weight:600;text-transform:uppercase;font-size:9px;letter-spacing:0.5px}
    td{padding:7px 10px;border-bottom:1px solid #e4e4e7}
    .bar-row{display:flex;align-items:center;gap:8px;margin:4px 0;font-size:11px}
    .bar-row .name{width:140px;flex-shrink:0;color:#333}
    .bar-row .bar{flex:1;height:14px;background:#f4f4f5;border-radius:4px;overflow:hidden;position:relative}
    .bar-row .bar-fill{height:100%;background:linear-gradient(90deg,#00cea8,#0aa)}
    .bar-row .val{width:40px;text-align:right;font-family:ui-monospace,monospace;color:#666;font-size:10px}
    .funnel-step{background:#fafafa;border:1px solid #e4e4e7;border-radius:6px;padding:8px 12px;margin:4px 0;display:flex;justify-content:space-between;align-items:center;font-size:11px}
    .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e4e4e7;font-size:9px;color:#888;text-align:center}
    @media print{body{padding:20px}h2{page-break-after:avoid}}
    @page{margin:1.5cm;size:A4}
  </style>`;

  const statsHtml = data.topStats.map(s => `
    <div class="stat">
      <div class="label">${s.label}</div>
      <div class="value">${s.value}</div>
      ${s.note ? `<div class="note">${s.note}</div>` : ""}
    </div>
  `).join("");

  const impactHtml = data.impactKpis.map(s => `
    <div class="stat">
      <div class="label">${s.label}</div>
      <div class="value">${s.value}</div>
      ${s.note ? `<div class="note">${s.note}</div>` : ""}
    </div>
  `).join("");

  const maxProj = Math.max(...data.projectsByStatus.map(p => p.value), 1);
  const projHtml = data.projectsByStatus.map(p => `
    <div class="bar-row">
      <div class="name">${p.name}</div>
      <div class="bar"><div class="bar-fill" style="width:${(p.value / maxProj) * 100}%"></div></div>
      <div class="val">${p.value}</div>
    </div>
  `).join("");

  const maxGrant = Math.max(...data.grantsByStatus.map(g => g.value), 1);
  const grantHtml = data.grantsByStatus.map(g => `
    <div class="bar-row">
      <div class="name">${g.name}</div>
      <div class="bar"><div class="bar-fill" style="width:${(g.value / maxGrant) * 100}%"></div></div>
      <div class="val">${g.value}</div>
    </div>
  `).join("");

  const cohortHtml = data.cohortRetention.length === 0 ? "<p style='color:#888;font-size:11px'>Aucune donnée</p>" : `
    <table>
      <thead><tr><th>Cohorte</th><th>Total</th><th>Actives</th><th>Graduées</th><th>Rétention</th></tr></thead>
      <tbody>
        ${data.cohortRetention.map(c => `
          <tr>
            <td>${c.name}</td>
            <td>${c.total}</td>
            <td>${c.active}</td>
            <td>${c.graduated}</td>
            <td><strong>${c.retentionPct}%</strong></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  const funnelHtml = data.appFunnel.map(f => `
    <div class="funnel-step">
      <span>${f.name}</span>
      <strong style="font-family:ui-monospace,monospace">${f.value}</strong>
    </div>
  `).join("");

  const topHtml = data.topStartups && data.topStartups.length > 0 ? `
    <h2>Top 10 Startups</h2>
    <table>
      <thead><tr><th>Rang</th><th>Startup</th><th>Secteur</th><th>Health Score</th></tr></thead>
      <tbody>
        ${data.topStartups.slice(0, 10).map((s, i) => `
          <tr>
            <td>${i + 1}</td>
            <td><strong>${s.name}</strong></td>
            <td>${s.sector ?? "—"}</td>
            <td>${s.score}/100</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  ` : "";

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${data.title}</title>${css}</head><body>
    <h1>${data.title}</h1>
    <div class="meta">Période : ${data.period} · Généré le ${data.generatedAt}</div>

    <h2>Indicateurs principaux</h2>
    <div class="stats-grid">${statsHtml}</div>

    <h2>Indicateurs d'impact</h2>
    <div class="impact-grid">${impactHtml}</div>

    <h2>Projets par statut</h2>
    ${projHtml || "<p style='color:#888;font-size:11px'>Aucun projet</p>"}

    <h2>Financements par statut</h2>
    ${grantHtml || "<p style='color:#888;font-size:11px'>Aucun financement</p>"}

    <h2>Rétention par cohorte</h2>
    ${cohortHtml}

    <h2>Funnel candidatures</h2>
    ${funnelHtml || "<p style='color:#888;font-size:11px'>Aucune candidature</p>"}

    ${topHtml}

    <div class="footer">Grow Hub Management System — Rapport Analytics confidentiel</div>
  </body></html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 400);
  }
}
