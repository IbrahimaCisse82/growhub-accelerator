
-- Enable realtime for notifications (messages already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create trigger function to notify conversation participants on new message
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

CREATE TRIGGER on_new_message_notify
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_message();
