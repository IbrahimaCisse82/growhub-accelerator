
-- =============================================
-- NOTIFICATION TRIGGERS: Auto-notify on key events
-- =============================================

-- 1. Notify when a task is assigned
CREATE OR REPLACE FUNCTION public.notify_task_assigned()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE assigner_name text;
BEGIN
  IF NEW.assignee_id IS NOT NULL AND (OLD.assignee_id IS DISTINCT FROM NEW.assignee_id) THEN
    SELECT full_name INTO assigner_name FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
    INSERT INTO public.notifications (user_id, title, content, type, link)
    VALUES (
      NEW.assignee_id,
      '📋 Tâche assignée',
      COALESCE(assigner_name, 'Un utilisateur') || ' vous a assigné : ' || NEW.title,
      'task',
      '/app/taches'
    );
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_task_assigned ON public.tasks;
CREATE TRIGGER on_task_assigned AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.notify_task_assigned();

-- 2. Notify on application status change
CREATE OR REPLACE FUNCTION public.notify_application_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE status_label text;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    status_label := CASE NEW.status
      WHEN 'screening' THEN '🔍 En cours d''examen'
      WHEN 'interview' THEN '🎤 Entretien programmé'
      WHEN 'due_diligence' THEN '📊 Due Diligence'
      WHEN 'accepted' THEN '🎉 Acceptée'
      WHEN 'rejected' THEN '❌ Refusée'
      ELSE NEW.status::text
    END;
    INSERT INTO public.notifications (user_id, title, content, type, link)
    VALUES (
      NEW.applicant_id,
      'Candidature : ' || status_label,
      'Votre candidature a été mise à jour.',
      'application',
      '/app/candidatures'
    );
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_application_status ON public.applications;
CREATE TRIGGER on_application_status AFTER UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_application_status();

-- 3. Notify on milestone completion
CREATE OR REPLACE FUNCTION public.notify_milestone_completed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE project_owner uuid;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    SELECT owner_id INTO project_owner FROM public.projects WHERE id = NEW.project_id;
    IF project_owner IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, content, type, link)
      VALUES (
        project_owner,
        '🏁 Jalon atteint',
        'Le jalon "' || NEW.title || '" est terminé !',
        'milestone',
        '/app/jalons'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_milestone_completed ON public.milestones;
CREATE TRIGGER on_milestone_completed AFTER UPDATE ON public.milestones
  FOR EACH ROW EXECUTE FUNCTION public.notify_milestone_completed();

-- 4. Notify mentor & startup on coaching session changes
CREATE OR REPLACE FUNCTION public.notify_coaching_session()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE founder uuid; mentor_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Notify mentor
    INSERT INTO public.notifications (user_id, title, content, type, link)
    VALUES (NEW.mentor_id, '📅 Nouvelle session', 'Session "' || NEW.title || '" programmée.', 'coaching', '/app/coaching');
    -- Notify startup founder
    SELECT founder_id INTO founder FROM public.startups WHERE id = NEW.startup_id;
    IF founder IS NOT NULL AND founder != NEW.mentor_id THEN
      SELECT full_name INTO mentor_name FROM public.profiles WHERE user_id = NEW.mentor_id LIMIT 1;
      INSERT INTO public.notifications (user_id, title, content, type, link)
      VALUES (founder, '📅 Session avec ' || COALESCE(mentor_name, 'votre mentor'), NEW.title, 'coaching', '/app/coaching');
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Notify on status change
    SELECT founder_id INTO founder FROM public.startups WHERE id = NEW.startup_id;
    IF NEW.status = 'confirmed' THEN
      IF founder IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, title, content, type, link)
        VALUES (founder, '✅ Session confirmée', 'La session "' || NEW.title || '" est confirmée.', 'coaching', '/app/coaching');
      END IF;
    ELSIF NEW.status = 'cancelled' THEN
      INSERT INTO public.notifications (user_id, title, content, type, link)
      VALUES (NEW.mentor_id, '❌ Session annulée', '"' || NEW.title || '" a été annulée.', 'coaching', '/app/coaching');
      IF founder IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, title, content, type, link)
        VALUES (founder, '❌ Session annulée', '"' || NEW.title || '" a été annulée.', 'coaching', '/app/coaching');
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_coaching_session ON public.coaching_sessions;
CREATE TRIGGER on_coaching_session AFTER INSERT OR UPDATE ON public.coaching_sessions
  FOR EACH ROW EXECUTE FUNCTION public.notify_coaching_session();

-- 5. Notify on risk escalation (level changed to critical)
CREATE OR REPLACE FUNCTION public.notify_risk_escalation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE project_owner uuid;
BEGIN
  IF NEW.level = 'critical' AND (OLD.level IS DISTINCT FROM 'critical') THEN
    SELECT owner_id INTO project_owner FROM public.projects WHERE id = NEW.project_id;
    IF project_owner IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, content, type, link)
      VALUES (project_owner, '🚨 Risque critique', '"' || NEW.title || '" est passé en niveau critique.', 'risk', '/app/risques');
    END IF;
    -- Also notify all admins
    INSERT INTO public.notifications (user_id, title, content, type, link)
    SELECT ur.user_id, '🚨 Risque critique', '"' || NEW.title || '" est passé en niveau critique.', 'risk', '/app/risques'
    FROM public.user_roles ur WHERE ur.role IN ('super_admin', 'coordinator');
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_risk_escalation ON public.risks;
CREATE TRIGGER on_risk_escalation AFTER INSERT OR UPDATE ON public.risks
  FOR EACH ROW EXECUTE FUNCTION public.notify_risk_escalation();

-- 6. Enable realtime on notifications (ensure)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END$$;
