
CREATE OR REPLACE FUNCTION create_roadshow_bulk(
  p_events jsonb,
  p_config jsonb,
  p_attendees jsonb,
  p_created_by uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_ids uuid[] := '{}';
  v_event_id uuid;
  v_event jsonb;
BEGIN
  FOR v_event IN SELECT * FROM jsonb_array_elements(p_events)
  LOOP
    INSERT INTO events (
      title, description, event_type, event_date, start_time, end_time,
      location, created_by, external_attendees
    ) VALUES (
      v_event->>'title',
      NULLIF(v_event->>'description', ''),
      'roadshow',
      (v_event->>'event_date')::date,
      (v_event->>'start_time')::time,
      CASE WHEN v_event->>'end_time' IS NOT NULL AND v_event->>'end_time' != ''
           THEN (v_event->>'end_time')::time ELSE NULL END,
      NULLIF(v_event->>'location', ''),
      p_created_by,
      '[]'::jsonb
    )
    RETURNING id INTO v_event_id;

    v_event_ids := array_append(v_event_ids, v_event_id);

    INSERT INTO roadshow_configs (
      event_id, weekly_cost, slots_per_day, expected_start_time,
      late_grace_minutes, suggested_sitdowns, suggested_pitches, suggested_closed
    ) VALUES (
      v_event_id,
      (p_config->>'weekly_cost')::numeric,
      (p_config->>'slots_per_day')::int,
      (p_config->>'expected_start_time')::time,
      (p_config->>'late_grace_minutes')::int,
      (p_config->>'suggested_sitdowns')::int,
      (p_config->>'suggested_pitches')::int,
      (p_config->>'suggested_closed')::int
    );
  END LOOP;

  IF jsonb_array_length(p_attendees) > 0 THEN
    INSERT INTO event_attendees (event_id, user_id, attendee_role)
    SELECT v_eid, (att->>'user_id')::uuid, att->>'attendee_role'
    FROM unnest(v_event_ids) v_eid
    CROSS JOIN jsonb_array_elements(p_attendees) att;
  END IF;

  RETURN jsonb_build_object(
    'event_ids', to_jsonb(v_event_ids),
    'count', array_length(v_event_ids, 1)
  );
END;
$$;
;
