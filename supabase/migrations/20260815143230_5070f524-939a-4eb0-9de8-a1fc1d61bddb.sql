CREATE TABLE public.request_throttle (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scope text NOT NULL,
  identifier text NOT NULL,
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX request_throttle_bucket_idx
  ON public.request_throttle (scope, identifier, window_start);

CREATE INDEX request_throttle_window_idx
  ON public.request_throttle (window_start);

GRANT ALL ON public.request_throttle TO service_role;

ALTER TABLE public.request_throttle ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages throttle records"
  ON public.request_throttle FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER trg_request_throttle_updated
  BEFORE UPDATE ON public.request_throttle
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  _scope text,
  _identifier text,
  _max_requests integer,
  _window_seconds integer
)
RETURNS TABLE(allowed boolean, current_count integer, retry_after_seconds integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  bucket timestamptz;
  cnt integer;
BEGIN
  IF _identifier IS NULL OR btrim(_identifier) = '' THEN
    _identifier := 'unknown';
  END IF;
  IF _window_seconds IS NULL OR _window_seconds < 1 THEN
    _window_seconds := 3600;
  END IF;
  IF _max_requests IS NULL OR _max_requests < 1 THEN
    _max_requests := 1;
  END IF;

  bucket := to_timestamp(floor(extract(epoch FROM now()) / _window_seconds) * _window_seconds);

  INSERT INTO public.request_throttle (scope, identifier, window_start, request_count)
  VALUES (_scope, _identifier, bucket, 1)
  ON CONFLICT (scope, identifier, window_start)
  DO UPDATE SET request_count = public.request_throttle.request_count + 1
  RETURNING request_count INTO cnt;

  DELETE FROM public.request_throttle
  WHERE window_start < now() - interval '1 day';

  RETURN QUERY SELECT
    cnt <= _max_requests,
    cnt,
    GREATEST(0, CEIL(EXTRACT(epoch FROM (bucket + make_interval(secs => _window_seconds)) - now()))::integer);
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(text, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, text, integer, integer) TO service_role;

DROP POLICY IF EXISTS "Anyone can apply to a published role" ON public.job_applications;
REVOKE INSERT ON public.job_applications FROM anon;