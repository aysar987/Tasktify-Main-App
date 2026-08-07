ALTER TABLE public.payments
  ADD COLUMN method TEXT NOT NULL DEFAULT 'online' CHECK (method IN ('online', 'cash'));

CREATE POLICY "Providers can read payments for assigned tasks"
  ON public.payments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.tasks
      JOIN public.providers ON providers.id = tasks.provider_id
      WHERE tasks.id = payments.task_id
        AND providers.user_id = (SELECT auth.uid())
    )
  );
