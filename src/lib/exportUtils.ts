/**
 * Export utilities for CSV and JSON
 */

export function exportToCSV(data: Record<string, any>[], filename: string, columns?: { key: string; label: string }[]) {
  if (!data || data.length === 0) return;

  const cols = columns ?? Object.keys(data[0]).map(k => ({ key: k, label: k }));
  const header = cols.map(c => `"${c.label}"`).join(",");
  const rows = data.map(row =>
    cols.map(c => {
      const val = row[c.key];
      if (val == null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(",")
  );

  const csv = [header, ...rows].join("\n");
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${filename}.csv`);
}

export function exportToJSON(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  downloadBlob(blob, `${filename}.json`);
}

export function exportToPDF(title: string, data: Record<string, any>[], columns?: { key: string; label: string }[]) {
  if (!data || data.length === 0) return;

  const cols = columns ?? Object.keys(data[0]).map(k => ({ key: k, label: k }));

  const style = `<style>
    body{font-family:system-ui,sans-serif;padding:40px;color:#1a1a1a}
    h1{font-size:20px;margin-bottom:4px}
    .meta{color:#666;font-size:12px;margin-bottom:20px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th{background:#f4f4f5;padding:8px 10px;text-align:left;border-bottom:2px solid #e4e4e7;font-weight:600;text-transform:uppercase;font-size:10px;letter-spacing:0.5px}
    td{padding:7px 10px;border-bottom:1px solid #e4e4e7}
    tr:hover{background:#fafafa}
    @media print{body{padding:20px}}
  </style>`;

  const headerRow = cols.map(c => `<th>${c.label}</th>`).join("");
  const bodyRows = data.map(row =>
    `<tr>${cols.map(c => `<td>${row[c.key] ?? "—"}</td>`).join("")}</tr>`
  ).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>${style}</head><body>
    <h1>${title}</h1>
    <div class="meta">Exporté le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}</div>
    <table><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table>
  </body></html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 300);
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
