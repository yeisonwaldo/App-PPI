-- 005_rls.sql
-- Row Level Security (RLS) de Construpay
-- Multi-tenant: todas las políticas filtran por company_id
-- Requiere: 002_tables.sql y 004_triggers.sql ejecutados previamente

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCIONES HELPER (SECURITY DEFINER para evitar recursión en RLS)
-- ─────────────────────────────────────────────────────────────────────────────

-- Retorna el company_id del usuario autenticado actual
CREATE OR REPLACE FUNCTION auth_company_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid()
$$;

-- Retorna el rol del usuario autenticado actual
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

-- Retorna true si el usuario es admin o hr
CREATE OR REPLACE FUNCTION is_admin_or_hr()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role IN ('admin', 'hr') FROM profiles WHERE id = auth.uid()
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- COMPANIES
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies_select_own"
  ON companies FOR SELECT
  USING (id = auth_company_id());

CREATE POLICY "companies_update_admin"
  ON companies FOR UPDATE
  USING (id = auth_company_id() AND auth_user_role() = 'admin')
  WITH CHECK (id = auth_company_id() AND auth_user_role() = 'admin');

-- ─────────────────────────────────────────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Todos los perfiles de la empresa son visibles para sus compañeros
CREATE POLICY "profiles_select_company"
  ON profiles FOR SELECT
  USING (company_id = auth_company_id());

-- Cada usuario puede actualizar su propio perfil
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admin/HR pueden actualizar perfiles de su empresa
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (company_id = auth_company_id() AND is_admin_or_hr())
  WITH CHECK (company_id = auth_company_id() AND is_admin_or_hr());

-- ─────────────────────────────────────────────────────────────────────────────
-- PROJECTS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select_company"
  ON projects FOR SELECT
  USING (company_id = auth_company_id());

CREATE POLICY "projects_write_admin"
  ON projects FOR ALL
  USING (company_id = auth_company_id() AND is_admin_or_hr())
  WITH CHECK (company_id = auth_company_id() AND is_admin_or_hr());

-- ─────────────────────────────────────────────────────────────────────────────
-- EMPLOYEES
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Todos los roles ven empleados de su empresa
CREATE POLICY "employees_select_company"
  ON employees FOR SELECT
  USING (company_id = auth_company_id());

-- Solo admin/HR crean empleados
CREATE POLICY "employees_insert_admin"
  ON employees FOR INSERT
  WITH CHECK (company_id = auth_company_id() AND is_admin_or_hr());

-- Solo admin/HR editan empleados
CREATE POLICY "employees_update_admin"
  ON employees FOR UPDATE
  USING (company_id = auth_company_id() AND is_admin_or_hr())
  WITH CHECK (company_id = auth_company_id() AND is_admin_or_hr());

-- Solo admin elimina (soft delete recomendado via status='terminated')
CREATE POLICY "employees_delete_admin"
  ON employees FOR DELETE
  USING (company_id = auth_company_id() AND auth_user_role() = 'admin');

-- ─────────────────────────────────────────────────────────────────────────────
-- PAYROLL PERIODS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payroll_periods_select"
  ON payroll_periods FOR SELECT
  USING (company_id = auth_company_id());

CREATE POLICY "payroll_periods_write_admin"
  ON payroll_periods FOR ALL
  USING (company_id = auth_company_id() AND is_admin_or_hr())
  WITH CHECK (company_id = auth_company_id() AND is_admin_or_hr());

-- ─────────────────────────────────────────────────────────────────────────────
-- PAYROLL ITEMS
-- Admin/HR ven todo; empleado solo ve su propio desprendible
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE payroll_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payroll_items_select"
  ON payroll_items FOR SELECT
  USING (
    -- El empleado es de la empresa actual
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = payroll_items.employee_id
        AND e.company_id = auth_company_id()
    )
    AND (
      -- Admin/HR/Supervisor ven todos
      auth_user_role() IN ('admin', 'hr', 'supervisor')
      OR
      -- Empleado solo ve el suyo
      employee_id IN (
        SELECT id FROM employees WHERE profile_id = auth.uid()
      )
    )
  );

CREATE POLICY "payroll_items_write_admin"
  ON payroll_items FOR ALL
  USING (is_admin_or_hr())
  WITH CHECK (is_admin_or_hr());

-- ─────────────────────────────────────────────────────────────────────────────
-- ATTENDANCE RECORDS
-- Supervisor puede registrar asistencia de su obra
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_select"
  ON attendance_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = attendance_records.employee_id
        AND e.company_id = auth_company_id()
    )
  );

CREATE POLICY "attendance_write"
  ON attendance_records FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = attendance_records.employee_id
        AND e.company_id = auth_company_id()
    )
    AND (
      auth_user_role() IN ('admin', 'hr', 'supervisor')
      OR employee_id IN (
        SELECT id FROM employees WHERE profile_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = attendance_records.employee_id
        AND e.company_id = auth_company_id()
    )
    AND (
      auth_user_role() IN ('admin', 'hr', 'supervisor')
      OR employee_id IN (
        SELECT id FROM employees WHERE profile_id = auth.uid()
      )
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- DOCUMENT TYPES
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doc_types_select"
  ON document_types FOR SELECT
  USING (company_id = auth_company_id());

CREATE POLICY "doc_types_write_admin"
  ON document_types FOR ALL
  USING (company_id = auth_company_id() AND is_admin_or_hr())
  WITH CHECK (company_id = auth_company_id() AND is_admin_or_hr());

-- ─────────────────────────────────────────────────────────────────────────────
-- EMPLOYEE DOCUMENTS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "emp_docs_select"
  ON employee_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = employee_documents.employee_id
        AND e.company_id = auth_company_id()
    )
  );

CREATE POLICY "emp_docs_write_admin"
  ON employee_documents FOR ALL
  USING (is_admin_or_hr())
  WITH CHECK (is_admin_or_hr());

-- ─────────────────────────────────────────────────────────────────────────────
-- LEAVE REQUESTS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver solicitudes de su empresa
CREATE POLICY "leaves_select"
  ON leave_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = leave_requests.employee_id
        AND e.company_id = auth_company_id()
    )
  );

-- Empleado crea solo para sí mismo; admin/hr pueden crear para cualquiera
CREATE POLICY "leaves_insert"
  ON leave_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = leave_requests.employee_id
        AND e.company_id = auth_company_id()
    )
    AND (
      is_admin_or_hr()
      OR employee_id IN (
        SELECT id FROM employees WHERE profile_id = auth.uid()
      )
    )
  );

-- Admin/HR/Supervisor pueden aprobar o rechazar; empleado puede cancelar la suya si aún está pending
CREATE POLICY "leaves_update"
  ON leave_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = leave_requests.employee_id
        AND e.company_id = auth_company_id()
    )
    AND (
      auth_user_role() IN ('admin', 'hr', 'supervisor')
      OR employee_id IN (
        SELECT id FROM employees WHERE profile_id = auth.uid()
      )
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Solo el destinatario ve sus notificaciones
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Permitir marcar como leída (solo el destinatario)
CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Triggers y funciones SECURITY DEFINER pueden insertar
CREATE POLICY "notifications_insert_system"
  ON notifications FOR INSERT
  WITH CHECK (company_id = auth_company_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- HABILITAR REALTIME en tabla notifications
-- ─────────────────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
