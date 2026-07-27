ALTER TABLE public.providers
  ADD COLUMN user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN bio TEXT NOT NULL DEFAULT '';

ALTER TABLE public.tasks DROP CONSTRAINT tasks_status_check;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('waiting', 'scheduled', 'ongoing', 'history', 'cancelled', 'rejected'));

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  href TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL UNIQUE REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  review TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.task_locations (
  task_id TEXT PRIMARY KEY REFERENCES public.tasks(id) ON DELETE CASCADE,
  provider_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_ratings_provider ON public.ratings(provider_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Public can read ratings"
  ON public.ratings FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Clients can rate completed own tasks"
  ON public.ratings FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = ratings.task_id
        AND tasks.user_id = (SELECT auth.uid())
        AND tasks.provider_id = ratings.provider_id
        AND tasks.status = 'history'
    )
  );

CREATE POLICY "Task clients can read provider location"
  ON public.task_locations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_locations.task_id
        AND tasks.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Assigned providers can read own location"
  ON public.task_locations FOR SELECT TO authenticated
  USING (provider_user_id = (SELECT auth.uid()));

CREATE POLICY "Assigned providers can publish location"
  ON public.task_locations FOR INSERT TO authenticated
  WITH CHECK (
    provider_user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.tasks
      JOIN public.providers ON providers.id = tasks.provider_id
      WHERE tasks.id = task_locations.task_id
        AND providers.user_id = (SELECT auth.uid())
        AND tasks.status = 'ongoing'
    )
  );

CREATE POLICY "Assigned providers can update location"
  ON public.task_locations FOR UPDATE TO authenticated
  USING (provider_user_id = (SELECT auth.uid()))
  WITH CHECK (provider_user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create provider profile"
  ON public.providers FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Providers can update own profile"
  ON public.providers FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Providers can read assigned tasks"
  ON public.tasks FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = tasks.provider_id
        AND providers.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY "Users can update own tasks" ON public.tasks;

CREATE POLICY "Providers can read assigned conversations"
  ON public.conversations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = conversations.provider_id
        AND providers.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Providers can read assigned client profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.conversations
      JOIN public.providers ON providers.id = conversations.provider_id
      WHERE conversations.user_id = profiles.id
        AND providers.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Providers can update assigned conversations"
  ON public.conversations FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = conversations.provider_id
        AND providers.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = conversations.provider_id
        AND providers.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Participants can read messages"
  ON public.messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.conversations
      LEFT JOIN public.providers ON providers.id = conversations.provider_id
      WHERE conversations.id = messages.conversation_id
        AND (
          conversations.user_id = (SELECT auth.uid())
          OR providers.user_id = (SELECT auth.uid())
        )
    )
  );

DROP POLICY "Users can read conversation messages" ON public.messages;
DROP POLICY "Users can send conversation messages" ON public.messages;

CREATE POLICY "Participants can send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.conversations
      LEFT JOIN public.providers ON providers.id = conversations.provider_id
      WHERE conversations.id = messages.conversation_id
        AND (
          conversations.user_id = (SELECT auth.uid())
          OR providers.user_id = (SELECT auth.uid())
        )
    )
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar images are public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

CREATE OR REPLACE FUNCTION public.refresh_provider_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  UPDATE public.providers
  SET
    rating = COALESCE((SELECT AVG(score)::double precision FROM public.ratings WHERE provider_id = NEW.provider_id), 0),
    jobs = (SELECT COUNT(*) FROM public.ratings WHERE provider_id = NEW.provider_id)
  WHERE id = NEW.provider_id;
  INSERT INTO public.notifications (user_id, title, body, href)
  SELECT user_id, 'Rating baru diterima', 'Anda menerima rating ' || NEW.score || ' dari client.', '/profile'
  FROM public.providers
  WHERE id = NEW.provider_id AND user_id IS NOT NULL;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_rating_created
  AFTER INSERT OR UPDATE ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.refresh_provider_rating();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'task_locations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.task_locations;
  END IF;
END $$;
