import * as XLSX from "xlsx";

export interface SheetData {
  name: string;
  rows: Record<string, any>[];
  columns?: { key: string; label: string }[];
}

/**
 * Export multiple data sheets to a single .xlsx workbook.
 */
export function exportToExcel(sheets: SheetData[], filename: string) {
  const wb = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const cols = sheet.columns ?? (sheet.rows[0] ? Object.keys(sheet.rows[0]).map(k => ({ key: k, label: k })) : []);
    const data = sheet.rows.map(row => {
      const out: Record<string, any> = {};
      for (const c of cols) out[c.label] = row[c.key];
      return out;
    });
    const ws = XLSX.utils.json_to_sheet(data, { header: cols.map(c => c.label) });

    // Auto-size columns roughly
    const colWidths = cols.map(c => ({
      wch: Math.max(
        c.label.length,
        ...data.map(r => String(r[c.label] ?? "").length).slice(0, 100),
        10
      ),
    }));
    (ws as any)["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  }

  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}
