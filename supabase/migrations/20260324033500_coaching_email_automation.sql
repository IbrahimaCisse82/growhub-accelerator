-- Queue-based automation for coaching emails

CREATE TABLE IF NOT EXISTS public.coaching_email_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.coaching_sessions(id) ON DELETE CASCADE NOT NULL,
  template_key text NOT NULL,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued', -- queued, sent, failed
  attempts int NOT NULL DEFAULT 0,
  last_attempt_at timestamptz,
  sent_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS coaching_email_jobs_unique_per_session_template_recipient
ON public.coaching_email_jobs (session_id, template_key, recipient_email);

ALTER TABLE public.coaching_email_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read coaching email jobs" ON public.coaching_email_jobs;
CREATE POLICY "Admins read coaching email jobs"
ON public.coaching_email_jobs
FOR SELECT TO authenticated
USING (public.is_admin_or_coordinator(auth.uid()));

DROP POLICY IF EXISTS "Admins manage coaching email jobs" ON public.coaching_email_jobs;
CREATE POLICY "Admins manage coaching email jobs"
ON public.coaching_email_jobs
FOR ALL TO authenticated
USING (public.is_admin_or_coordinator(auth.uid()));

CREATE OR REPLACE FUNCTION public.render_email_template(p_template text, p_payload jsonb)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_result text := coalesce(p_template, '');
  v_key text;
  v_value text;
BEGIN
  FOR v_key, v_value IN
    SELECT key, value
    FROM jsonb_each_text(coalesce(p_payload, '{}'::jsonb))
  LOOP
    v_result := replace(v_result, '{{' || v_key || '}}', coalesce(v_value, ''));
  END LOOP;
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.queue_coaching_email(
  p_session_id uuid,
  p_template_key text,
  p_recipient_email text,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_template record;
BEGIN
  IF p_recipient_email IS NULL OR length(trim(p_recipient_email)) = 0 THEN
    RETURN;
  END IF;

  SELECT template_key, subject, body
  INTO v_template
  FROM public.email_templates
  WHERE template_key = p_template_key
    AND is_active = true
  LIMIT 1;

  IF v_template.template_key IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.coaching_email_jobs (
    session_id,
    template_key,
    recipient_email,
    subject,
    body,
    payload,
    status
  )
  VALUES (
    p_session_id,
    p_template_key,
    p_recipient_email,
    public.render_email_template(v_template.subject, p_payload),
    public.render_email_template(v_template.body, p_payload),
    p_payload,
    'queued'
  )
  ON CONFLICT (session_id, template_key, recipient_email) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_session_email_events()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_startup_name text;
  v_startup_email text;
  v_mentor_name text;
  v_mentor_email text;
  v_meeting_date text;
  v_payload_startup jsonb;
  v_payload_mentor jsonb;
BEGIN
  SELECT s.name, p.email
  INTO v_startup_name, v_startup_email
  FROM public.startups s
  LEFT JOIN public.profiles p ON p.user_id = s.founder_id
  WHERE s.id = NEW.startup_id;

  SELECT p.full_name, p.email
  INTO v_mentor_name, v_mentor_email
  FROM public.profiles p
  WHERE p.user_id = NEW.mentor_id
  LIMIT 1;

  v_meeting_date := to_char(NEW.scheduled_at AT TIME ZONE 'UTC', 'DD/MM/YYYY HH24:MI') || ' UTC';

  v_payload_startup := jsonb_build_object(
    'first_name', coalesce(v_startup_name, 'Participant'),
    'meeting_date', v_meeting_date,
    'meeting_link', coalesce(NEW.meeting_url, ''),
    'mentor_name', coalesce(v_mentor_name, 'Mentor')
  );

  v_payload_mentor := jsonb_build_object(
    'first_name', coalesce(v_mentor_name, 'Mentor'),
    'meeting_date', v_meeting_date,
    'meeting_link', coalesce(NEW.meeting_url, ''),
    'mentor_name', coalesce(v_mentor_name, 'Mentor')
  );

  IF TG_OP = 'INSERT' THEN
    PERFORM public.queue_coaching_email(NEW.id, 'coaching_invite', v_startup_email, v_payload_startup);
    PERFORM public.queue_coaching_email(NEW.id, 'coaching_invite', v_mentor_email, v_payload_mentor);
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM 'confirmed' THEN
    PERFORM public.queue_coaching_email(NEW.id, 'coaching_confirmed', v_startup_email, v_payload_startup);
    PERFORM public.queue_coaching_email(NEW.id, 'coaching_confirmed', v_mentor_email, v_payload_mentor);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_enqueue_session_email_events ON public.coaching_sessions;
CREATE TRIGGER trigger_enqueue_session_email_events
AFTER INSERT OR UPDATE ON public.coaching_sessions
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_session_email_events();

CREATE OR REPLACE FUNCTION public.enqueue_coaching_reminders()
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  v_count int := 0;
  v_row record;
  v_startup_email text;
  v_mentor_email text;
  v_startup_name text;
  v_mentor_name text;
  v_payload_startup jsonb;
  v_payload_mentor jsonb;
BEGIN
  FOR v_row IN
    SELECT cs.id, cs.startup_id, cs.mentor_id, cs.scheduled_at, cs.meeting_url
    FROM public.coaching_sessions cs
    WHERE cs.status IN ('planned', 'confirmed')
      AND cs.scheduled_at >= now() + interval '23 hours'
      AND cs.scheduled_at <= now() + interval '25 hours'
  LOOP
    SELECT s.name, p.email
    INTO v_startup_name, v_startup_email
    FROM public.startups s
    LEFT JOIN public.profiles p ON p.user_id = s.founder_id
    WHERE s.id = v_row.startup_id;

    SELECT p.full_name, p.email
    INTO v_mentor_name, v_mentor_email
    FROM public.profiles p
    WHERE p.user_id = v_row.mentor_id
    LIMIT 1;

    v_payload_startup := jsonb_build_object(
      'first_name', coalesce(v_startup_name, 'Participant'),
      'meeting_date', to_char(v_row.scheduled_at AT TIME ZONE 'UTC', 'DD/MM/YYYY HH24:MI') || ' UTC',
      'meeting_link', coalesce(v_row.meeting_url, ''),
      'mentor_name', coalesce(v_mentor_name, 'Mentor')
    );

    v_payload_mentor := jsonb_build_object(
      'first_name', coalesce(v_mentor_name, 'Mentor'),
      'meeting_date', to_char(v_row.scheduled_at AT TIME ZONE 'UTC', 'DD/MM/YYYY HH24:MI') || ' UTC',
      'meeting_link', coalesce(v_row.meeting_url, ''),
      'mentor_name', coalesce(v_mentor_name, 'Mentor')
    );

    PERFORM public.queue_coaching_email(v_row.id, 'coaching_reminder_24h', v_startup_email, v_payload_startup);
    PERFORM public.queue_coaching_email(v_row.id, 'coaching_reminder_24h', v_mentor_email, v_payload_mentor);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;
