/**
 * src/types/database.ts
 * Definición tipada de la base de datos Supabase para Construpay
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'admin' | 'hr' | 'supervisor' | 'employee';
export type ContractType = 'indefinido' | 'fijo' | 'obra_labor' | 'prestacion_servicios';
export type EmployeeStatus = 'active' | 'inactive' | 'vacation' | 'terminated';
export type PayrollPeriodType = 'mensual' | 'quincenal';
export type PayrollStatus = 'draft' | 'calculated' | 'paid';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type AttendanceSource = 'manual' | 'app';
export type LeaveType =
  | 'permiso'
  | 'licencia_medica'
  | 'licencia_maternidad'
  | 'licencia_luto'
  | 'vacaciones'
  | 'otro';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';
export type NotificationType =
  | 'document_expiry'
  | 'leave_request'
  | 'payroll'
  | 'attendance'
  | 'system';
export type DocumentStatus = 'vigente' | 'por_vencer' | 'vencido';

export interface PayrollSettings {
  salario_minimo: number;
  auxilio_transporte: number;
  pct_salud_empleado: number;
  pct_pension_empleado: number;
  pct_salud_empleador: number;
  pct_pension_empleador: number;
  pct_arl: number;
  pct_hora_extra_diurna: number;
  pct_hora_extra_nocturna: number;
  pct_recargo_nocturno: number;
  pct_hora_extra_dominical_festivo: number;
  horas_jornada_diaria: number;
  dias_laborales_mes: number;
}

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          nit: string;
          address: string | null;
          phone: string | null;
          email: string | null;
          city: string | null;
          payroll_settings: PayrollSettings;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name: string;
          nit: string;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          city?: string | null;
          payroll_settings?: PayrollSettings;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name?: string;
          nit?: string;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          city?: string | null;
          payroll_settings?: PayrollSettings;
        };
      };
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          company_id: string;
          full_name: string;
          role: UserRole;
          avatar_url: string | null;
          active: boolean;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
          company_id: string;
          full_name: string;
          role?: UserRole;
          avatar_url?: string | null;
          active?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          company_id?: string;
          full_name?: string;
          role?: UserRole;
          avatar_url?: string | null;
          active?: boolean;
        };
      };
      projects: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          company_id: string;
          name: string;
          location: string | null;
          status: 'active' | 'paused' | 'completed' | 'cancelled';
          start_date: string | null;
          end_date: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          company_id: string;
          name: string;
          location?: string | null;
          status?: 'active' | 'paused' | 'completed' | 'cancelled';
          start_date?: string | null;
          end_date?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          company_id?: string;
          name?: string;
          location?: string | null;
          status?: 'active' | 'paused' | 'completed' | 'cancelled';
          start_date?: string | null;
          end_date?: string | null;
        };
      };
      employees: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          company_id: string;
          profile_id: string | null;
          document_type: 'CC' | 'CE' | 'NIT' | 'PA' | 'TI';
          document_number: string;
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          position: string;
          department: string | null;
          project_id: string | null;
          hire_date: string;
          termination_date: string | null;
          contract_type: ContractType;
          base_salary: number;
          eps: string | null;
          pension_fund: string | null;
          arl: string | null;
          cesantias_fund: string | null;
          status: EmployeeStatus;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          company_id: string;
          profile_id?: string | null;
          document_type?: 'CC' | 'CE' | 'NIT' | 'PA' | 'TI';
          document_number: string;
          first_name: string;
          last_name: string;
          email?: string | null;
          phone?: string | null;
          position: string;
          department?: string | null;
          project_id?: string | null;
          hire_date: string;
          termination_date?: string | null;
          contract_type?: ContractType;
          base_salary: number;
          eps?: string | null;
          pension_fund?: string | null;
          arl?: string | null;
          cesantias_fund?: string | null;
          status?: EmployeeStatus;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          company_id?: string;
          profile_id?: string | null;
          document_type?: 'CC' | 'CE' | 'NIT' | 'PA' | 'TI';
          document_number?: string;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          phone?: string | null;
          position?: string;
          department?: string | null;
          project_id?: string | null;
          hire_date?: string;
          termination_date?: string | null;
          contract_type?: ContractType;
          base_salary?: number;
          eps?: string | null;
          pension_fund?: string | null;
          arl?: string | null;
          cesantias_fund?: string | null;
          status?: EmployeeStatus;
        };
      };
      payroll_periods: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          company_id: string;
          name: string;
          start_date: string;
          end_date: string;
          period_type: PayrollPeriodType;
          status: PayrollStatus;
          total_earned: number | null;
          total_deductions: number | null;
          total_net: number | null;
          paid_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          company_id: string;
          name: string;
          start_date: string;
          end_date: string;
          period_type?: PayrollPeriodType;
          status?: PayrollStatus;
          total_earned?: number | null;
          total_deductions?: number | null;
          total_net?: number | null;
          paid_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          company_id?: string;
          name?: string;
          start_date?: string;
          end_date?: string;
          period_type?: PayrollPeriodType;
          status?: PayrollStatus;
          total_earned?: number | null;
          total_deductions?: number | null;
          total_net?: number | null;
          paid_at?: string | null;
        };
      };
      payroll_items: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          payroll_period_id: string;
          employee_id: string;
          days_worked: number;
          base_pay: number;
          transport_allowance: number;
          overtime_pay: number;
          bonuses: number;
          total_earned: number;
          health_deduction: number;
          pension_deduction: number;
          other_deductions: number;
          total_deductions: number;
          net_pay: number;
          details: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          payroll_period_id: string;
          employee_id: string;
          days_worked?: number;
          base_pay: number;
          transport_allowance?: number;
          overtime_pay?: number;
          bonuses?: number;
          total_earned: number;
          health_deduction?: number;
          pension_deduction?: number;
          other_deductions?: number;
          total_deductions: number;
          net_pay: number;
          details?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          payroll_period_id?: string;
          employee_id?: string;
          days_worked?: number;
          base_pay?: number;
          transport_allowance?: number;
          overtime_pay?: number;
          bonuses?: number;
          total_earned?: number;
          health_deduction?: number;
          pension_deduction?: number;
          other_deductions?: number;
          total_deductions?: number;
          net_pay?: number;
          details?: Json | null;
        };
      };
      attendance_records: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          employee_id: string;
          work_date: string;
          check_in: string | null;
          check_out: string | null;
          hours_worked: number | null;
          overtime_hours: number;
          status: AttendanceStatus;
          notes: string | null;
          source: AttendanceSource;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          employee_id: string;
          work_date: string;
          check_in?: string | null;
          check_out?: string | null;
          overtime_hours?: number;
          status?: AttendanceStatus;
          notes?: string | null;
          source?: AttendanceSource;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          employee_id?: string;
          work_date?: string;
          check_in?: string | null;
          check_out?: string | null;
          overtime_hours?: number;
          status?: AttendanceStatus;
          notes?: string | null;
          source?: AttendanceSource;
        };
      };
      document_types: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          company_id: string;
          name: string;
          requires_expiry: boolean;
          alert_days_before: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          company_id: string;
          name: string;
          requires_expiry?: boolean;
          alert_days_before?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          company_id?: string;
          name?: string;
          requires_expiry?: boolean;
          alert_days_before?: number;
        };
      };
      employee_documents: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          employee_id: string;
          document_type_id: string;
          file_path: string;
          file_name: string;
          issue_date: string | null;
          expiry_date: string | null;
          uploaded_by: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          employee_id: string;
          document_type_id: string;
          file_path: string;
          file_name: string;
          issue_date?: string | null;
          expiry_date?: string | null;
          uploaded_by?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          employee_id?: string;
          document_type_id?: string;
          file_path?: string;
          file_name?: string;
          issue_date?: string | null;
          expiry_date?: string | null;
          uploaded_by?: string | null;
        };
      };
      leave_requests: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          employee_id: string;
          leave_type: LeaveType;
          start_date: string;
          end_date: string;
          days: number;
          reason: string;
          status: LeaveStatus;
          reviewed_by: string | null;
          reviewed_at: string | null;
          review_notes: string | null;
          attachment_path: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          employee_id: string;
          leave_type: LeaveType;
          start_date: string;
          end_date: string;
          days: number;
          reason: string;
          status?: LeaveStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_notes?: string | null;
          attachment_path?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          employee_id?: string;
          leave_type?: LeaveType;
          start_date?: string;
          end_date?: string;
          days?: number;
          reason?: string;
          status?: LeaveStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_notes?: string | null;
          attachment_path?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          company_id: string;
          user_id: string;
          title: string;
          message: string;
          type: NotificationType;
          entity_type: string | null;
          entity_id: string | null;
          read: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          company_id: string;
          user_id: string;
          title: string;
          message: string;
          type: NotificationType;
          entity_type?: string | null;
          entity_id?: string | null;
          read?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          company_id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: NotificationType;
          entity_type?: string | null;
          entity_id?: string | null;
          read?: boolean;
        };
      };
    };
    Views: {
      employee_documents_view: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          employee_id: string;
          document_type_id: string;
          file_path: string;
          file_name: string;
          issue_date: string | null;
          expiry_date: string | null;
          uploaded_by: string | null;
          first_name: string;
          last_name: string;
          document_number: string;
          company_id: string;
          document_type_name: string;
          requires_expiry: boolean;
          alert_days_before: number;
          status: DocumentStatus;
        };
      };
    };
    Functions: {
      calculate_payroll: {
        Args: {
          p_period_id: string;
        };
        Returns: {
          success: boolean;
          period_id: string;
          employees: number;
          calculated_at: string;
        };
      };
      check_document_expiry: {
        Args: Record<string, never>;
        Returns: {
          success: boolean;
          notifications_created: number;
          checked_at: string;
        };
      };
      get_dashboard_metrics: {
        Args: Record<string, never>;
        Returns: {
          active_employees: number;
          monthly_payroll: number;
          total_documents: number;
          today_attendance: number;
          expiring_documents: number;
          pending_leaves: number;
        };
      };
    };
  };
}

export type Company = Database['public']['Tables']['companies']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type Employee = Database['public']['Tables']['employees']['Row'];
export type PayrollPeriod = Database['public']['Tables']['payroll_periods']['Row'];
export type PayrollItem = Database['public']['Tables']['payroll_items']['Row'];
export type AttendanceRecord = Database['public']['Tables']['attendance_records']['Row'];
export type DocumentType = Database['public']['Tables']['document_types']['Row'];
export type EmployeeDocument = Database['public']['Tables']['employee_documents']['Row'];
export type EmployeeDocumentView = Database['public']['Views']['employee_documents_view']['Row'];
export type LeaveRequest = Database['public']['Tables']['leave_requests']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
