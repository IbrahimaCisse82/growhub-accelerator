
-- Fix permissive RLS policy on message_mentions
DROP POLICY "Members create mentions" ON public.message_mentions;

CREATE POLICY "Members create mentions" ON public.message_mentions FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.channel_messages cm
      JOIN public.channel_members cmb ON cmb.channel_id = cm.channel_id
      WHERE cm.id = message_mentions.message_id AND cmb.user_id = auth.uid()
    )
  );
