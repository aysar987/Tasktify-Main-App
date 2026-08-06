ALTER TABLE public.tasks ADD COLUMN budget INTEGER;
UPDATE public.tasks SET budget = max_budget;
ALTER TABLE public.tasks ALTER COLUMN budget SET NOT NULL;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_budget_check CHECK (budget >= 0);
ALTER TABLE public.tasks DROP COLUMN min_budget;
ALTER TABLE public.tasks DROP COLUMN max_budget;
