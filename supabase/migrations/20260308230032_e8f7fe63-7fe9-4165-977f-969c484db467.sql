
-- Use DROP IF EXISTS + CREATE for triggers that may already exist
DROP TRIGGER IF EXISTS trg_log_activity_projects ON public.projects;
DROP TRIGGER IF EXISTS trg_log_activity_programs ON public.programs;
DROP TRIGGER IF EXISTS trg_log_activity_cohorts ON public.cohorts;
DROP TRIGGER IF EXISTS trg_log_activity_startups ON public.startups;
DROP TRIGGER IF EXISTS trg_log_activity_grants ON public.grants;
DROP TRIGGER IF EXISTS trg_log_activity_events ON public.events;
DROP TRIGGER IF EXISTS trg_log_activity_tasks ON public.tasks;
DROP TRIGGER IF EXISTS trg_log_activity_milestones ON public.milestones;
DROP TRIGGER IF EXISTS trg_log_activity_risks ON public.risks;
DROP TRIGGER IF EXISTS trg_log_grant_changes ON public.grants;
DROP TRIGGER IF EXISTS trg_log_grant_creation ON public.grants;
DROP TRIGGER IF EXISTS trg_log_grant_deletion ON public.grants;

CREATE TRIGGER trg_log_activity_projects AFTER INSERT OR UPDATE OR DELETE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER trg_log_activity_programs AFTER INSERT OR UPDATE OR DELETE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER trg_log_activity_cohorts AFTER INSERT OR UPDATE OR DELETE ON public.cohorts FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER trg_log_activity_startups AFTER INSERT OR UPDATE OR DELETE ON public.startups FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER trg_log_activity_grants AFTER INSERT OR UPDATE OR DELETE ON public.grants FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER trg_log_activity_events AFTER INSERT OR UPDATE OR DELETE ON public.events FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER trg_log_activity_tasks AFTER INSERT OR UPDATE OR DELETE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER trg_log_activity_milestones AFTER INSERT OR UPDATE OR DELETE ON public.milestones FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER trg_log_activity_risks AFTER INSERT OR UPDATE OR DELETE ON public.risks FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER trg_log_grant_changes AFTER UPDATE ON public.grants FOR EACH ROW EXECUTE FUNCTION public.log_grant_changes();
CREATE TRIGGER trg_log_grant_creation AFTER INSERT ON public.grants FOR EACH ROW EXECUTE FUNCTION public.log_grant_creation();
CREATE TRIGGER trg_log_grant_deletion BEFORE DELETE ON public.grants FOR EACH ROW EXECUTE FUNCTION public.log_grant_deletion();

-- Fix all SELECT policies to target authenticated role only
DROP POLICY IF EXISTS "Grant changes viewable by authenticated" ON public.grant_changes;
CREATE POLICY "Grant changes viewable by authenticated" ON public.grant_changes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Grant transactions viewable by authenticated" ON public.grant_transactions;
CREATE POLICY "Grant transactions viewable by authenticated" ON public.grant_transactions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Budgets viewable by authenticated" ON public.budgets;
CREATE POLICY "Budgets viewable by authenticated" ON public.budgets FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Cohorts viewable by authenticated" ON public.cohorts;
CREATE POLICY "Cohorts viewable by authenticated" ON public.cohorts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Courses viewable by authenticated" ON public.courses;
CREATE POLICY "Courses viewable by authenticated" ON public.courses FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Events viewable by authenticated" ON public.events;
CREATE POLICY "Events viewable by authenticated" ON public.events FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Grant activities viewable by authenticated" ON public.grant_activities;
CREATE POLICY "Grant activities viewable by authenticated" ON public.grant_activities FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Grant disbursements viewable by authenticated" ON public.grant_disbursements;
CREATE POLICY "Grant disbursements viewable by authenticated" ON public.grant_disbursements FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Grant documents viewable by authenticated" ON public.grant_documents;
CREATE POLICY "Grant documents viewable by authenticated" ON public.grant_documents FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Grant indicators viewable by authenticated" ON public.grant_indicators;
CREATE POLICY "Grant indicators viewable by authenticated" ON public.grant_indicators FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Grant reports viewable by authenticated" ON public.grant_reports;
CREATE POLICY "Grant reports viewable by authenticated" ON public.grant_reports FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Grants viewable by authenticated" ON public.grants;
CREATE POLICY "Grants viewable by authenticated" ON public.grants FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Logical frameworks viewable" ON public.logical_frameworks;
CREATE POLICY "Logical frameworks viewable" ON public.logical_frameworks FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Mentor profiles viewable" ON public.mentor_profiles;
CREATE POLICY "Mentor profiles viewable" ON public.mentor_profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Milestones viewable by authenticated" ON public.milestones;
CREATE POLICY "Milestones viewable by authenticated" ON public.milestones FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Portfolios viewable by authenticated" ON public.portfolios;
CREATE POLICY "Portfolios viewable by authenticated" ON public.portfolios FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Programs viewable by authenticated" ON public.programs;
CREATE POLICY "Programs viewable by authenticated" ON public.programs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Project budget lines viewable" ON public.project_budget_lines;
CREATE POLICY "Project budget lines viewable" ON public.project_budget_lines FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Project indicators viewable" ON public.project_indicators;
CREATE POLICY "Project indicators viewable" ON public.project_indicators FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Projects viewable by authenticated" ON public.projects;
CREATE POLICY "Projects viewable by authenticated" ON public.projects FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Resources viewable by authenticated" ON public.resources;
CREATE POLICY "Resources viewable by authenticated" ON public.resources FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Risks viewable by authenticated" ON public.risks;
CREATE POLICY "Risks viewable by authenticated" ON public.risks FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Startups viewable by authenticated" ON public.startups;
CREATE POLICY "Startups viewable by authenticated" ON public.startups FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Members viewable" ON public.startup_members;
CREATE POLICY "Members viewable" ON public.startup_members FOR SELECT TO authenticated USING (true);

-- Restrict PII in profiles
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR is_admin_or_coordinator(auth.uid()));

-- Safe views for PII masking
CREATE OR REPLACE VIEW public.profiles_safe
WITH (security_invoker = on) AS
SELECT 
  id, user_id, full_name, 
  CASE WHEN user_id = auth.uid() OR is_admin_or_coordinator(auth.uid()) THEN email ELSE NULL END as email,
  CASE WHEN user_id = auth.uid() OR is_admin_or_coordinator(auth.uid()) THEN phone ELSE NULL END as phone,
  organization, position, bio, linkedin_url, avatar_url, is_approved, created_at, updated_at
FROM public.profiles;

CREATE OR REPLACE VIEW public.startup_members_safe
WITH (security_invoker = on) AS
SELECT
  id, startup_id, user_id, full_name, role, created_at,
  CASE WHEN is_admin_or_coordinator(auth.uid()) THEN email ELSE NULL END as email
FROM public.startup_members;
