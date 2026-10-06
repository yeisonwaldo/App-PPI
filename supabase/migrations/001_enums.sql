-- 001_enums.sql
-- ENUMs del sistema Construpay
-- Ejecutar PRIMERO antes que cualquier otra migración

CREATE TYPE user_role AS ENUM ('admin', 'hr', 'supervisor', 'employee');
CREATE TYPE contract_type AS ENUM ('indefinido', 'fijo', 'obra_labor', 'prestacion_servicios');
CREATE TYPE employee_status AS ENUM ('active', 'inactive', 'vacation', 'terminated');
CREATE TYPE payroll_period_type AS ENUM ('mensual', 'quincenal');
CREATE TYPE payroll_status AS ENUM ('draft', 'calculated', 'paid');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE attendance_source AS ENUM ('manual', 'app');
CREATE TYPE leave_type AS ENUM (
  'permiso',
  'licencia_medica',
  'licencia_maternidad',
  'licencia_luto',
  'vacaciones',
  'otro'
);
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE notification_type AS ENUM (
  'document_expiry',
  'leave_request',
  'payroll',
  'attendance',
  'system'
);
CREATE TYPE document_status AS ENUM ('vigente', 'por_vencer', 'vencido');
