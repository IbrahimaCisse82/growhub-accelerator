-- Email templates for coaching communication automation
CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL UNIQUE,
  subject text NOT NULL,
  body text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read email templates" ON public.email_templates;
CREATE POLICY "Authenticated can read email templates"
ON public.email_templates
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can manage email templates" ON public.email_templates;
CREATE POLICY "Admins can manage email templates"
ON public.email_templates
FOR ALL TO authenticated
USING (public.is_admin_or_coordinator(auth.uid()));

DROP TRIGGER IF EXISTS update_email_templates_ts ON public.email_templates;
CREATE TRIGGER update_email_templates_ts
BEFORE UPDATE ON public.email_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO public.email_templates (template_key, subject, body)
VALUES
  (
    'coaching_invite',
    'Invitation session coaching - {{meeting_date}}',
    'Bonjour {{first_name}},\n\nVous etes invite(e) a une session de coaching avec {{mentor_name}} le {{meeting_date}}.\n\nLien de la reunion: {{meeting_link}}\n\nA bientot.'
  ),
  (
    'coaching_confirmed',
    'Session confirmee - {{meeting_date}}',
    'Bonjour {{first_name}},\n\nVotre session de coaching avec {{mentor_name}} est confirmee pour le {{meeting_date}}.\n\nLien de la reunion: {{meeting_link}}\n\nMerci.'
  ),
  (
    'coaching_reminder_24h',
    'Rappel: session coaching dans 24h',
    'Bonjour {{first_name}},\n\nPetit rappel: votre session de coaching avec {{mentor_name}} est prevue le {{meeting_date}}.\n\nLien de la reunion: {{meeting_link}}\n\nBonne preparation.'
  )
ON CONFLICT (template_key) DO NOTHING;
