CREATE OR REPLACE FUNCTION public.refresh_provider_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  UPDATE public.providers
  SET
    rating = COALESCE((SELECT ROUND(AVG(score)::numeric, 1) FROM public.ratings WHERE provider_id = NEW.provider_id), 0),
    jobs = (SELECT COUNT(*) FROM public.ratings WHERE provider_id = NEW.provider_id)
  WHERE id = NEW.provider_id;
  INSERT INTO public.notifications (user_id, title, body, href)
  SELECT user_id, 'Rating baru diterima', 'Anda menerima rating ' || NEW.score || ' dari client.', '/profile'
  FROM public.providers
  WHERE id = NEW.provider_id AND user_id IS NOT NULL;
  RETURN NEW;
END;
$$;

UPDATE public.providers SET rating = ROUND(rating::numeric, 1);
