
-- Fix: drop the overly permissive booking policy and replace with a more specific one
DROP POLICY "Entrepreneurs can book slots" ON public.mentor_availability_slots;

-- Entrepreneurs can book available slots (only set booked_by to their own id)
CREATE POLICY "Users can book available slots"
  ON public.mentor_availability_slots FOR UPDATE
  TO authenticated USING (
    is_booked = false AND mentor_id != auth.uid()
  ) WITH CHECK (
    booked_by = auth.uid() AND is_booked = true
  );
