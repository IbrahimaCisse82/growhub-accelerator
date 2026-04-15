
-- 1. Table de référence nomenclature Enabel A32
CREATE TABLE public.budget_nomenclature (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  parent_code TEXT REFERENCES public.budget_nomenclature(code),
  level INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.budget_nomenclature ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nomenclature viewable by authenticated"
  ON public.budget_nomenclature FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage nomenclature"
  ON public.budget_nomenclature FOR ALL TO authenticated
  USING (is_admin_or_coordinator(auth.uid()));

-- 2. Seed nomenclature Enabel
INSERT INTO public.budget_nomenclature (code, label, parent_code, level, sort_order) VALUES
  ('A',     'Coûts directs',                          NULL,   1, 1),
  ('A.1',   'Ressources humaines',                    'A',    2, 10),
  ('A.1.1', 'Salaires (bruts, employeur local)',       'A.1',  3, 11),
  ('A.1.2', 'Salaires (bruts, employeur expatrié)',    'A.1',  3, 12),
  ('A.1.3', 'Indemnités et primes',                   'A.1',  3, 13),
  ('A.2',   'Voyages',                                'A',    2, 20),
  ('A.2.1', 'Voyages internationaux',                 'A.2',  3, 21),
  ('A.2.2', 'Voyages locaux / transport terrain',     'A.2',  3, 22),
  ('A.3',   'Équipement et fournitures',              'A',    2, 30),
  ('A.3.1', 'Achat ou location d''équipement',        'A.3',  3, 31),
  ('A.3.2', 'Fournitures',                            'A.3',  3, 32),
  ('A.4',   'Bureaux locaux',                         'A',    2, 40),
  ('A.4.1', 'Coûts du véhicule',                      'A.4',  3, 41),
  ('A.4.2', 'Location de bureau',                     'A.4',  3, 42),
  ('A.4.3', 'Consommables — fournitures de bureau',   'A.4',  3, 43),
  ('A.4.4', 'Autres services (télécom, énergie)',     'A.4',  3, 44),
  ('A.5',   'Autres coûts / services',                'A',    2, 50),
  ('A.5.1', 'Publications',                           'A.5',  3, 51),
  ('A.5.2', 'Études, recherche',                      'A.5',  3, 52),
  ('A.5.3', 'Coûts de vérification / audit',          'A.5',  3, 53),
  ('A.5.4', 'Coûts d''évaluation',                    'A.5',  3, 54),
  ('A.5.5', 'Traduction / interprétation',            'A.5',  3, 55),
  ('A.5.6', 'Services financiers',                    'A.5',  3, 56),
  ('A.5.7', 'Conférences / séminaires / formations',  'A.5',  3, 57),
  ('A.5.8', 'Actions de visibilité / communication',  'A.5',  3, 58),
  ('A.6',   'Autres (subventions, fonds d''amorçage)','A',    2, 60),
  ('B',     'Coûts indirects (frais de structure)',    NULL,   1, 90);

-- 3. Ajouter nomenclature_code aux tables existantes
ALTER TABLE public.project_budget_details
  ADD COLUMN IF NOT EXISTS nomenclature_code TEXT REFERENCES public.budget_nomenclature(code);

ALTER TABLE public.grant_transactions
  ADD COLUMN IF NOT EXISTS nomenclature_code TEXT REFERENCES public.budget_nomenclature(code);

ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS nomenclature_code TEXT REFERENCES public.budget_nomenclature(code);

-- 4. Mapping automatique des catégories existantes vers nomenclature Enabel
UPDATE public.project_budget_details SET nomenclature_code = CASE
  WHEN category ILIKE '%Ressources Humaines%' THEN 'A.1'
  WHEN category ILIKE '%Consultant%' OR category ILIKE '%Études%' OR category ILIKE '%Prestations%' OR category ILIKE '%Appui Juridique%' THEN 'A.5.2'
  WHEN category ILIKE '%Formation%' OR category ILIKE '%Animation%' OR category ILIKE '%Certification%' OR category ILIKE '%Appui Technique%' OR category ILIKE '%Actions Genre%' THEN 'A.5.7'
  WHEN category ILIKE '%Équipement%' OR category ILIKE '%TIC%' OR category ILIKE '%R&D%' THEN 'A.3'
  WHEN category ILIKE '%Infrastructure%' THEN 'A.4'
  WHEN category ILIKE '%Événement%' OR category ILIKE '%Réseaux%' THEN 'A.5.7'
  WHEN category ILIKE '%Transport%' OR category ILIKE '%Logistique%' THEN 'A.2.2'
  WHEN category ILIKE '%Fonctionnement%' THEN 'A.4'
  WHEN category ILIKE '%Communication%' THEN 'A.5.8'
  WHEN category ILIKE '%Évaluation%' THEN 'A.5.4'
  WHEN category ILIKE '%Audit%' OR category ILIKE '%Contrôle%' THEN 'A.5.3'
  WHEN category ILIKE '%Subvention%' OR category ILIKE '%Fonds%' THEN 'A.6'
  ELSE NULL
END
WHERE nomenclature_code IS NULL;

-- 5. Vue croisée Budget vs Actual
CREATE OR REPLACE VIEW public.budget_vs_actual AS
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
