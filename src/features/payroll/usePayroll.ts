import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type {
  PayrollPeriod,
  PayrollItem,
  PayrollPeriodType,
  Employee,
} from '@/types/database';

export interface PayrollItemWithEmployee extends PayrollItem {
  employees: Pick<Employee, 'id' | 'first_name' | 'last_name' | 'position' | 'document_number' | 'base_salary'> | null;
}

export function usePayrollPeriods() {
  const { profile } = useAuthStore();

  return useQuery({
    queryKey: ['payroll_periods', profile?.company_id],
    queryFn: async (): Promise<PayrollPeriod[]> => {
      const { data, error } = await supabase
        .from('payroll_periods')
        .select('*')
        .eq('company_id', profile!.company_id)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(profile?.company_id),
  });
}

export function usePayrollItems(periodId: string | undefined) {
  return useQuery({
    queryKey: ['payroll_items', periodId],
    queryFn: async (): Promise<PayrollItemWithEmployee[]> => {
      if (!periodId) return [];
      const { data, error } = await supabase
        .from('payroll_items')
        .select('*, employees(id, first_name, last_name, position, document_number, base_salary)')
        .eq('payroll_period_id', periodId)
        .order('net_pay', { ascending: false });

      if (error) throw error;
      return (data as unknown as PayrollItemWithEmployee[]) ?? [];
    },
    enabled: Boolean(periodId),
  });
}

export function useCreatePayrollPeriod() {
  const queryClient = useQueryClient();
  const { profile } = useAuthStore();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      start_date: string;
      end_date: string;
      period_type: PayrollPeriodType;
    }) => {
      if (!profile?.company_id) {
        throw new Error('No se encontró la empresa del usuario.');
      }

      const { data, error } = await (supabase
        .from('payroll_periods') as any)
        .insert({
          company_id: profile.company_id,
          name: input.name,
          start_date: input.start_date,
          end_date: input.end_date,
          period_type: input.period_type,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      return data as PayrollPeriod;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll_periods'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] });
    },
  });
}

export function useCalculatePayroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (periodId: string) => {
      const { data, error } = await (supabase.rpc as any)('calculate_payroll', {
        p_period_id: periodId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, periodId) => {
      queryClient.invalidateQueries({ queryKey: ['payroll_periods'] });
      queryClient.invalidateQueries({ queryKey: ['payroll_items', periodId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] });
    },
  });
}

export function useMarkPayrollPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (periodId: string) => {
      const { data, error } = await (supabase
        .from('payroll_periods') as any)
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', periodId)
        .select()
        .single();

      if (error) throw error;
      return data as PayrollPeriod;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll_periods'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] });
    },
  });
}

