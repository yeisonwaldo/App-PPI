import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { EmployeeDocumentView, Notification } from '@/types/database';
import { formatDate } from '@/lib/formatters';

export interface DashboardMetrics {
  activeEmployees: number;
  monthlyPayrollTotal: number;
  totalDocuments: number;
  expiringDocumentsCount: number;
  expiringDocuments: EmployeeDocumentView[];
  attendancePresent: number;
  attendanceTotal: number;
  pendingLeavesCount: number;
  recentActivities: Array<{
    id: string;
    title: string;
    subtitle: string;
    timestamp: string;
    type: 'document' | 'payroll' | 'attendance' | 'employee' | 'system';
  }>;
}

export function useDashboardMetrics() {
  const { profile, user } = useAuthStore();

  return useQuery({
    queryKey: ['dashboard_metrics', profile?.company_id],
    queryFn: async (): Promise<DashboardMetrics> => {
      const companyId = profile?.company_id;
      if (!companyId) {
        return {
          activeEmployees: 0,
          monthlyPayrollTotal: 0,
          totalDocuments: 0,
          expiringDocumentsCount: 0,
          expiringDocuments: [],
          attendancePresent: 0,
          attendanceTotal: 0,
          pendingLeavesCount: 0,
          recentActivities: [],
        };
      }

      const todayStr = new Date().toISOString().split('T')[0]!;

      // 1. Llamar RPC get_dashboard_metrics() si está disponible o consultas en paralelo
      const [
        empCountRes,
        latestPayrollRes,
        expiringDocsRes,
        totalDocsRes,
        todayAttRes,
        pendingLeavesRes,
        recentNotifsRes,
      ] = await Promise.all([
        supabase
          .from('employees')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('status', 'active'),
        supabase
          .from('payroll_periods')
          .select('*')
          .eq('company_id', companyId)
          .order('end_date', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('employee_documents_view')
          .select('*')
          .eq('company_id', companyId)
          .in('status', ['por_vencer', 'vencido'])
          .order('expiry_date', { ascending: true })
          .limit(5),
        supabase
          .from('employee_documents_view')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId),
        supabase
          .from('attendance_records')
          .select('id, status, employees!inner(company_id)')
          .eq('employees.company_id', companyId)
          .eq('work_date', todayStr),
        supabase
          .from('leave_requests')
          .select('id, employees!inner(company_id)', { count: 'exact', head: true })
          .eq('employees.company_id', companyId)
          .eq('status', 'pending'),
        user?.id
          ? supabase
              .from('notifications')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(4)
          : Promise.resolve({ data: [] as Notification[] }),
      ]);

      const activeEmployees = empCountRes.count ?? 0;
      const latestPayroll = latestPayrollRes.data as any;
      const expiringDocs = (expiringDocsRes.data as EmployeeDocumentView[]) ?? [];
      const totalDocs = totalDocsRes.count ?? 0;
      const todayRecords = (todayAttRes.data as any[]) ?? [];
      const presentToday = todayRecords.filter(
        (r) => r.status === 'present' || r.status === 'late'
      ).length;
      const pendingLeavesCount = pendingLeavesRes.count ?? 0;
      const notifs = (recentNotifsRes.data as Notification[]) ?? [];

      const recentActivities =
        notifs.length > 0
          ? notifs.map((n) => ({
              id: n.id,
              title: n.title,
              subtitle: n.message,
              timestamp: formatDate(n.created_at),
              type:
                n.type === 'document_expiry'
                  ? ('document' as const)
                  : n.type === 'payroll'
                  ? ('payroll' as const)
                  : n.type === 'attendance' || n.type === 'leave_request'
                  ? ('attendance' as const)
                  : ('system' as const),
            }))
          : [
              {
                id: 'sys-1',
                title: 'Sincronización con Supabase activa',
                subtitle: `${activeEmployees} empleados activos • ${totalDocs} documentos registrados`,
                timestamp: 'En tiempo real',
                type: 'system' as const,
              },
            ];

      return {
        activeEmployees,
        monthlyPayrollTotal: Number(latestPayroll?.total_net ?? 0),
        totalDocuments: totalDocs,
        expiringDocumentsCount: expiringDocs.length,
        expiringDocuments: expiringDocs,
        attendancePresent: presentToday,
        attendanceTotal: activeEmployees,
        pendingLeavesCount,
        recentActivities,
      };
    },
    enabled: Boolean(profile?.company_id),
  });
}
