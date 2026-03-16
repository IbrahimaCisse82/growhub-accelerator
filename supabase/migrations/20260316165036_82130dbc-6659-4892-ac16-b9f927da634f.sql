
-- Create a function to start a conversation (adds both participants securely)
CREATE OR REPLACE FUNCTION public.start_conversation(_other_user_id uuid, _title text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _conv_id uuid;
  _caller uuid := auth.uid();
BEGIN
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _caller = _other_user_id THEN
    RAISE EXCEPTION 'Cannot start conversation with yourself';
  END IF;
  -- Verify other user exists and is approved
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _other_user_id AND is_approved = true) THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Create conversation
  INSERT INTO public.conversations (title, is_group) VALUES (_title, false) RETURNING id INTO _conv_id;
  
  -- Add both participants
  INSERT INTO public.conversation_participants (conversation_id, user_id) VALUES (_conv_id, _caller);
  INSERT INTO public.conversation_participants (conversation_id, user_id) VALUES (_conv_id, _other_user_id);
  
  RETURN _conv_id;
END;
$$;
