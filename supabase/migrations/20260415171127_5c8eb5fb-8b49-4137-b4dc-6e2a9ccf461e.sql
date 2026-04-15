
DROP VIEW IF EXISTS public.budget_vs_actual;

CREATE VIEW public.budget_vs_actual
WITH (security_invoker = true)
AS
SELECT
  pbd.project_id,
  COALESCE(pbd.nomenclature_code, 'A') AS nomenclature_code,
  bn.label AS nomenclature_label,
  pbd.work_package,
  SUM(pbd.total) AS planned_amount,
  COALESCE(gt_agg.spent_amount, 0) AS spent_amount,
  SUM(pbd.total) - COALESCE(gt_agg.spent_amount, 0) AS remaining,
  CASE WHEN SUM(pbd.total) > 0 
    THEN ROUND((COALESCE(gt_agg.spent_amount, 0) / SUM(pbd.total)) * 100, 1)
    ELSE 0
  END AS execution_rate
FROM public.project_budget_details pbd
LEFT JOIN public.budget_nomenclature bn ON bn.code = pbd.nomenclature_code
LEFT JOIN LATERAL (
  SELECT SUM(gt.amount) AS spent_amount
  FROM public.grant_transactions gt
  JOIN public.grants g ON g.id = gt.grant_id
  WHERE g.project_id = pbd.project_id
    AND (gt.nomenclature_code = pbd.nomenclature_code OR gt.budget_code = pbd.code)
) gt_agg ON true
GROUP BY pbd.project_id, pbd.nomenclature_code, bn.label, pbd.work_package, gt_agg.spent_amount;
