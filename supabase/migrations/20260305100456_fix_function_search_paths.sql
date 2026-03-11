
-- ============================================================
-- Fix mutable search_path on public functions
-- ============================================================

-- get_team_member_ids: recursive CTE to find subordinates
CREATE OR REPLACE FUNCTION public.get_team_member_ids(superior_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SET search_path = public
AS $function$
  WITH RECURSIVE team AS (
    SELECT id FROM public.users WHERE reports_to = superior_id AND is_active = true
    UNION ALL
    SELECT u.id FROM public.users u INNER JOIN team t ON u.reports_to = t.id WHERE u.is_active = true
  )
  SELECT id FROM team;
$function$;

-- update_updated_at: trigger function for leads/users
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- update_candidates_updated_at: trigger function for candidates
CREATE OR REPLACE FUNCTION public.update_candidates_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
;
