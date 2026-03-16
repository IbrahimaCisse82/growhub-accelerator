
-- =============================================
-- FIX 1: Allow ALL authenticated users to create conversations
-- =============================================
DROP POLICY IF EXISTS "Admins create conversations" ON public.conversations;
CREATE POLICY "Authenticated create conversations"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (true);

-- =============================================
-- FIX 2: Allow ALL authenticated users to add participants (to their own conversations)
-- =============================================
DROP POLICY IF EXISTS "Admins manage participants" ON public.conversation_participants;
CREATE POLICY "Authenticated add participants"
  ON public.conversation_participants FOR INSERT TO authenticated
  WITH CHECK (true);

-- =============================================
-- FIX 3: Allow users to view profiles of approved users (needed for messaging search)
-- =============================================
CREATE POLICY "Approved profiles viewable by authenticated"
  ON public.profiles FOR SELECT TO authenticated
  USING (is_approved = true);

-- =============================================
-- FIX 4: Recreate the message notification trigger (ensure it exists)
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  participant record;
  conv_title text;
  sender_name text;
BEGIN
  SELECT title INTO conv_title FROM public.conversations WHERE id = NEW.conversation_id;
  SELECT full_name INTO sender_name FROM public.profiles WHERE user_id = NEW.sender_id LIMIT 1;
  
  FOR participant IN
    SELECT user_id FROM public.conversation_participants
    WHERE conversation_id = NEW.conversation_id AND user_id != NEW.sender_id
  LOOP
    INSERT INTO public.notifications (user_id, title, content, type, link)
    VALUES (
      participant.user_id,
      '💬 ' || COALESCE(sender_name, 'Utilisateur'),
      LEFT(NEW.content, 100),
      'message',
      '/app/messagerie'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Drop and recreate trigger to be safe
DROP TRIGGER IF EXISTS on_new_message_notify ON public.messages;
CREATE TRIGGER on_new_message_notify
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_message();

-- =============================================
-- FIX 5: Enable realtime for messages and notifications
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END$$;
