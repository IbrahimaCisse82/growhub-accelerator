CREATE POLICY "Users create own portfolios"
ON public.portfolios FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);