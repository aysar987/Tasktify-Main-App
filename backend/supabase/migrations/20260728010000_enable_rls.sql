ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read providers"
  ON public.providers
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can read banners"
  ON public.banners
  FOR SELECT
  TO anon, authenticated
  USING (true);

COMMENT ON POLICY "Public can read providers" ON public.providers IS
  'Marketplace data is public. All writes go through trusted Edge Functions.';

COMMENT ON POLICY "Public can read banners" ON public.banners IS
  'Homepage banners are public. All writes go through trusted Edge Functions.';
