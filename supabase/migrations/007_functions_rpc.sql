-- 007_functions_rpc.sql
-- Funciones RPC de Construpay
-- Requiere: todas las migraciones anteriores ejecutadas

-- ─────────────────────────────────────────────────────────────────────────────
-- calculate_payroll(p_period_id uuid)
--
-- Calcula la nómina para un periodo dado:
--   1. Lee payroll_settings de la empresa (nunca hardcodeado)
--   2. Cruza con attendance_records para días trabajados y horas extra
--   3. Aplica fórmulas: devengado, auxilio transporte, horas extra, deducciones
--   4. Inserta/actualiza payroll_items (upsert)
--   5. Actualiza totales en payroll_periods
--
-- Llámada desde el cliente: supabase.rpc('calculate_payroll', { p_period_id: '...' })
-- Solo admin/HR pueden ejecutarla (verificación en la función)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION calculate_payroll(p_period_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period         payroll_periods%ROWTYPE;
  v_settings       jsonb;
  v_emp            employees%ROWTYPE;
  -- Parámetros desde settings (nunca hardcodeados)
  v_salary_min     numeric;
  v_aux_transport  numeric;
  v_pct_salud      numeric;
  v_pct_pension    numeric;
  v_pct_hora_ext   numeric;
  v_horas_jornada  numeric;
  -- Cálculos por empleado
  v_days_worked    numeric;
  v_overtime_h     numeric;
  v_base_pay       numeric;
  v_transport      numeric;
  v_overtime_pay   numeric;
  v_total_earned   numeric;
  v_health_ded     numeric;
  v_pension_ded    numeric;
  v_total_ded      numeric;
  v_net_pay        numeric;
  v_valor_hora     numeric;
  v_items_count    int := 0;
BEGIN
  -- ── Verificar permisos ──────────────────────────────────────────────────
  IF auth_user_role() NOT IN ('admin', 'hr') THEN
    RAISE EXCEPTION 'Acceso denegado: solo admin o RRHH pueden calcular nómina';
  END IF;

  -- ── Cargar y validar periodo ────────────────────────────────────────────
  SELECT * INTO v_period FROM payroll_periods WHERE id = p_period_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Periodo de nómina no encontrado: %', p_period_id;
  END IF;

  IF v_period.company_id <> auth_company_id() THEN
    RAISE EXCEPTION 'Acceso denegado: el periodo no pertenece a tu empresa';
  END IF;

  IF v_period.status = 'paid' THEN
    RAISE EXCEPTION 'El periodo ya está marcado como pagado. No se puede recalcular.';
  END IF;

  -- ── Cargar configuración de nómina de la empresa ────────────────────────
  SELECT payroll_settings INTO v_settings
  FROM companies WHERE id = v_period.company_id;

  v_salary_min    := (v_settings ->> 'salario_minimo')::numeric;
  v_aux_transport := (v_settings ->> 'auxilio_transporte')::numeric;
  v_pct_salud     := (v_settings ->> 'pct_salud_empleado')::numeric / 100;
  v_pct_pension   := (v_settings ->> 'pct_pension_empleado')::numeric / 100;
  v_pct_hora_ext  := (v_settings ->> 'pct_hora_extra_diurna')::numeric / 100;
  v_horas_jornada := (v_settings ->> 'horas_jornada_diaria')::numeric;

  -- ── Calcular por cada empleado activo ───────────────────────────────────
  FOR v_emp IN
    SELECT * FROM employees
    WHERE company_id = v_period.company_id
      AND status IN ('active', 'vacation')
    ORDER BY last_name, first_name
  LOOP
    -- Días trabajados (presentes o tardanzas cuentan como día trabajado)
    SELECT COALESCE(
      COUNT(*) FILTER (WHERE ar.status IN ('present', 'late')),
      -- Si no hay registros de asistencia, asumir mes completo
      (v_period.end_date - v_period.start_date + 1)
    )
    INTO v_days_worked
    FROM attendance_records ar
    WHERE ar.employee_id = v_emp.id
      AND ar.work_date BETWEEN v_period.start_date AND v_period.end_date;

    -- Horas extra acumuladas en el periodo
    SELECT COALESCE(SUM(ar.overtime_hours), 0)
    INTO v_overtime_h
    FROM attendance_records ar
    WHERE ar.employee_id = v_emp.id
      AND ar.work_date BETWEEN v_period.start_date AND v_period.end_date;

    -- Salario base proporcional a los 30 días del mes laboral
    v_base_pay := ROUND(v_emp.base_salary * v_days_worked / 30, 0);

    -- Auxilio de transporte: solo si salario base <= 2 SMLV
    -- (proporcional igual que el salario base)
    v_transport := CASE
      WHEN v_emp.base_salary <= (v_salary_min * 2)
        THEN ROUND(v_aux_transport * v_days_worked / 30, 0)
      ELSE 0
    END;

    -- Valor hora extra = (salario_mes / (30 días * horas_jornada)) * (1 + % extra)
    v_valor_hora   := ROUND(v_emp.base_salary / (30 * v_horas_jornada), 2);
    v_overtime_pay := ROUND(v_valor_hora * v_overtime_h * (1 + v_pct_hora_ext), 0);

    -- Total devengado
    v_total_earned := v_base_pay + v_transport + v_overtime_pay;

    -- Deducciones (sobre salario base mensual completo, no proporcional)
    -- Ley 100/1993: deducciones sobre IBC = salario + todo lo que NO sea auxilio transporte
    v_health_ded  := ROUND(v_emp.base_salary * v_pct_salud,   0);
    v_pension_ded := ROUND(v_emp.base_salary * v_pct_pension, 0);
    v_total_ded   := v_health_ded + v_pension_ded;

    -- Neto a pagar
    v_net_pay := GREATEST(v_total_earned - v_total_ded, 0);

    -- Upsert del desprendible individual
    INSERT INTO payroll_items (
      payroll_period_id, employee_id,
      days_worked, base_pay, transport_allowance, overtime_pay, bonuses,
      total_earned,
      health_deduction, pension_deduction, other_deductions, total_deductions,
      net_pay,
      details
    ) VALUES (
      p_period_id, v_emp.id,
      v_days_worked,
      v_base_pay,
      v_transport,
      v_overtime_pay,
      0,                -- bonuses: se agregan manualmente
      v_total_earned,
      v_health_ded,
      v_pension_ded,
      0,
      v_total_ded,
      v_net_pay,
      jsonb_build_object(
        'horas_extra',      v_overtime_h,
        'valor_hora',       v_valor_hora,
        'pct_extra_aplicado', v_pct_hora_ext * 100,
        'salario_minimo',   v_salary_min,
        'aplica_auxilio',   (v_emp.base_salary <= v_salary_min * 2),
        'dias_periodo',     (v_period.end_date - v_period.start_date + 1)
      )
    )
    ON CONFLICT (payroll_period_id, employee_id) DO UPDATE SET
      days_worked         = EXCLUDED.days_worked,
      base_pay            = EXCLUDED.base_pay,
      transport_allowance = EXCLUDED.transport_allowance,
      overtime_pay        = EXCLUDED.overtime_pay,
      total_earned        = EXCLUDED.total_earned,
      health_deduction    = EXCLUDED.health_deduction,
      pension_deduction   = EXCLUDED.pension_deduction,
      total_deductions    = EXCLUDED.total_deductions,
      net_pay             = EXCLUDED.net_pay,
      details             = EXCLUDED.details,
      updated_at          = now();

    v_items_count := v_items_count + 1;
  END LOOP;

  -- ── Actualizar totales del periodo ──────────────────────────────────────
  UPDATE payroll_periods SET
    status           = 'calculated',
    total_earned     = (SELECT COALESCE(SUM(total_earned),     0) FROM payroll_items WHERE payroll_period_id = p_period_id),
    total_deductions = (SELECT COALESCE(SUM(total_deductions), 0) FROM payroll_items WHERE payroll_period_id = p_period_id),
    total_net        = (SELECT COALESCE(SUM(net_pay),          0) FROM payroll_items WHERE payroll_period_id = p_period_id),
    updated_at       = now()
  WHERE id = p_period_id;

  RETURN jsonb_build_object(
    'success',      true,
    'period_id',    p_period_id,
    'employees',    v_items_count,
    'calculated_at', now()
  );
END;
$$;

COMMENT ON FUNCTION calculate_payroll(uuid) IS
  'Calcula nómina para un periodo. Lee parámetros de companies.payroll_settings. '
  'Solo ejecutable por admin/hr. Llámada via supabase.rpc(''calculate_payroll'', { p_period_id })';

-- ─────────────────────────────────────────────────────────────────────────────
-- check_document_expiry()
--
-- Crea notificaciones para documentos que vencen dentro de alert_days_before días.
-- Idempotente: no duplica notificaciones del mismo día.
-- Invocar diariamente via pg_cron o Edge Function/cron job.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_document_expiry()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  WITH documents_to_notify AS (
    SELECT DISTINCT
      e.company_id,
      p.id                AS profile_id,
      'Documento por vencer'::text AS title,
      dt.name || ' de ' || e.first_name || ' ' || e.last_name ||
        ' vence el ' || to_char(ed.expiry_date, 'DD/MM/YYYY') AS message,
      ed.id               AS document_id
    FROM employee_documents ed
    JOIN document_types dt ON dt.id = ed.document_type_id
    JOIN employees e ON e.id = ed.employee_id
    JOIN profiles p ON p.company_id = e.company_id
      AND p.role IN ('admin', 'hr')
      AND p.active = true
    WHERE dt.requires_expiry = true
      AND ed.expiry_date IS NOT NULL
      AND ed.expiry_date > CURRENT_DATE                                               -- No ya vencidos
      AND ed.expiry_date <= CURRENT_DATE + (dt.alert_days_before || ' days')::interval -- Dentro del umbral
      -- Idempotencia: no duplicar si ya se notificó hoy
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.entity_id   = ed.id
          AND n.type        = 'document_expiry'
          AND n.created_at::date = CURRENT_DATE
          AND n.user_id     = p.id
      )
  )
  INSERT INTO notifications (company_id, user_id, title, message, type, entity_type, entity_id)
  SELECT company_id, profile_id, title, message, 'document_expiry', 'employee_documents', document_id
  FROM documents_to_notify;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success',              true,
    'notifications_created', v_count,
    'checked_at',           now()
  );
END;
$$;

COMMENT ON FUNCTION check_document_expiry() IS
  'Crea notificaciones para documentos próximos a vencer. '
  'Idempotente (no duplica el mismo día). Invocar diariamente.';

-- ─────────────────────────────────────────────────────────────────────────────
-- get_dashboard_metrics(p_company_id uuid)
--
-- Retorna métricas del dashboard en una sola consulta.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id   uuid := auth_company_id();
  v_result       jsonb;
BEGIN
  SELECT jsonb_build_object(
    -- Empleados activos
    'active_employees', (
      SELECT COUNT(*) FROM employees
      WHERE company_id = v_company_id AND status = 'active'
    ),
    -- Nómina del mes en curso (total neto del último periodo calculado/pagado)
    'monthly_payroll', (
      SELECT COALESCE(total_net, 0)
      FROM payroll_periods
      WHERE company_id = v_company_id
        AND status IN ('calculated', 'paid')
      ORDER BY end_date DESC
      LIMIT 1
    ),
    -- Total documentos
    'total_documents', (
      SELECT COUNT(*)
      FROM employee_documents ed
      JOIN employees e ON e.id = ed.employee_id
      WHERE e.company_id = v_company_id
    ),
    -- Registros de asistencia del día actual
    'today_attendance', (
      SELECT COUNT(*)
      FROM attendance_records ar
      JOIN employees e ON e.id = ar.employee_id
      WHERE e.company_id = v_company_id
        AND ar.work_date = CURRENT_DATE
    ),
    -- Documentos por vencer en los próximos 30 días
    'expiring_documents', (
      SELECT COUNT(*)
      FROM employee_documents_view edv
      WHERE edv.company_id = v_company_id
        AND edv.status = 'por_vencer'
    ),
    -- Solicitudes de permiso pendientes
    'pending_leaves', (
      SELECT COUNT(*)
      FROM leave_requests lr
      JOIN employees e ON e.id = lr.employee_id
      WHERE e.company_id = v_company_id
        AND lr.status = 'pending'
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_dashboard_metrics() IS
  'Retorna métricas del dashboard en una sola llamada RPC para el usuario autenticado.';
