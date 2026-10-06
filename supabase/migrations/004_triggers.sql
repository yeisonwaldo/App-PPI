-- 004_triggers.sql
-- Triggers de Construpay
-- Requiere: 002_tables.sql ejecutado previamente

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGERS: updated_at en todas las tablas
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'companies',
    'profiles',
    'projects',
    'employees',
    'payroll_periods',
    'payroll_items',
    'attendance_records',
    'document_types',
    'employee_documents',
    'leave_requests',
    'notifications'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t, t
    );
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER: Crear perfil automáticamente al registrar un nuevo usuario Auth
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, company_id, full_name, role)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data ->> 'company_id')::uuid,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'employee')
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Si no viene company_id en metadata, no bloquear el registro
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER: Notificar a admin/RRHH cuando se crea una solicitud de permiso
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_leave_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_emp_name   text;
  v_type_label text;
BEGIN
  -- Obtener datos del empleado
  SELECT
    e.company_id,
    e.first_name || ' ' || e.last_name
  INTO v_company_id, v_emp_name
  FROM employees e
  WHERE e.id = NEW.employee_id;

  -- Etiqueta legible del tipo de permiso
  v_type_label := CASE NEW.leave_type
    WHEN 'permiso'             THEN 'permiso'
    WHEN 'licencia_medica'     THEN 'licencia médica'
    WHEN 'licencia_maternidad' THEN 'licencia de maternidad'
    WHEN 'licencia_luto'       THEN 'licencia de luto'
    WHEN 'vacaciones'          THEN 'vacaciones'
    ELSE 'licencia'
  END;

  -- Insertar notificación para cada admin/hr activo de la empresa
  INSERT INTO notifications (
    company_id, user_id, title, message,
    type, entity_type, entity_id
  )
  SELECT
    v_company_id,
    p.id,
    'Nueva solicitud de ' || v_type_label,
    v_emp_name || ' solicitó ' || v_type_label ||
      ' del ' || to_char(NEW.start_date, 'DD/MM/YYYY') ||
      ' al '  || to_char(NEW.end_date,   'DD/MM/YYYY') ||
      ' (' || NEW.days || ' días)',
    'leave_request',
    'leave_requests',
    NEW.id
  FROM profiles p
  WHERE p.company_id = v_company_id
    AND p.role IN ('admin', 'hr')
    AND p.active = true;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_leave_request
  AFTER INSERT ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION notify_leave_request();

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER: Notificar cuando una solicitud de permiso cambia de estado
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_leave_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_emp_profile_id uuid;
  v_status_label   text;
BEGIN
  -- Solo actuar si el status cambió de 'pending' a algo
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Obtener perfil del empleado
  SELECT profile_id INTO v_emp_profile_id
  FROM employees WHERE id = NEW.employee_id;

  IF v_emp_profile_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_status_label := CASE NEW.status
    WHEN 'approved' THEN 'aprobada ✅'
    WHEN 'rejected' THEN 'rechazada ❌'
    ELSE NEW.status::text
  END;

  INSERT INTO notifications (
    company_id, user_id, title, message,
    type, entity_type, entity_id
  )
  SELECT
    e.company_id,
    v_emp_profile_id,
    'Tu solicitud fue ' || v_status_label,
    COALESCE(NEW.review_notes, 'Tu solicitud de ' ||
      NEW.leave_type::text || ' del ' ||
      to_char(NEW.start_date, 'DD/MM/YYYY') || ' al ' ||
      to_char(NEW.end_date, 'DD/MM/YYYY') || ' fue ' || v_status_label),
    'leave_request',
    'leave_requests',
    NEW.id
  FROM employees e
  WHERE e.id = NEW.employee_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_leave_status_change
  AFTER UPDATE OF status ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION notify_leave_status_change();
