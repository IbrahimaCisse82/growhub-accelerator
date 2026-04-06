/**
 * Export project document as a structured PDF (sections 1→4)
 */

interface ProjectPdfData {
  project: Record<string, any>;
  logFrame: Record<string, any> | null;
  indicators: Record<string, any>[];
  budgetLines: Record<string, any>[];
}

export function exportProjectPdf({ project, logFrame, indicators, budgetLines }: ProjectPdfData) {
  const meta = (project.metadata ?? {}) as Record<string, unknown>;
  const totalBudget = budgetLines.reduce((s, l) => s + (Number(l.total_cost) || 0), 0);

  const css = `
    <style>
      @page { margin: 25mm 20mm; }
      body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1a1a2e; line-height: 1.6; padding: 40px; }
      .cover { text-align: center; padding: 80px 0 60px; border-bottom: 3px solid #2563eb; margin-bottom: 40px; }
      .cover h1 { font-size: 28px; font-weight: 800; color: #1a1a2e; margin: 0 0 8px; }
      .cover .code { font-family: monospace; font-size: 13px; color: #6b7280; }
      .cover .meta { font-size: 12px; color: #6b7280; margin-top: 16px; }
      h2 { font-size: 18px; font-weight: 700; color: #1e3a5f; margin: 32px 0 8px; border-left: 4px solid #2563eb; padding-left: 12px; }
      h3 { font-size: 14px; font-weight: 600; color: #374151; margin: 20px 0 6px; }
      p, li { font-size: 13px; color: #374151; }
      .field { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 12px; }
      .field-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 6px; }
      .field-value { font-size: 13px; color: #1f2937; white-space: pre-line; }
      ul { padding-left: 20px; }
      li { margin-bottom: 4px; }
      .os-label { color: #2563eb; font-weight: 600; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 12px; }
      th { background: #f1f5f9; padding: 8px 10px; text-align: left; border-bottom: 2px solid #e2e8f0; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
      td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
      .total-row { background: #f1f5f9; font-weight: 700; }
      .indicator-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding: 8px 12px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; }
      .indicator-name { font-weight: 600; font-size: 12px; flex: 1; }
      .indicator-values { font-size: 11px; color: #6b7280; font-family: monospace; }
      @media print { body { padding: 0; } .cover { padding: 40px 0 30px; } }
    </style>
  `;

  function field(label: string, value: string | undefined | null): string {
    if (!value) return "";
    return `<div class="field"><div class="field-label">${label}</div><div class="field-value">${escapeHtml(value)}</div></div>`;
  }

  // Cover
  let html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>${escapeHtml(project.name)}</title>${css}</head><body>`;
  html += `<div class="cover">`;
  html += `<h1>${escapeHtml(project.name)}</h1>`;
  if (project.code) html += `<div class="code">${escapeHtml(project.code)}</div>`;
  html += `<div class="meta">`;
  if (project.programs?.name) html += `Programme : ${escapeHtml(project.programs.name)}<br/>`;
  if (project.country) html += `Pays : ${escapeHtml(project.country)}<br/>`;
  if (project.duration_months) html += `Durée : ${project.duration_months} mois<br/>`;
  html += `Exporté le ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`;
  html += `</div></div>`;

  // 1. Introduction
  html += `<h2>1. Introduction</h2>`;
  html += field("Description du projet", project.description);
  html += field("Introduction", meta.introduction as string);
  if (project.country) html += field("Pays", project.country);
  if (project.locations && (project.locations as string[]).length > 0) {
    html += `<div class="field"><div class="field-label">Lieux d'implémentation</div><div class="field-value">${(project.locations as string[]).join(", ")}</div></div>`;
  }
  if (project.start_date) html += field("Date de début", new Date(project.start_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }));
  if (project.end_date) html += field("Date de fin", new Date(project.end_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }));

  // 2. Contexte & Justification
  html += `<h2>2. Contexte et justification du projet</h2>`;
  html += field("Contexte et justification", meta.contexte_justification as string);
  html += field("2.1. Contexte territorial", meta.contexte_territorial as string);
  html += field("2.2. Contraintes structurelles et vulnérabilités", meta.contraintes_vulnerabilites as string);
  html += field("2.3. Alignement avec les orientations stratégiques", meta.alignement_strategique as string);
  html += field("2.4. Justification de l'intervention", meta.justification as string);

  // 3. Objectifs
  html += `<h2>3. Objectif général et spécifiques du projet</h2>`;
  if (logFrame?.overall_objective) {
    html += `<h3>3.1. Objectif général du projet</h3>`;
    html += field("Objectif général", logFrame.overall_objective);
  }
  if (logFrame?.specific_objectives && Array.isArray(logFrame.specific_objectives) && logFrame.specific_objectives.length > 0) {
    html += `<h3>3.2. Objectifs spécifiques</h3>`;
    html += `<ul>`;
    (logFrame.specific_objectives as string[]).forEach((obj, i) => {
      html += `<li><span class="os-label">OS${i + 1}.</span> ${escapeHtml(typeof obj === "string" ? obj : JSON.stringify(obj))}</li>`;
    });
    html += `</ul>`;
  }

  // 4. Résultats attendus
  html += `<h2>4. Résultats attendus</h2>`;
  if (logFrame?.expected_results && Array.isArray(logFrame.expected_results) && logFrame.expected_results.length > 0) {
    html += `<ul>`;
    (logFrame.expected_results as string[]).forEach((r, i) => {
      html += `<li><span class="os-label">R${i + 1}.</span> ${escapeHtml(typeof r === "string" ? r : JSON.stringify(r))}</li>`;
    });
    html += `</ul>`;
  }

  // Indicators
  if (indicators.length > 0) {
    html += `<h3>Indicateurs de performance (${indicators.length})</h3>`;
    indicators.forEach(ind => {
      html += `<div class="indicator-bar"><span class="indicator-name">${escapeHtml(ind.name)}</span>`;
      html += `<span class="indicator-values">`;
      if (ind.target_value != null) html += `Cible: ${ind.target_value} ${ind.unit ?? ""}`;
      if (ind.current_value != null) html += ` | Actuel: ${ind.current_value}`;
      html += `</span></div>`;
    });
  }

  // Budget
  if (budgetLines.length > 0) {
    html += `<h2>Annexe — Budget</h2>`;
    html += `<table><thead><tr><th>Poste</th><th>Catégorie</th><th>Qté × Coût unit.</th><th>Total</th></tr></thead><tbody>`;
    budgetLines.forEach(line => {
      html += `<tr>`;
      html += `<td>${escapeHtml(line.label)}</td>`;
      html += `<td>${escapeHtml(line.category)}</td>`;
      html += `<td>${line.quantity ?? 1} × ${Number(line.unit_cost ?? 0).toLocaleString("fr-FR")}</td>`;
      html += `<td>${Number(line.total_cost ?? 0).toLocaleString("fr-FR")} XOF</td>`;
      html += `</tr>`;
    });
    html += `<tr class="total-row"><td colspan="3">Total général</td><td>${totalBudget.toLocaleString("fr-FR")} XOF</td></tr>`;
    html += `</tbody></table>`;
  }

  html += `</body></html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
