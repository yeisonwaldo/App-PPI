-- 002_tables.sql
-- Tablas principales de Construpay
-- Requiere: 001_enums.sql ejecutado previamente

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCIÓN AUXILIAR: auto-actualizar updated_at
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- COMPANIES
-- Empresa raíz del sistema multi-tenant
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE companies (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz NOT NULL    DEFAULT now(),
  updated_at       timestamptz NOT NULL    DEFAULT now(),
  name             text        NOT NULL,
  nit              text        NOT NULL UNIQUE,
  address          text,
  phone            text,
  email            text,
  city             text,
  -- Todos los parámetros de nómina: configurables por empresa, NUNCA hardcodeados
  payroll_settings jsonb       NOT NULL    DEFAULT '{
    "salario_minimo":            1300000,
    "auxilio_transporte":         162000,
    "pct_salud_empleado":              4,
    "pct_pension_empleado":            4,
    "pct_salud_empleador":           8.5,
    "pct_pension_empleador":          12,
    "pct_arl":                     0.522,
    "pct_hora_extra_diurna":          25,
    "pct_hora_extra_nocturna":        75,
    "pct_recargo_nocturno":           35,
    "pct_hora_extra_dominical_festivo":100,
    "horas_jornada_diaria":            8,
    "dias_laborales_mes":             30
  }'::jsonb
);

COMMENT ON TABLE companies IS 'Empresa raíz. Todas las demás entidades se filtran por company_id (multi-tenant).';
COMMENT ON COLUMN companies.payroll_settings IS 'Parámetros de nómina configurables: salarios mínimos, porcentajes, etc. Nunca hardcodear en código.';

-- ─────────────────────────────────────────────────────────────────────────────
-- PROFILES
-- 1:1 con auth.users — contiene rol y empresa del usuario
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  company_id  uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  full_name   text        NOT NULL,
  role        user_role   NOT NULL DEFAULT 'employee',
  avatar_url  text,
  active      boolean     NOT NULL DEFAULT true
);

COMMENT ON TABLE profiles IS 'Perfil extendido de usuario Auth. Determina empresa y rol para RLS.';

-- ─────────────────────────────────────────────────────────────────────────────
-- PROJECTS (obras/proyectos de construcción)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE projects (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  company_id  uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  location    text,
  status      text        NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed','cancelled')),
  start_date  date,
  end_date    date
);

COMMENT ON TABLE projects IS 'Obras o proyectos de construcción. Los empleados pueden asignarse a un proyecto.';

-- ─────────────────────────────────────────────────────────────────────────────
-- EMPLOYEES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE employees (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz   NOT NULL DEFAULT now(),
  updated_at       timestamptz   NOT NULL DEFAULT now(),
  company_id       uuid          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  profile_id       uuid          REFERENCES profiles(id) ON DELETE SET NULL,
  -- Identificación
  document_type    text          NOT NULL DEFAULT 'CC' CHECK (document_type IN ('CC','CE','NIT','PA','TI')),
  document_number  text          NOT NULL,
  first_name       text          NOT NULL,
  last_name        text          NOT NULL,
  email            text,
  phone            text,
  -- Información laboral
  position         text          NOT NULL,
  department       text,
  project_id       uuid          REFERENCES projects(id) ON DELETE SET NULL,
  hire_date        date          NOT NULL,
  termination_date date,
  contract_type    contract_type NOT NULL DEFAULT 'indefinido',
  base_salary      numeric(14,2) NOT NULL CHECK (base_salary > 0),
  -- Fondos y EPS
  eps              text,
  pension_fund     text,
  arl              text,
  cesantias_fund   text,
  -- Estado
  status           employee_status NOT NULL DEFAULT 'active',
  UNIQUE (company_id, document_number)
);

COMMENT ON TABLE employees IS 'Empleados de la empresa. document_number es único por empresa.';
COMMENT ON COLUMN employees.base_salary IS 'Salario base mensual en COP.';

-- ─────────────────────────────────────────────────────────────────────────────
-- PAYROLL PERIODS
-- Periodos de nómina (mensual o quincenal)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE payroll_periods (
  id               uuid                 PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz          NOT NULL DEFAULT now(),
  updated_at       timestamptz          NOT NULL DEFAULT now(),
  company_id       uuid                 NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name             text                 NOT NULL,
  start_date       date                 NOT NULL,
  end_date         date                 NOT NULL,
  period_type      payroll_period_type  NOT NULL DEFAULT 'mensual',
  status           payroll_status       NOT NULL DEFAULT 'draft',
  total_earned     numeric(14,2),
  total_deductions numeric(14,2),
  total_net        numeric(14,2),
  paid_at          timestamptz,
  CHECK (end_date >= start_date)
);

COMMENT ON TABLE payroll_periods IS 'Periodos de nómina. La función calculate_payroll() genera payroll_items a partir de este registro.';

-- ─────────────────────────────────────────────────────────────────────────────
-- PAYROLL ITEMS
-- Desprendible de nómina por empleado por periodo
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE payroll_items (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          timestamptz   NOT NULL DEFAULT now(),
  updated_at          timestamptz   NOT NULL DEFAULT now(),
  payroll_period_id   uuid          NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
  employee_id         uuid          NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  -- Devengado
  days_worked         numeric(5,2)  NOT NULL DEFAULT 30,
  base_pay            numeric(14,2) NOT NULL,
  transport_allowance numeric(14,2) NOT NULL DEFAULT 0,
  overtime_pay        numeric(14,2) NOT NULL DEFAULT 0,
  bonuses             numeric(14,2) NOT NULL DEFAULT 0,
  total_earned        numeric(14,2) NOT NULL,
  -- Deducciones
  health_deduction    numeric(14,2) NOT NULL DEFAULT 0,
  pension_deduction   numeric(14,2) NOT NULL DEFAULT 0,
  other_deductions    numeric(14,2) NOT NULL DEFAULT 0,
  total_deductions    numeric(14,2) NOT NULL,
  -- Neto
  net_pay             numeric(14,2) NOT NULL,
  -- Desglose detallado en JSON para el desprendible
  details             jsonb,
  UNIQUE (payroll_period_id, employee_id)
);

COMMENT ON TABLE payroll_items IS 'Desprendible individual de nómina. Generado por calculate_payroll(period_id).';

-- ─────────────────────────────────────────────────────────────────────────────
-- ATTENDANCE RECORDS
-- Registro de asistencia diario por empleado
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE attendance_records (
  id             uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     timestamptz       NOT NULL DEFAULT now(),
  updated_at     timestamptz       NOT NULL DEFAULT now(),
  employee_id    uuid              NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  work_date      date              NOT NULL,
  check_in       time,
  check_out      time,
  hours_worked   numeric(5,2)      GENERATED ALWAYS AS (
    CASE
      WHEN check_in IS NOT NULL AND check_out IS NOT NULL
      THEN EXTRACT(EPOCH FROM (check_out - check_in)) / 3600
      ELSE NULL
    END
  ) STORED,
  overtime_hours numeric(5,2)      NOT NULL DEFAULT 0,
  status         attendance_status NOT NULL DEFAULT 'present',
  notes          text,
  source         attendance_source NOT NULL DEFAULT 'manual',
  UNIQUE (employee_id, work_date)
);

COMMENT ON TABLE attendance_records IS 'Registro de asistencia diario. hours_worked se calcula automáticamente de check_in/check_out.';

-- ─────────────────────────────────────────────────────────────────────────────
-- DOCUMENT TYPES
-- Tipos de documento configurables por empresa
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE document_types (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  company_id        uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name              text        NOT NULL,
  requires_expiry   boolean     NOT NULL DEFAULT true,
  alert_days_before int         NOT NULL DEFAULT 30 CHECK (alert_days_before >= 0)
);

COMMENT ON TABLE document_types IS 'Tipos de documento configurables. alert_days_before controla cuándo se genera alerta de vencimiento.';

-- ─────────────────────────────────────────────────────────────────────────────
-- EMPLOYEE DOCUMENTS
-- Documentos cargados a Supabase Storage asociados a empleados
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE employee_documents (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  employee_id      uuid        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  document_type_id uuid        NOT NULL REFERENCES document_types(id) ON DELETE RESTRICT,
  -- Storage: ruta {company_id}/{employee_id}/{uuid}_{filename}
  file_path        text        NOT NULL,
  file_name        text        NOT NULL,
  issue_date       date,
  expiry_date      date,
  uploaded_by      uuid        REFERENCES profiles(id) ON DELETE SET NULL
);

COMMENT ON COLUMN employee_documents.file_path IS 'Ruta en bucket employee-documents: {company_id}/{employee_id}/{uuid}_{filename}';

-- Vista con estado calculado (vigente / por_vencer / vencido)
CREATE VIEW employee_documents_view AS
SELECT
  ed.*,
  e.first_name,
  e.last_name,
  e.document_number,
  e.company_id,
  dt.name             AS document_type_name,
  dt.requires_expiry,
  dt.alert_days_before,
  CASE
    WHEN NOT dt.requires_expiry OR ed.expiry_date IS NULL
      THEN 'vigente'::document_status
    WHEN ed.expiry_date < CURRENT_DATE
      THEN 'vencido'::document_status
    WHEN ed.expiry_date <= CURRENT_DATE + (dt.alert_days_before || ' days')::interval
      THEN 'por_vencer'::document_status
    ELSE
      'vigente'::document_status
  END AS status
FROM employee_documents ed
JOIN document_types dt ON dt.id = ed.document_type_id
JOIN employees e ON e.id = ed.employee_id;

COMMENT ON VIEW employee_documents_view IS 'Vista con estado calculado en tiempo real: vigente / por_vencer / vencido.';

-- ─────────────────────────────────────────────────────────────────────────────
-- LEAVE REQUESTS
-- Solicitudes de permisos y licencias
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE leave_requests (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz  NOT NULL DEFAULT now(),
  updated_at      timestamptz  NOT NULL DEFAULT now(),
  employee_id     uuid         NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type      leave_type   NOT NULL,
  start_date      date         NOT NULL,
  end_date        date         NOT NULL,
  days            int          NOT NULL CHECK (days > 0),
  reason          text         NOT NULL,
  status          leave_status NOT NULL DEFAULT 'pending',
  reviewed_by     uuid         REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at     timestamptz,
  review_notes    text,
  attachment_path text,
  CHECK (end_date >= start_date)
);

COMMENT ON TABLE leave_requests IS 'Solicitudes de permisos/licencias. Un trigger notifica a RRHH al crearse.';

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- Notificaciones en tiempo real (Supabase Realtime)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id          uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz       NOT NULL DEFAULT now(),
  updated_at  timestamptz       NOT NULL DEFAULT now(),
  company_id  uuid              NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id     uuid              NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       text              NOT NULL,
  message     text              NOT NULL,
  type        notification_type NOT NULL,
  entity_type text,             -- 'employee_documents', 'leave_requests', etc.
  entity_id   uuid,
  read        boolean           NOT NULL DEFAULT false
);

COMMENT ON TABLE notifications IS 'Notificaciones en tiempo real. Se suscribe vía Supabase Realtime filtrado por user_id.';
