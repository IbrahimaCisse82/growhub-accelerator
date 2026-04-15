
-- Utility function to create notifications easily
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_title text,
  p_content text DEFAULT NULL,
  p_type text DEFAULT 'info',
  p_link text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, content, type, link, is_read)
  VALUES (p_user_id, p_title, p_content, p_type, p_link, false);
END;
$$;

-- Function to compute a startup health score from KPIs
CREATE OR REPLACE FUNCTION public.compute_startup_health_score(p_startup_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  kpi_count integer;
  recent_kpi_count integer;
  positive_trends integer;
  total_with_trend integer;
  score integer := 0;
BEGIN
  -- Count total KPIs
  SELECT count(*) INTO kpi_count FROM public.startup_kpis WHERE startup_id = p_startup_id;
  IF kpi_count = 0 THEN RETURN 0; END IF;

  -- Count KPIs recorded in the last 90 days (data freshness)
  SELECT count(*) INTO recent_kpi_count FROM public.startup_kpis 
  WHERE startup_id = p_startup_id AND recorded_at >= (now() - interval '90 days');

  -- Count positive trends (latest value > previous value per metric)
  SELECT count(*) FILTER (WHERE trend > 0), count(*) 
  INTO positive_trends, total_with_trend
  FROM (
    SELECT metric_name,
      metric_value - lag(metric_value) OVER (PARTITION BY metric_name ORDER BY recorded_at) as trend
    FROM public.startup_kpis WHERE startup_id = p_startup_id
  ) sub WHERE trend IS NOT NULL;

  -- Score components (max 100)
  -- Data coverage: up to 30 points (1 point per distinct metric, max 30)
  score := score + LEAST((SELECT count(DISTINCT metric_name) FROM public.startup_kpis WHERE startup_id = p_startup_id) * 5, 30);
  
  -- Data freshness: up to 30 points
  score := score + LEAST(recent_kpi_count * 3, 30);
  
  -- Growth trends: up to 40 points
  IF total_with_trend > 0 THEN
    score := score + (positive_trends * 40 / total_with_trend);
  END IF;

  RETURN LEAST(score, 100);
END;
$$;
