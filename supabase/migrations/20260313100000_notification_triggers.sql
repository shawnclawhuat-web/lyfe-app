-- Notification triggers: insert in-app notifications on data changes
-- ============================================================================
-- Push delivery is handled separately by the send-push-notification edge function
-- via DB webhook on notifications INSERT.

-- ── Helper: insert a notification row ────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_insert(
    p_user_id uuid,
    p_type text,
    p_title text,
    p_body text,
    p_data jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (p_user_id, p_type, p_title, p_body, p_data);
END;
$$;


-- ══════════════════════════════════════════════════════════════════════════════
-- 1. candidate_update — candidates.status changes
--    Recipients: created_by_id (PA) + assigned_manager_id (manager)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION trigger_notify_candidate_update()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_status_label text;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        v_status_label := replace(NEW.status::text, '_', ' ');
        v_status_label := upper(left(v_status_label, 1)) || substring(v_status_label from 2);

        -- Notify PA (created_by_id)
        PERFORM notify_insert(
            NEW.created_by_id,
            'candidate_update',
            'Candidate Status Updated',
            NEW.name || ' moved to ' || v_status_label,
            jsonb_build_object(
                'route', '/(tabs)/pa/candidate/' || NEW.id,
                'candidateId', NEW.id,
                'fromStatus', OLD.status::text,
                'toStatus', NEW.status::text
            )
        );

        -- Notify manager (if different from PA)
        IF NEW.assigned_manager_id IS DISTINCT FROM NEW.created_by_id THEN
            PERFORM notify_insert(
                NEW.assigned_manager_id,
                'candidate_update',
                'Candidate Status Updated',
                NEW.name || ' moved to ' || v_status_label,
                jsonb_build_object(
                    'route', '/(tabs)/pa/candidate/' || NEW.id,
                    'candidateId', NEW.id,
                    'fromStatus', OLD.status::text,
                    'toStatus', NEW.status::text
                )
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_candidate_update
    AFTER UPDATE ON candidates
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION trigger_notify_candidate_update();


-- ══════════════════════════════════════════════════════════════════════════════
-- 2. lead_milestone — leads.status changes to 'won' or 'lost'
--    Recipients: agent's manager (users.reports_to)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION trigger_notify_lead_milestone()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_agent_name text;
    v_manager_id uuid;
    v_director_id uuid;
    v_status_label text;
BEGIN
    IF NEW.status IN ('won', 'lost') AND OLD.status IS DISTINCT FROM NEW.status THEN
        v_status_label := upper(left(NEW.status::text, 1)) || substring(NEW.status::text from 2);

        SELECT full_name, reports_to INTO v_agent_name, v_manager_id
        FROM users WHERE id = NEW.assigned_to;

        -- Notify manager
        IF v_manager_id IS NOT NULL THEN
            PERFORM notify_insert(
                v_manager_id,
                'lead_milestone',
                'Lead ' || v_status_label,
                NEW.full_name || ' marked as ' || lower(v_status_label) || ' by ' || coalesce(v_agent_name, 'an agent'),
                jsonb_build_object(
                    'route', '/(tabs)/leads/' || NEW.id,
                    'leadId', NEW.id,
                    'status', NEW.status::text
                )
            );

            -- Also notify director (manager's reports_to)
            SELECT reports_to INTO v_director_id FROM users WHERE id = v_manager_id;
            IF v_director_id IS NOT NULL THEN
                PERFORM notify_insert(
                    v_director_id,
                    'lead_milestone',
                    'Lead ' || v_status_label,
                    NEW.full_name || ' marked as ' || lower(v_status_label) || ' by ' || coalesce(v_agent_name, 'an agent'),
                    jsonb_build_object(
                        'route', '/(tabs)/leads/' || NEW.id,
                        'leadId', NEW.id,
                        'status', NEW.status::text
                    )
                );
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_lead_milestone
    AFTER UPDATE ON leads
    FOR EACH ROW
    WHEN (NEW.status IN ('won', 'lost') AND OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION trigger_notify_lead_milestone();


-- ══════════════════════════════════════════════════════════════════════════════
-- 3. lead_reassigned — leads.assigned_to changes
--    Recipients: old agent + new agent
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION trigger_notify_lead_reassigned()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_old_manager_id uuid;
    v_new_manager_id uuid;
BEGIN
    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
        -- Notify old agent (lead removed)
        PERFORM notify_insert(
            OLD.assigned_to,
            'lead_reassigned',
            'Lead Reassigned',
            NEW.full_name || ' has been reassigned to another agent',
            jsonb_build_object(
                'route', '/(tabs)/leads/' || NEW.id,
                'leadId', NEW.id
            )
        );

        -- Notify new agent (lead received)
        PERFORM notify_insert(
            NEW.assigned_to,
            'lead_reassigned',
            'Lead Assigned to You',
            NEW.full_name || ' has been assigned to you',
            jsonb_build_object(
                'route', '/(tabs)/leads/' || NEW.id,
                'leadId', NEW.id
            )
        );

        -- Check for cross-team reassignment → notify admins
        SELECT reports_to INTO v_old_manager_id FROM users WHERE id = OLD.assigned_to;
        SELECT reports_to INTO v_new_manager_id FROM users WHERE id = NEW.assigned_to;

        IF v_old_manager_id IS DISTINCT FROM v_new_manager_id THEN
            -- Notify all admins
            INSERT INTO notifications (user_id, type, title, body, data)
            SELECT
                u.id,
                'lead_reassigned_global',
                'Cross-Team Lead Reassignment',
                NEW.full_name || ' reassigned across teams',
                jsonb_build_object(
                    'route', '/(tabs)/leads/' || NEW.id,
                    'leadId', NEW.id
                )
            FROM users u
            WHERE u.role = 'admin';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_lead_reassigned
    AFTER UPDATE ON leads
    FOR EACH ROW
    WHEN (OLD.assigned_to IS DISTINCT FROM NEW.assigned_to)
    EXECUTE FUNCTION trigger_notify_lead_reassigned();


-- ══════════════════════════════════════════════════════════════════════════════
-- 4. interview_scheduled — interviews INSERT
--    Recipients: manager_id + scheduled_by_id (if different)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION trigger_notify_interview_scheduled()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_candidate_name text;
    v_datetime_label text;
BEGIN
    IF NEW.status = 'scheduled' THEN
        SELECT name INTO v_candidate_name FROM candidates WHERE id = NEW.candidate_id;
        v_datetime_label := to_char(NEW.datetime AT TIME ZONE 'Asia/Singapore', 'Mon DD, HH12:MI AM');

        -- Notify manager
        PERFORM notify_insert(
            NEW.manager_id,
            'interview_scheduled',
            'Interview Scheduled',
            'Interview with ' || coalesce(v_candidate_name, 'a candidate') || ' on ' || v_datetime_label,
            jsonb_build_object(
                'route', '/(tabs)/pa/candidate/' || NEW.candidate_id,
                'candidateId', NEW.candidate_id,
                'interviewId', NEW.id
            )
        );

        -- Notify scheduler (PA) if different from manager
        IF NEW.scheduled_by_id IS DISTINCT FROM NEW.manager_id THEN
            PERFORM notify_insert(
                NEW.scheduled_by_id,
                'interview_scheduled',
                'Interview Scheduled',
                'Interview with ' || coalesce(v_candidate_name, 'a candidate') || ' on ' || v_datetime_label,
                jsonb_build_object(
                    'route', '/(tabs)/pa/candidate/' || NEW.candidate_id,
                    'candidateId', NEW.candidate_id,
                    'interviewId', NEW.id
                )
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_interview_scheduled
    AFTER INSERT ON interviews
    FOR EACH ROW
    EXECUTE FUNCTION trigger_notify_interview_scheduled();


-- ══════════════════════════════════════════════════════════════════════════════
-- 5. interview_updated — interviews UPDATE (status or datetime changed)
--    Recipients: manager_id + scheduled_by_id
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION trigger_notify_interview_updated()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_candidate_name text;
    v_title text;
    v_body text;
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('rescheduled', 'cancelled'))
       OR (OLD.datetime IS DISTINCT FROM NEW.datetime) THEN

        SELECT name INTO v_candidate_name FROM candidates WHERE id = NEW.candidate_id;

        IF NEW.status = 'cancelled' THEN
            v_title := 'Interview Cancelled';
            v_body := 'Interview with ' || coalesce(v_candidate_name, 'a candidate') || ' has been cancelled';
        ELSE
            v_title := 'Interview Rescheduled';
            v_body := 'Interview with ' || coalesce(v_candidate_name, 'a candidate') ||
                      ' moved to ' || to_char(NEW.datetime AT TIME ZONE 'Asia/Singapore', 'Mon DD, HH12:MI AM');
        END IF;

        -- Notify manager
        PERFORM notify_insert(
            NEW.manager_id,
            'interview_updated',
            v_title,
            v_body,
            jsonb_build_object(
                'route', '/(tabs)/pa/candidate/' || NEW.candidate_id,
                'candidateId', NEW.candidate_id,
                'interviewId', NEW.id,
                'status', NEW.status::text
            )
        );

        -- Notify scheduler if different
        IF NEW.scheduled_by_id IS DISTINCT FROM NEW.manager_id THEN
            PERFORM notify_insert(
                NEW.scheduled_by_id,
                'interview_updated',
                v_title,
                v_body,
                jsonb_build_object(
                    'route', '/(tabs)/pa/candidate/' || NEW.candidate_id,
                    'candidateId', NEW.candidate_id,
                    'interviewId', NEW.id,
                    'status', NEW.status::text
                )
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_interview_updated
    AFTER UPDATE ON interviews
    FOR EACH ROW
    EXECUTE FUNCTION trigger_notify_interview_updated();


-- ══════════════════════════════════════════════════════════════════════════════
-- 6. candidate_assigned — candidates INSERT
--    Recipients: assigned_manager_id
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION trigger_notify_candidate_assigned()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Notify the assigned manager that a new candidate was added
    PERFORM notify_insert(
        NEW.assigned_manager_id,
        'candidate_assigned',
        'New Candidate Assigned',
        NEW.name || ' has been added to your candidates',
        jsonb_build_object(
            'route', '/(tabs)/pa/candidate/' || NEW.id,
            'candidateId', NEW.id
        )
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_candidate_assigned
    AFTER INSERT ON candidates
    FOR EACH ROW
    EXECUTE FUNCTION trigger_notify_candidate_assigned();


-- ══════════════════════════════════════════════════════════════════════════════
-- 7. agent_invite_accepted — invite_tokens.consumed_by set
--    Recipients: created_by (the inviter)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION trigger_notify_invite_accepted()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_consumer_name text;
BEGIN
    IF OLD.consumed_by IS NULL AND NEW.consumed_by IS NOT NULL THEN
        SELECT full_name INTO v_consumer_name FROM users WHERE id = NEW.consumed_by;

        PERFORM notify_insert(
            NEW.created_by,
            'agent_invite_accepted',
            'Invite Accepted',
            coalesce(v_consumer_name, 'A new user') || ' accepted your invite and joined as ' || NEW.intended_role::text,
            jsonb_build_object(
                'route', '/(tabs)/team',
                'userId', NEW.consumed_by
            )
        );
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_invite_accepted
    AFTER UPDATE ON invite_tokens
    FOR EACH ROW
    WHEN (OLD.consumed_by IS NULL AND NEW.consumed_by IS NOT NULL)
    EXECUTE FUNCTION trigger_notify_invite_accepted();


-- ══════════════════════════════════════════════════════════════════════════════
-- 8. module_completed — candidate_module_progress marked complete by someone else
--    Recipients: candidate_id (the candidate whose module was completed)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION trigger_notify_module_completed()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_module_title text;
    v_completer_name text;
BEGIN
    IF NEW.status = 'completed'
       AND (OLD.status IS NULL OR OLD.status IS DISTINCT FROM NEW.status)
       AND NEW.completed_by IS NOT NULL
       AND NEW.completed_by IS DISTINCT FROM NEW.candidate_id THEN

        SELECT title INTO v_module_title FROM roadmap_modules WHERE id = NEW.module_id;
        SELECT full_name INTO v_completer_name FROM users WHERE id = NEW.completed_by;

        PERFORM notify_insert(
            NEW.candidate_id,
            'module_completed',
            'Module Marked Complete',
            coalesce(v_module_title, 'A module') || ' was marked complete by ' || coalesce(v_completer_name, 'your manager'),
            jsonb_build_object(
                'route', '/(tabs)/roadmap',
                'moduleId', NEW.module_id
            )
        );
    END IF;
    RETURN NEW;
END;
$$;

-- Fires on both INSERT (upsert creates new row) and UPDATE (upsert updates existing)
CREATE TRIGGER trg_notify_module_completed
    AFTER INSERT OR UPDATE ON candidate_module_progress
    FOR EACH ROW
    EXECUTE FUNCTION trigger_notify_module_completed();


-- ══════════════════════════════════════════════════════════════════════════════
-- 9. roadmap_unlocked — programme manually unlocked for candidate
--    Recipients: candidate_id
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION trigger_notify_roadmap_unlocked()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_programme_title text;
BEGIN
    IF NEW.manually_unlocked = true THEN
        SELECT title INTO v_programme_title FROM roadmap_programmes WHERE id = NEW.programme_id;

        PERFORM notify_insert(
            NEW.candidate_id,
            'roadmap_unlocked',
            'Programme Unlocked',
            coalesce(v_programme_title, 'A programme') || ' is now unlocked for you!',
            jsonb_build_object(
                'route', '/(tabs)/roadmap',
                'programmeId', NEW.programme_id
            )
        );
    END IF;
    RETURN NEW;
END;
$$;

-- Fires on INSERT (new enrollment) and UPDATE (manual unlock toggle)
CREATE TRIGGER trg_notify_roadmap_unlocked
    AFTER INSERT OR UPDATE ON candidate_programme_enrollment
    FOR EACH ROW
    WHEN (NEW.manually_unlocked = true)
    EXECUTE FUNCTION trigger_notify_roadmap_unlocked();


-- ══════════════════════════════════════════════════════════════════════════════
-- 10. new_manager_joined — user with role=manager created or promoted
--     Recipients: reports_to (director)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION trigger_notify_new_manager_joined()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.role = 'manager' AND NEW.reports_to IS NOT NULL THEN
        -- Only fire if this is a new manager (INSERT or role change)
        IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role) THEN
            PERFORM notify_insert(
                NEW.reports_to,
                'new_manager_joined',
                'New Manager Joined',
                coalesce(NEW.full_name, 'A new manager') || ' has joined as a manager',
                jsonb_build_object(
                    'route', '/(tabs)/team',
                    'userId', NEW.id
                )
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_new_manager_joined
    AFTER INSERT OR UPDATE ON users
    FOR EACH ROW
    WHEN (NEW.role = 'manager' AND NEW.reports_to IS NOT NULL)
    EXECUTE FUNCTION trigger_notify_new_manager_joined();
