
-- HR Employees table
CREATE TABLE public.hr_employees (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  matricule text NOT NULL,
  prenom text NOT NULL,
  nom text NOT NULL,
  sexe text NOT NULL DEFAULT 'M',
  date_naissance date,
  lieu_naissance text,
  nationalite text DEFAULT 'Sénégalaise',
  adresse text,
  telephone text,
  email text,
  situation_famille text DEFAULT 'Célibataire',
  femmes integer DEFAULT 0,
  enfants integer DEFAULT 0,
  fonction text,
  convention text DEFAULT 'COMMERCE',
  categorie text,
  statut text DEFAULT 'employés',
  contrat text DEFAULT 'CDI',
  date_entree date,
  salaire_base numeric NOT NULL DEFAULT 0,
  sursalaire numeric DEFAULT 0,
  heures_absence numeric DEFAULT 0,
  heures_abs_maladie numeric DEFAULT 0,
  taux_maladie numeric DEFAULT 0,
  nb_paniers integer DEFAULT 0,
  hs_115 numeric DEFAULT 0,
  hs_140 numeric DEFAULT 0,
  hs_160 numeric DEFAULT 0,
  hs_200 numeric DEFAULT 0,
  avance_tabaski numeric DEFAULT 0,
  avance_caisse numeric DEFAULT 0,
  avance_financiere numeric DEFAULT 0,
  ret_cooperative numeric DEFAULT 0,
  frais_medicaux numeric DEFAULT 0,
  ind_kilometrique numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR employees viewable by authenticated" ON public.hr_employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage HR employees" ON public.hr_employees FOR ALL TO authenticated USING (is_admin_or_coordinator(auth.uid()));

CREATE TRIGGER update_hr_employees_updated_at BEFORE UPDATE ON public.hr_employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- HR Payroll History
CREATE TABLE public.hr_payroll_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mois integer NOT NULL,
  annee integer NOT NULL,
  total_brut numeric DEFAULT 0,
  total_net numeric DEFAULT 0,
  total_charges numeric DEFAULT 0,
  total_masse numeric DEFAULT 0,
  nb_employes integer DEFAULT 0,
  closed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(mois, annee)
);

ALTER TABLE public.hr_payroll_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR payroll history viewable by authenticated" ON public.hr_payroll_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage HR payroll history" ON public.hr_payroll_history FOR ALL TO authenticated USING (is_admin_or_coordinator(auth.uid()));

-- Activity log triggers
CREATE TRIGGER log_hr_employees_activity AFTER INSERT OR UPDATE OR DELETE ON public.hr_employees
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();
