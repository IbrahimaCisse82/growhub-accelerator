/**
 * Export project document as a structured PDF — aligned with the PAERID DOCX template (20 sections)
 */

interface ProjectPdfData {
  project: Record<string, any>;
  logFrame: Record<string, any> | null;
  toc: Record<string, any> | null;
  indicators: Record<string, any>[];
  budgetLines: Record<string, any>[];
  budgetDetails: Record<string, any>[];
  risks: Record<string, any>[];
  milestones: Record<string, any>[];
  partners: Record<string, any>[];
}

export function exportProjectPdf({ project, logFrame, toc, indicators, budgetLines, budgetDetails, risks, milestones, partners }: ProjectPdfData) {
  const meta = (project.metadata ?? {}) as Record<string, unknown>;
  const totalBudget = budgetLines.reduce((s, l) => s + (Number(l.total_cost) || 0), 0);
  const contingencyPct = Number(meta.contingency_pct ?? 7) / 100;
  const totalWithContingency = Math.round(totalBudget * (1 + contingencyPct));

  const css = `<style>
    @page { margin: 25mm 20mm; size: A4; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1a1a2e; line-height: 1.65; padding: 40px; max-width: 800px; margin: 0 auto; }
    .cover { text-align: center; padding: 100px 0 60px; border-bottom: 3px solid #1e3a5f; margin-bottom: 40px; page-break-after: always; }
    .cover h1 { font-size: 26px; font-weight: 800; color: #1a1a2e; margin: 0 0 6px; }
    .cover .subtitle { font-size: 16px; font-weight: 600; color: #1e3a5f; margin: 0 0 24px; }
    .cover .code { font-family: monospace; font-size: 12px; color: #6b7280; }
    .cover-table { width: 80%; margin: 24px auto 0; border-collapse: collapse; font-size: 12px; text-align: left; }
    .cover-table td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; }
    .cover-table td:first-child { font-weight: 600; color: #374151; width: 40%; }
    .footer-note { font-size: 10px; color: #9ca3af; margin-top: 40px; }
    .toc { page-break-after: always; }
    .toc h2 { font-size: 18px; border: none; padding: 0; margin-bottom: 16px; }
    .toc ul { list-style: none; padding: 0; }
    .toc li { padding: 4px 0; font-size: 13px; border-bottom: 1px dotted #d1d5db; }
    .toc li span { color: #6b7280; float: right; }
    .toc .indent { padding-left: 20px; }
    h2 { font-size: 17px; font-weight: 700; color: #1e3a5f; margin: 36px 0 10px; border-left: 4px solid #2563eb; padding-left: 12px; page-break-after: avoid; }
    h3 { font-size: 14px; font-weight: 600; color: #374151; margin: 20px 0 8px; }
    h4 { font-size: 13px; font-weight: 600; color: #4b5563; margin: 14px 0 6px; }
    p, li { font-size: 12.5px; color: #374151; }
    .field { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 14px; margin-bottom: 10px; }
    .field-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #6b7280; margin-bottom: 4px; }
    .field-value { font-size: 12.5px; color: #1f2937; white-space: pre-line; }
    ul { padding-left: 18px; }
    li { margin-bottom: 3px; }
    .os-label { color: #2563eb; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; margin-bottom: 14px; }
    th { background: #f1f5f9; padding: 7px 8px; text-align: left; border-bottom: 2px solid #cbd5e1; font-weight: 700; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; }
    td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
    .total-row { background: #f1f5f9; font-weight: 700; }
    .risk-high { color: #dc2626; font-weight: 600; }
    .risk-medium { color: #d97706; font-weight: 600; }
    .risk-low { color: #16a34a; font-weight: 600; }
    .section-break { page-break-before: always; }
    @media print { body { padding: 0; } .cover { padding: 60px 0 40px; } }
  </style>`;

  const e = escapeHtml;
  const f = (label: string, value: string | undefined | null): string => {
    if (!value) return "";
    return `<div class="field"><div class="field-label">${label}</div><div class="field-value">${e(value)}</div></div>`;
  };
  const nl = (v: unknown): string => typeof v === "string" ? v : (Array.isArray(v) ? v.join("\n") : JSON.stringify(v ?? ""));
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const fmtNum = (n: number) => n.toLocaleString("fr-FR");

  let html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>${e(project.name)}</title>${css}</head><body>`;

  // ═══════════════ COVER PAGE ═══════════════
  html += `<div class="cover">`;
  html += `<h1>${e(project.name)}</h1>`;
  html += `<div class="subtitle">DOCUMENT DE PROJET</div>`;
  if (project.code) html += `<div class="code">${e(project.code)}</div>`;
  html += `<table class="cover-table">`;
  const coverFields: [string, string | undefined][] = [
    ["Pays", project.country],
    ["Zones d'intervention", (project.locations as string[])?.join(", ") || nl(meta.lieux_implementation) as string],
    ["Durée", project.duration_months ? `${project.duration_months} mois` : nl(meta.duree_programme) as string],
    ["Secteurs prioritaires", nl(meta.secteurs_prioritaires) as string],
    ["Porteur du projet", nl(meta.porteur) as string],
    ["Budget du projet", totalWithContingency ? `${fmtNum(totalWithContingency)} USD` : nl(meta.budget_total_label) as string],
    ["Alignement ODD", nl(meta.alignement_odd) as string],
    ["Version du document", nl(meta.version_document) as string],
  ];
  coverFields.forEach(([label, val]) => {
    if (val) html += `<tr><td>${e(label)}</td><td>${e(val)}</td></tr>`;
  });
  html += `</table>`;
  html += `<div class="footer-note">Document de projet — Usage interne et soumission aux bailleurs de fonds</div>`;
  html += `</div>`;

  // ═══════════════ TABLE DES MATIÈRES ═══════════════
  html += `<div class="toc"><h2>TABLE DES MATIÈRES</h2><ul>`;
  const tocEntries = [
    ["0", "Liste des abréviations"],
    ["1", "Résumé exécutif"],
    ["2", "Description du projet"],
    ["3", "Introduction"],
    ["4", "Contexte et justification du projet"],
    ["", "4.1 Contexte territorial", true],
    ["", "4.2 Contraintes structurelles et vulnérabilités", true],
    ["", "4.3 Alignement stratégique", true],
    ["", "4.4 Justification de l'intervention", true],
    ["5", "Théorie du changement"],
    ["6", "Objectif général et objectifs spécifiques"],
    ["7", "Résultats attendus"],
    ["", "7.1 Tableau des indicateurs KPIs", true],
    ["8", "Stratégie d'implémentation du projet"],
    ["9", "Méthodologie"],
    ["10", "Durée du programme"],
    ["11", "Lieu(x) d'implémentation"],
    ["12", "Population cible / Bénéficiaires"],
    ["13", "Personnel clé"],
    ["14", "Partenaires cibles du programme"],
    ["15", "Suivi et évaluation"],
    ["16", "Plan de sortie / Stratégie de durabilité"],
    ["17", "Analyse des risques et mesures d'atténuation"],
    ["18", "Annexe : Budget prévisionnel"],
    ["19", "Cadre logique du programme"],
  ];
  tocEntries.forEach(([num, label, indent]) => {
    html += `<li class="${indent ? "indent" : ""}">${num ? `${num}. ` : ""}${label}</li>`;
  });
  html += `</ul></div>`;

  // ═══════════════ 0. ABRÉVIATIONS ═══════════════
  html += `<h2>0. Liste des abréviations</h2>`;
  html += f("Abréviations", nl(meta.abreviations));

  // ═══════════════ 1. RÉSUMÉ EXÉCUTIF ═══════════════
  html += `<h2>1. Résumé exécutif</h2>`;
  html += f("Résumé exécutif", nl(meta.resume_executif));

  // ═══════════════ 2. DESCRIPTION DU PROJET ═══════════════
  html += `<h2>2. Description du projet</h2>`;
  html += f("Description", nl(meta.description_projet) || project.description);

  // ═══════════════ 3. INTRODUCTION ═══════════════
  html += `<h2 class="section-break">3. Introduction</h2>`;
  html += f("Introduction", nl(meta.introduction));
  if (project.country) html += f("Pays", project.country);
  if (project.start_date) html += f("Date de début", fmtDate(project.start_date));
  if (project.end_date) html += f("Date de fin", fmtDate(project.end_date));

  // ═══════════════ 4. CONTEXTE ET JUSTIFICATION ═══════════════
  html += `<h2>4. Contexte et justification du projet</h2>`;
  html += f("Contexte et justification", nl(meta.contexte_justification));
  html += `<h3>4.1. Contexte territorial</h3>`;
  html += f("Contexte territorial", nl(meta.contexte_territorial));
  html += `<h3>4.2. Contraintes structurelles et vulnérabilités</h3>`;
  html += f("Contraintes", nl(meta.contraintes) || nl(meta.contraintes_vulnerabilites));
  html += `<h3>4.3. Alignement stratégique</h3>`;
  html += f("Alignement", nl(meta.alignement_strategique));
  html += `<h3>4.4. Justification de l'intervention</h3>`;
  html += f("Justification", nl(meta.justification));

  // ═══════════════ 5. THÉORIE DU CHANGEMENT ═══════════════
  html += `<h2 class="section-break">5. Théorie du changement</h2>`;
  if (meta.theorie_changement) {
    html += f("Théorie du changement", nl(meta.theorie_changement));
  }
  if (toc) {
    if (toc.inputs) html += f("Intrants", nl(toc.inputs));
    if (toc.activities) html += f("Activités", nl(toc.activities));
    if (toc.outputs) html += f("Extrants (Outputs)", nl(toc.outputs));
    if (toc.outcomes) html += f("Effets (Outcomes)", nl(toc.outcomes));
    if (toc.impact) html += f("Impact", nl(toc.impact));
    if (toc.assumptions) html += f("Hypothèses clés", nl(toc.assumptions));
    if (toc.risks) html += f("Risques identifiés", nl(toc.risks));
  }

  // ═══════════════ 6. OBJECTIFS ═══════════════
  html += `<h2>6. Objectif général et objectifs spécifiques du projet</h2>`;
  if (logFrame?.overall_objective) {
    html += `<h3>6.1. Objectif général du projet</h3>`;
    html += f("Objectif général", logFrame.overall_objective);
  }
  if (logFrame?.specific_objectives && Array.isArray(logFrame.specific_objectives) && logFrame.specific_objectives.length > 0) {
    html += `<h3>6.2. Objectifs spécifiques</h3><ul>`;
    (logFrame.specific_objectives as string[]).forEach((obj, i) => {
      html += `<li><span class="os-label">OS${i + 1} :</span> ${e(typeof obj === "string" ? obj : JSON.stringify(obj))}</li>`;
    });
    html += `</ul>`;
  }

  // ═══════════════ 7. RÉSULTATS ATTENDUS ═══════════════
  html += `<h2>7. Résultats attendus</h2>`;
  if (meta.resultats_attendus) {
    html += f("Résultats attendus", nl(meta.resultats_attendus));
  }
  if (logFrame?.expected_results && Array.isArray(logFrame.expected_results) && logFrame.expected_results.length > 0) {
    html += `<ul>`;
    (logFrame.expected_results as string[]).forEach((r, i) => {
      html += `<li><span class="os-label">R${i + 1} :</span> ${e(typeof r === "string" ? r : JSON.stringify(r))}</li>`;
    });
    html += `</ul>`;
  }

  // 7.1 Indicateurs KPI
  if (indicators.length > 0) {
    html += `<h3>7.1. Tableau des indicateurs KPIs</h3>`;
    html += `<table><thead><tr><th>Indicateur</th><th>Catégorie</th><th>Base</th><th>Cible</th><th>Actuel</th><th>Unité</th><th>Fréquence</th></tr></thead><tbody>`;
    indicators.forEach(ind => {
      html += `<tr><td>${e(ind.name)}</td><td>${e(ind.category ?? "")}</td><td>${ind.baseline_value ?? "—"}</td><td>${ind.target_value ?? "—"}</td><td>${ind.current_value ?? "—"}</td><td>${e(ind.unit ?? "")}</td><td>${e(ind.frequency ?? "")}</td></tr>`;
    });
    html += `</tbody></table>`;
  }

  // ═══════════════ 8. STRATÉGIE D'IMPLÉMENTATION ═══════════════
  html += `<h2 class="section-break">8. Stratégie d'implémentation du projet</h2>`;
  html += f("Objectif de la stratégie", nl(meta.strategie_objectif));
  html += f("Principaux axes d'action", nl(meta.strategie_axes));
  html += f("Modalités de mise en œuvre", nl(meta.strategie_modalites));

  // Work Packages from budget details
  if (budgetDetails.length > 0) {
    const wps = [...new Set(budgetDetails.map(d => d.work_package).filter(Boolean))].sort();
    wps.forEach(wp => {
      const wpDetails = budgetDetails.filter(d => d.work_package === wp);
      const wpTotal = wpDetails.reduce((s, d) => s + (Number(d.total) || 0), 0);
      html += `<h3>${e(wp)} — ${fmtNum(wpTotal)} USD</h3>`;
      html += `<table><thead><tr><th>Code</th><th>Activité</th><th>Catégorie</th><th>Qté</th><th>Coût unit.</th><th>Total</th></tr></thead><tbody>`;
      wpDetails.forEach(d => {
        html += `<tr><td>${e(d.code ?? "")}</td><td>${e(d.activity ?? "")}</td><td>${e(d.category ?? "")}</td><td>${d.quantity ?? ""}</td><td>${fmtNum(Number(d.unit_cost) || 0)}</td><td>${fmtNum(Number(d.total) || 0)}</td></tr>`;
      });
      html += `</tbody></table>`;
    });
  }

  // ═══════════════ 9. MÉTHODOLOGIE ═══════════════
  html += `<h2>9. Méthodologie</h2>`;
  html += f("Méthodologie", nl(meta.methodologie));

  // ═══════════════ 10. DURÉE DU PROGRAMME ═══════════════
  html += `<h2>10. Durée du programme</h2>`;
  html += f("Durée", nl(meta.duree_programme) || (project.duration_months ? `${project.duration_months} mois` : ""));
  if (project.start_date && project.end_date) {
    html += `<p>Du <strong>${fmtDate(project.start_date)}</strong> au <strong>${fmtDate(project.end_date)}</strong></p>`;
  }
  // Milestones
  if (milestones.length > 0) {
    html += `<h3>Jalons clés</h3>`;
    html += `<table><thead><tr><th>Jalon</th><th>Échéance</th><th>Statut</th></tr></thead><tbody>`;
    milestones.forEach(m => {
      html += `<tr><td>${e(m.title)}</td><td>${m.due_date ? fmtDate(m.due_date) : "—"}</td><td>${e(m.status ?? "pending")}</td></tr>`;
    });
    html += `</tbody></table>`;
  }

  // ═══════════════ 11. LIEU(X) D'IMPLÉMENTATION ═══════════════
  html += `<h2>11. Lieu(x) d'implémentation du projet</h2>`;
  html += f("Lieux d'implémentation", nl(meta.lieux_implementation) || (project.locations as string[])?.join(", "));

  // ═══════════════ 12. POPULATION CIBLE ═══════════════
  html += `<h2>12. Population cible / Bénéficiaires</h2>`;
  html += f("Population cible", nl(meta.population_cible));
  html += f("Estimation des bénéficiaires", nl(meta.estimation_beneficiaires));

  // ═══════════════ 13. PERSONNEL CLÉ ═══════════════
  html += `<h2 class="section-break">13. Personnel clé impliqué dans le programme</h2>`;
  html += f("Personnel clé", nl(meta.personnel_cle));

  // ═══════════════ 14. PARTENAIRES ═══════════════
  html += `<h2>14. Partenaires cibles du programme</h2>`;
  if (meta.partenaires) {
    html += f("Partenaires", nl(meta.partenaires));
  }
  if (partners.length > 0) {
    html += `<table><thead><tr><th>Nom</th><th>Type</th><th>Secteur</th><th>Pays</th><th>Statut</th></tr></thead><tbody>`;
    partners.forEach(p => {
      html += `<tr><td>${e(p.name)}</td><td>${e(p.type ?? "")}</td><td>${e(p.sector ?? "")}</td><td>${e(p.country ?? "")}</td><td>${e(p.status ?? "")}</td></tr>`;
    });
    html += `</tbody></table>`;
  }

  // ═══════════════ 15. SUIVI ET ÉVALUATION ═══════════════
  html += `<h2>15. Suivi et évaluation du programme</h2>`;
  html += f("Outils et méthodes de suivi", nl(meta.suivi_outils));
  html += f("Évaluation", nl(meta.suivi_evaluation));
  html += f("Rapports et communication des résultats", nl(meta.suivi_rapports));

  // ═══════════════ 16. PLAN DE SORTIE ═══════════════
  html += `<h2>16. Plan de sortie / Stratégie de durabilité</h2>`;
  html += f("Plan de sortie", nl(meta.plan_sortie));

  // ═══════════════ 17. ANALYSE DES RISQUES ═══════════════
  html += `<h2 class="section-break">17. Analyse des risques et mesures d'atténuation</h2>`;
  if (meta.analyse_risques) {
    html += f("Analyse des risques", nl(meta.analyse_risques));
  }
  if (risks.length > 0) {
    html += `<table><thead><tr><th>Risque</th><th>Niveau</th><th>Mesure d'atténuation</th><th>Responsable</th></tr></thead><tbody>`;
    risks.forEach(r => {
      const levelClass = r.level === "high" ? "risk-high" : r.level === "medium" ? "risk-medium" : "risk-low";
      const levelLabel = r.level === "high" ? "Élevé" : r.level === "medium" ? "Moyen" : "Faible";
      html += `<tr><td>${e(r.title)}</td><td class="${levelClass}">${levelLabel}</td><td>${e(r.mitigation ?? "")}</td><td>${e(r.description ?? "")}</td></tr>`;
    });
    html += `</tbody></table>`;
  }

  // ═══════════════ 18. BUDGET PRÉVISIONNEL ═══════════════
  html += `<h2 class="section-break">18. Annexe : Budget prévisionnel</h2>`;
  if (budgetLines.length > 0) {
    html += `<table><thead><tr><th>Code</th><th>Poste</th><th>Catégorie</th><th>An 1</th><th>An 2</th><th>An 3</th><th>An 4</th><th>An 5</th><th>Total</th></tr></thead><tbody>`;
    budgetLines.forEach(line => {
      html += `<tr>`;
      html += `<td>${e(line.code ?? "")}</td>`;
      html += `<td>${e(line.label)}</td>`;
      html += `<td>${e(line.category)}</td>`;
      html += `<td>${fmtNum(Number(line.year1) || 0)}</td>`;
      html += `<td>${fmtNum(Number(line.year2) || 0)}</td>`;
      html += `<td>${fmtNum(Number(line.year3) || 0)}</td>`;
      html += `<td>${fmtNum(Number(line.year4) || 0)}</td>`;
      html += `<td>${fmtNum(Number(line.year5) || 0)}</td>`;
      html += `<td>${fmtNum(Number(line.total_cost) || 0)}</td>`;
      html += `</tr>`;
    });
    html += `<tr class="total-row"><td colspan="8">Sous-total coûts directs</td><td>${fmtNum(totalBudget)}</td></tr>`;
    const contingency = totalWithContingency - totalBudget;
    html += `<tr><td colspan="8">Imprévus (${Math.round(contingencyPct * 100)}%)</td><td>${fmtNum(contingency)}</td></tr>`;
    html += `<tr class="total-row"><td colspan="8">TOTAL GÉNÉRAL</td><td>${fmtNum(totalWithContingency)} USD</td></tr>`;
    html += `</tbody></table>`;
  }

  // ═══════════════ 19. CADRE LOGIQUE ═══════════════
  html += `<h2 class="section-break">19. Cadre logique du programme</h2>`;
  if (logFrame) {
    if (logFrame.overall_objective) html += f("Objectif global", logFrame.overall_objective);
    if (logFrame.specific_objectives && Array.isArray(logFrame.specific_objectives)) {
      html += `<h3>Objectifs spécifiques</h3><ul>`;
      (logFrame.specific_objectives as string[]).forEach((obj, i) => {
        html += `<li><span class="os-label">OS${i + 1} :</span> ${e(typeof obj === "string" ? obj : JSON.stringify(obj))}</li>`;
      });
      html += `</ul>`;
    }
    if (logFrame.expected_results && Array.isArray(logFrame.expected_results)) {
      html += `<h3>Résultats attendus</h3><ul>`;
      (logFrame.expected_results as string[]).forEach((r, i) => {
        html += `<li><span class="os-label">R${i + 1} :</span> ${e(typeof r === "string" ? r : JSON.stringify(r))}</li>`;
      });
      html += `</ul>`;
    }
    if (logFrame.activities) html += f("Activités", nl(logFrame.activities));
    if (logFrame.assumptions) html += f("Hypothèses", logFrame.assumptions);
    if (logFrame.pre_conditions) html += f("Pré-conditions", logFrame.pre_conditions);
  }

  // Footer
  html += `<div style="margin-top: 60px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #9ca3af; text-align: center;">`;
  html += `Document de projet — ${e(project.name)} — Exporté le ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`;
  html += `</div>`;

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
