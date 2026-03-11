
ALTER TABLE roadshow_activities DROP CONSTRAINT roadshow_activities_type_check;
ALTER TABLE roadshow_activities ADD CONSTRAINT roadshow_activities_type_check
  CHECK (type = ANY (ARRAY['sitdown'::text, 'pitch'::text, 'case_closed'::text, 'check_in'::text, 'departure'::text]));
;
