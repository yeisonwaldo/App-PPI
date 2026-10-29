import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type {
  AttendanceRecord,
  AttendanceStatus,
  Employee,
} from '@/types/database';

export interface DailyAttendanceRow {
  employee: Employee;
  record: AttendanceRecord | null;
}

export function useAttendanceByDate(workDate: string) {
  const { profile } = useAuthStore();

  return useQuery({
    queryKey: ['attendance', profile?.company_id, workDate],
    queryFn: async (): Promise<DailyAttendanceRow[]> => {
      const companyId = profile!.company_id;

      // 1. Obtener todos los empleados activos / en vacaciones de la empresa
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', companyId)
        .in('status', ['active', 'vacation'])
        .order('first_name', { ascending: true });

      if (empError) throw empError;

      const empList = (employees ?? []) as Employee[];
      if (empList.length === 0) return [];

      // 2. Obtener registros de asistencia para la fecha seleccionada
      const empIds = empList.map((e) => e.id);
      const { data: records, error: attError } = await supabase
        .from('attendance_records')
        .select('*')
        .in('employee_id', empIds)
        .eq('work_date', workDate);

      if (attError) throw attError;

      const recordMap = new Map<string, AttendanceRecord>();
      for (const r of (records ?? []) as AttendanceRecord[]) {
        recordMap.set(r.employee_id, r);
      }

      return empList.map((employee) => ({
        employee,
        record: recordMap.get(employee.id) ?? null,
      }));
    },
    enabled: Boolean(profile?.company_id && workDate),
  });
}

export function useUpsertAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      employee_id: string;
      work_date: string;
      check_in?: string | null;
      check_out?: string | null;
      overtime_hours?: number;
      status?: AttendanceStatus;
      notes?: string | null;
    }) => {
      const { data, error } = await (supabase
        .from('attendance_records') as any)
        .upsert(
          {
            employee_id: input.employee_id,
            work_date: input.work_date,
            check_in: input.check_in,
            check_out: input.check_out,
            overtime_hours: input.overtime_hours ?? 0,
            status: input.status ?? 'present',
            notes: input.notes ?? null,
            source: 'app',
          },
          { onConflict: 'employee_id,work_date' }
        )
        .select()
        .single();

      if (error) throw error;
      return data as AttendanceRecord;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] });
    },
  });
}

export function useBulkAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      rows: Array<{
        employee_id: string;
        work_date: string;
        check_in?: string | null;
        check_out?: string | null;
        status?: AttendanceStatus;
      }>;
    }) => {
      const payload = input.rows.map((r) => ({
        employee_id: r.employee_id,
        work_date: r.work_date,
        ...(r.check_in !== undefined ? { check_in: r.check_in } : {}),
        ...(r.check_out !== undefined ? { check_out: r.check_out } : {}),
        status: r.status ?? 'present',
        source: 'app',
      }));

      const { data, error } = await (supabase
        .from('attendance_records') as any)
        .upsert(payload, { onConflict: 'employee_id,work_date' })
        .select();

      if (error) throw error;
      return data as AttendanceRecord[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] });
    },
  });
}

