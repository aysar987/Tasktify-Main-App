DELETE FROM public.conversations
WHERE user_id = '00000000-0000-0000-0000-000000000001';

DELETE FROM public.tasks
WHERE user_id = '00000000-0000-0000-0000-000000000001';

DELETE FROM public.users
WHERE id = '00000000-0000-0000-0000-000000000001';

ALTER TABLE public.users RENAME TO profiles;
ALTER TABLE public.profiles DROP COLUMN password_hash;
ALTER TABLE public.profiles DROP COLUMN verified;
ALTER TABLE public.profiles ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.profiles ADD COLUMN full_name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_auth_user_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, phone, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'username', ''), split_part(COALESCE(NEW.email, NEW.id::text), '@', 1)),
    NULLIF(NEW.raw_user_meta_data ->> 'phone', ''),
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''), split_part(COALESCE(NEW.email, 'Pengguna'), '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, username, phone, email, full_name)
SELECT
  id,
  COALESCE(NULLIF(raw_user_meta_data ->> 'username', ''), split_part(COALESCE(email, id::text), '@', 1) || '_' || left(id::text, 8)),
  NULLIF(raw_user_meta_data ->> 'phone', ''),
  email,
  COALESCE(NULLIF(raw_user_meta_data ->> 'full_name', ''), split_part(COALESCE(email, 'Pengguna'), '@', 1))
FROM auth.users
ON CONFLICT (id) DO NOTHING;

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_created
  ON public.messages(conversation_id, created_at);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can read own tasks"
  ON public.tasks FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own tasks"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own tasks"
  ON public.tasks FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can read own conversations"
  ON public.conversations FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own conversations"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own conversations"
  ON public.conversations FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can read conversation messages"
  ON public.messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
        AND conversations.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can send conversation messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
        AND conversations.user_id = (SELECT auth.uid())
    )
  );
