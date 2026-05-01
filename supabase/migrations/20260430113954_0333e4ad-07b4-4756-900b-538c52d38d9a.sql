-- Function: log CCR changes to audit_trail_logs
CREATE OR REPLACE FUNCTION public.log_ccr_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_changes jsonb := '[]'::jsonb;
  v_action text;
  v_company_id uuid;
  v_entity_id uuid;
  v_entity_name text;
  v_old jsonb;
  v_new jsonb;
  v_key text;
  v_old_val jsonb;
  v_new_val jsonb;
  -- Fields excluded from diff (system / auto-managed)
  v_excluded text[] := ARRAY[
    'id','ccr_id','company_id','created_at','updated_at','created_by'
  ];
BEGIN
  v_user_id := auth.uid();

  IF (TG_OP = 'DELETE') THEN
    v_action := 'ccr_deleted';
    v_company_id := OLD.company_id;
    v_entity_id := OLD.id;
    v_entity_name := COALESCE(OLD.ccr_id, OLD.title, OLD.id::text);
    v_changes := to_jsonb(OLD);
  ELSIF (TG_OP = 'INSERT') THEN
    v_action := 'ccr_created';
    v_company_id := NEW.company_id;
    v_entity_id := NEW.id;
    v_entity_name := COALESCE(NEW.ccr_id, NEW.title, NEW.id::text);
    v_changes := to_jsonb(NEW);
  ELSE
    v_action := 'ccr_updated';
    v_company_id := NEW.company_id;
    v_entity_id := NEW.id;
    v_entity_name := COALESCE(NEW.ccr_id, NEW.title, NEW.id::text);

    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);

    -- Build field-level diff array matching FieldChange[] shape
    FOR v_key IN SELECT jsonb_object_keys(v_new)
    LOOP
      IF v_key = ANY(v_excluded) THEN
        CONTINUE;
      END IF;
      v_old_val := v_old -> v_key;
      v_new_val := v_new -> v_key;
      IF v_old_val IS DISTINCT FROM v_new_val THEN
        v_changes := v_changes || jsonb_build_array(jsonb_build_object(
          'field', v_key,
          'oldValue', CASE WHEN v_old_val IS NULL OR v_old_val = 'null'::jsonb THEN NULL
                           WHEN jsonb_typeof(v_old_val) = 'string' THEN v_old_val #>> '{}'
                           ELSE v_old_val::text END,
          'newValue', CASE WHEN v_new_val IS NULL OR v_new_val = 'null'::jsonb THEN NULL
                           WHEN jsonb_typeof(v_new_val) = 'string' THEN v_new_val #>> '{}'
                           ELSE v_new_val::text END
        ));
      END IF;
    END LOOP;

    -- Skip no-op updates (no real field change)
    IF jsonb_array_length(v_changes) = 0 THEN
      RETURN NEW;
    END IF;
  END IF;

  INSERT INTO public.audit_trail_logs (
    company_id, user_id, category, action,
    entity_type, entity_id, entity_name,
    reason, changes, action_details
  ) VALUES (
    v_company_id,
    v_user_id,
    'quality_process',
    v_action,
    'change_control_request',
    v_entity_id,
    v_entity_name,
    NULL,
    v_changes,
    jsonb_build_object('ccr_id', v_entity_name)
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_ccr_audit ON public.change_control_requests;
CREATE TRIGGER trg_log_ccr_audit
AFTER INSERT OR UPDATE OR DELETE ON public.change_control_requests
FOR EACH ROW EXECUTE FUNCTION public.log_ccr_audit();