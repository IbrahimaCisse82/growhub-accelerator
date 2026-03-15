import type { WorkPackageData } from "@/components/projects/WorkPackageCard";

/**
 * Groups logical framework data + indicators + milestones into Work Packages.
 *
 * Strategy:
 * - Each specific_objective in the logframe becomes a WP objective.
 * - Activities, results are distributed by matching WP index (array position).
 *   If items are stored as flat arrays, we split them evenly or by prefix (A1.x → WP1).
 * - Indicators and milestones are assigned by prefix (I1.x, M1.x → WP1) or name matching.
 */
export function buildWorkPackages(
  logFrame: {
    specific_objectives?: unknown;
    activities?: unknown;
    expected_results?: unknown;
  } | null,
  indicators: { name: string; current_value?: number | null; target_value?: number | null; unit?: string | null }[],
  milestones: { title: string; status?: string | null; due_date?: string | null }[]
): WorkPackageData[] {
  if (!logFrame) return [];

  const objectives = toStringArray(logFrame.specific_objectives);
  if (objectives.length === 0) return [];

  const activities = toStringArray(logFrame.activities);
  const results = toStringArray(logFrame.expected_results);

  const wpCount = objectives.length;

  // Build WPs
  const wps: WorkPackageData[] = objectives.map((obj, idx) => {
    const wpNum = idx + 1;

    // Extract title and objective from the text
    // If the objective text contains a colon, use the part before as title
    let title = `Work Package ${wpNum}`;
    let objective = obj;
    const colonIdx = obj.indexOf(":");
    if (colonIdx > 0 && colonIdx < 80) {
      title = obj.substring(0, colonIdx).trim();
      objective = obj.substring(colonIdx + 1).trim();
    }

    return {
      number: wpNum,
      title,
      objective,
      activities: filterByWpNumber(activities, wpNum, wpCount),
      results: filterByWpNumber(results, wpNum, wpCount),
      indicators: filterIndicatorsByWp(indicators, wpNum, wpCount),
      milestones: filterMilestonesByWp(milestones, wpNum, wpCount),
    };
  });

  return wps;
}

function toStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val.map((v) => (typeof v === "string" ? v : JSON.stringify(v)));
}

/**
 * Try to match items to a WP by prefix (e.g., "A1.2 ..." → WP 1).
 * Falls back to distributing by index if no prefix pattern is found.
 */
function filterByWpNumber(items: string[], wpNum: number, wpCount: number): string[] {
  // Try prefix matching first
  const prefixPattern = new RegExp(`^[A-Z]${wpNum}\\.\\d`, "i");
  const prefixed = items.filter((item) => prefixPattern.test(item.trim()));
  if (prefixed.length > 0) {
    // Strip the prefix code from display
    return prefixed.map((item) => item.replace(/^[A-Z]\d+\.\d+\s*/i, "").trim());
  }

  // Fallback: distribute by index chunks
  const chunkSize = Math.ceil(items.length / wpCount);
  const start = (wpNum - 1) * chunkSize;
  return items.slice(start, start + chunkSize);
}

function filterIndicatorsByWp(
  indicators: { name: string; current_value?: number | null; target_value?: number | null; unit?: string | null }[],
  wpNum: number,
  wpCount: number
): WorkPackageData["indicators"] {
  const prefixPattern = new RegExp(`^I${wpNum}\\.\\d`, "i");
  let matched = indicators.filter((ind) => prefixPattern.test(ind.name.trim()));

  if (matched.length === 0) {
    // Fallback: distribute by chunks
    const chunkSize = Math.ceil(indicators.length / wpCount);
    const start = (wpNum - 1) * chunkSize;
    matched = indicators.slice(start, start + chunkSize);
  }

  return matched.map((ind) => ({
    name: ind.name.replace(/^I\d+\.\d+\s*/i, "").trim(),
    current: ind.current_value ?? 0,
    target: ind.target_value ?? 0,
    unit: ind.unit ?? undefined,
  }));
}

function filterMilestonesByWp(
  milestones: { title: string; status?: string | null; due_date?: string | null }[],
  wpNum: number,
  wpCount: number
): WorkPackageData["milestones"] {
  const prefixPattern = new RegExp(`^M${wpNum}\\.\\d`, "i");
  let matched = milestones.filter((m) => prefixPattern.test(m.title.trim()));

  if (matched.length === 0) {
    const chunkSize = Math.ceil(milestones.length / wpCount);
    const start = (wpNum - 1) * chunkSize;
    matched = milestones.slice(start, start + chunkSize);
  }

  return matched.map((m) => ({
    title: m.title.replace(/^M\d+\.\d+\s*/i, "").trim(),
    status: m.status ?? "pending",
    dueDate: m.due_date ?? undefined,
  }));
}
