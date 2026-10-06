import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import {
  MOCK_EMPLOYEES,
  MOCK_PAYROLL_PERIOD,
  MOCK_DOCUMENTS_VIEW,
  MOCK_ATTENDANCE_SUMMARY,
} from '@/lib/mockData';
import type { EmployeeDocumentView } from '@/types/database';

export interface DashboardMetrics {
  activeEmployees: number;
  monthlyPayrollTotal: number;
  totalDocuments: number;
  expiringDocumentsCount: number;
  expiringDocuments: EmployeeDocumentView[];
  attendancePresent: number;
  attendanceTotal: number;
  recentActivities: Array<{
    id: string;
    title: string;
    subtitle: string;
    timestamp: string;
    type: 'document' | 'payroll' | 'attendance' | 'employee';
  }>;
}

export function useDashboardMetrics() {
  const { profile, isDemoMode } = useAuthStore();

  return useQuery({
    queryKey: ['dashboard_metrics', profile?.company_id, isDemoMode],
    queryFn: async (): Promise<DashboardMetrics> => {
      if (!isSupabaseConfigured || isDemoMode) {
        return {
          activeEmployees: MOCK_EMPLOYEES.filter((e) => e.status === 'active').length,
          monthlyPayrollTotal: MOCK_PAYROLL_PERIOD.total_net ?? 39422000,
          totalDocuments: MOCK_DOCUMENTS_VIEW.length,
          expiringDocumentsCount: MOCK_DOCUMENTS_VIEW.filter(
            (d) => d.status === 'por_vencer' || d.status === 'vencido'
          ).length,
          expiringDocuments: MOCK_DOCUMENTS_VIEW,
          attendancePresent: MOCK_ATTENDANCE_SUMMARY.present,
          attendanceTotal: MOCK_ATTENDANCE_SUMMARY.totalEmployees,
          recentActivities: [
            {
              id: '1',
              title: 'Certificado de Alturas por vencer',
              subtitle: 'Carlos Andrés Restrepo Montoya • Vence en 5 días',
              timestamp: 'Hace 2 horas',
              type: 'document',
            },
            {
              id: '2',
              title: 'Nómina 1ra Quincena Octubre calculada',
              subtitle: 'Total neto: $ 39.422.000 COP • 25 colaboradores',
              timestamp: 'Hoy, 09:30 AM',
              type: 'payroll',
            },
            {
              id: '3',
              title: 'Asistencia de obra registrada',
              subtitle: '22 presentes • 1 tardanza • 1 ausencia',
              timestamp: 'Hoy, 07:15 AM',
              type: 'attendance',
            },
            {
              id: '4',
              title: 'Nuevo empleado contratado',
              subtitle: 'Brayan Estiven Cano Morales • Ayudante de Obra',
              timestamp: 'Ayer',
              type: 'employee',
            },
          ],
        };
      }

      // Supabase live queries
      const companyId = profile?.company_id;

      // 1. Empleados activos
      const { count: activeEmployees } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId!)
        .eq('status', 'active');

      // 2. Última nómina
      const { data: latestPayroll } = await (supabase
        .from('payroll_periods') as any)
        .select('*')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // 3. Documentos por vencer / vencidos
      const { data: expiringDocs } = await (supabase
        .from('employee_documents_view') as any)
        .select('*')
        .eq('company_id', companyId!)
        .in('status', ['por_vencer', 'vencido'])
        .limit(5);

      const { count: totalDocs } = await (supabase
        .from('employee_documents_view') as any)
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId!);

      return {
        activeEmployees: activeEmployees ?? 0,
        monthlyPayrollTotal: (latestPayroll as any)?.total_net ?? 0,
        totalDocuments: totalDocs ?? 0,
        expiringDocumentsCount: expiringDocs?.length ?? 0,
        expiringDocuments: (expiringDocs as EmployeeDocumentView[]) ?? [],
        attendancePresent: 22,
        attendanceTotal: activeEmployees ?? 25,
        recentActivities: [
          {
            id: '1',
            title: 'Sincronización con base de datos activa',
            subtitle: `Empresa: ${profile?.full_name ?? 'Administrador'}`,
            timestamp: 'En tiempo real',
            type: 'system' as any,
          },
        ],
      };
    },
  });
}
