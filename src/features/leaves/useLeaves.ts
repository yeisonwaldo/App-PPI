import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type {
  LeaveRequest,
  LeaveType,
  LeaveStatus,
  Employee,
} from '@/types/database';

export interface LeaveRequestWithEmployee extends LeaveRequest {
  employees: Pick<Employee, 'id' | 'first_name' | 'last_name' | 'position' | 'company_id'>;
}

export function useLeaves(statusFilter?: LeaveStatus | 'all') {
  const { profile } = useAuthStore();

  return useQuery({
    queryKey: ['leaves', profile?.company_id, statusFilter],
    queryFn: async (): Promise<LeaveRequestWithEmployee[]> => {
      let query = supabase
        .from('leave_requests')
        .select('*, employees!inner(id, first_name, last_name, position, company_id)')
        .eq('employees.company_id', profile!.company_id)
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown as LeaveRequestWithEmployee[]) ?? [];
    },
    enabled: Boolean(profile?.company_id),
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      employee_id: string;
      leave_type: LeaveType;
      start_date: string;
      end_date: string;
      days: number;
      reason: string;
    }) => {
      const { data, error } = await (supabase
        .from('leave_requests') as any)
        .insert({
          employee_id: input.employee_id,
          leave_type: input.leave_type,
          start_date: input.start_date,
          end_date: input.end_date,
          days: input.days,
          reason: input.reason,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data as LeaveRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] });
    },
  });
}

export function useUpdateLeaveStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      status: 'approved' | 'rejected';
      review_notes?: string;
    }) => {
      const { data, error } = await (supabase
        .from('leave_requests') as any)
        .update({
          status: input.status,
          reviewed_by: user?.id ?? null,
          reviewed_at: new Date().toISOString(),
          review_notes: input.review_notes ?? null,
        })
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw error;
      return data as LeaveRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] });
    },
  });
}

