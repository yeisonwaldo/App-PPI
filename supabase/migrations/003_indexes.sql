-- 003_indexes.sql
-- Índices de rendimiento para Construpay
-- Requiere: 002_tables.sql ejecutado previamente

-- Companies
CREATE INDEX idx_companies_nit ON companies(nit);

-- Profiles
CREATE INDEX idx_profiles_company   ON profiles(company_id);
CREATE INDEX idx_profiles_role      ON profiles(company_id, role);
CREATE INDEX idx_profiles_active    ON profiles(company_id, active) WHERE active = true;

-- Projects
CREATE INDEX idx_projects_company   ON projects(company_id);
CREATE INDEX idx_projects_status    ON projects(company_id, status);

-- Employees
CREATE INDEX idx_employees_company        ON employees(company_id);
CREATE INDEX idx_employees_status         ON employees(company_id, status);
CREATE INDEX idx_employees_project        ON employees(project_id);
CREATE INDEX idx_employees_profile        ON employees(profile_id);
CREATE INDEX idx_employees_doc_number     ON employees(company_id, document_number);
CREATE INDEX idx_employees_name           ON employees(company_id, last_name, first_name);

-- Payroll Periods
CREATE INDEX idx_payroll_periods_company  ON payroll_periods(company_id);
CREATE INDEX idx_payroll_periods_dates    ON payroll_periods(company_id, start_date DESC, end_date DESC);
CREATE INDEX idx_payroll_periods_status   ON payroll_periods(company_id, status);

-- Payroll Items
CREATE INDEX idx_payroll_items_period     ON payroll_items(payroll_period_id);
CREATE INDEX idx_payroll_items_employee   ON payroll_items(employee_id);

-- Attendance Records
CREATE INDEX idx_attendance_employee_date ON attendance_records(employee_id, work_date DESC);
CREATE INDEX idx_attendance_date          ON attendance_records(work_date DESC);
CREATE INDEX idx_attendance_status        ON attendance_records(status, work_date DESC);

-- Document Types
CREATE INDEX idx_doc_types_company        ON document_types(company_id);

-- Employee Documents
CREATE INDEX idx_emp_docs_employee        ON employee_documents(employee_id);
CREATE INDEX idx_emp_docs_type            ON employee_documents(document_type_id);
-- Índice parcial para consultas de vencimiento (la más frecuente en alertas)
CREATE INDEX idx_emp_docs_expiry          ON employee_documents(expiry_date)
  WHERE expiry_date IS NOT NULL;

-- Leave Requests
CREATE INDEX idx_leaves_employee          ON leave_requests(employee_id);
CREATE INDEX idx_leaves_status            ON leave_requests(status) WHERE status = 'pending';
CREATE INDEX idx_leaves_dates             ON leave_requests(start_date, end_date);

-- Notifications
CREATE INDEX idx_notifications_user       ON notifications(user_id, read, created_at DESC);
CREATE INDEX idx_notifications_unread     ON notifications(user_id, created_at DESC)
  WHERE read = false;
CREATE INDEX idx_notifications_company    ON notifications(company_id, created_at DESC);
