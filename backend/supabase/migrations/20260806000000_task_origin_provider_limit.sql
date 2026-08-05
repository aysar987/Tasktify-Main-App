ALTER TABLE public.tasks
  ADD COLUMN origin TEXT NOT NULL DEFAULT 'direct' CHECK (origin IN ('direct', 'marketplace'));

UPDATE public.tasks SET origin = 'marketplace' WHERE provider_id IS NULL AND status = 'waiting';

CREATE INDEX idx_tasks_provider_origin_status ON public.tasks(provider_id, origin, status);
