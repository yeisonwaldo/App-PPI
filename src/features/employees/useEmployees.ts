import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { Employee, EmployeeStatus, Database } from '@/types/database';

export interface EmployeeFilter {
  search?: string;
  status?: EmployeeStatus | 'all';
  department?: string;
}

export function useEmployees(filters?: EmployeeFilter) {
  const { profile } = useAuthStore();

  return useQuery({
    queryKey: ['employees', filters, profile?.company_id],
    queryFn: async (): Promise<Employee[]> => {
      let query = supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (profile?.company_id) {
        query = query.eq('company_id', profile.company_id);
      }

      if (filters?.search) {
        query = query.or(
          `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,document_number.ilike.%${filters.search}%,position.ilike.%${filters.search}%`
        );
      }

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.department) {
        query = query.eq('department', filters.department);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(profile?.company_id),
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: async (): Promise<Employee | null> => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  const { profile } = useAuthStore();

  return useMutation({
    mutationFn: async (
      newEmployee: Omit<Employee, 'id' | 'created_at' | 'updated_at' | 'company_id'>
    ) => {
      const companyId = profile?.company_id;
      if (!companyId) {
        throw new Error('No se encontró la empresa asociada al usuario.');
      }

      const insertPayload: Database['public']['Tables']['employees']['Insert'] = {
        ...newEmployee,
        company_id: companyId,
      };

      const { data, error } = await (supabase
        .from('employees') as any)
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;
      return data as Employee;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<Employee, 'id' | 'created_at' | 'updated_at' | 'company_id'>>;
    }) => {
      const { data: updated, error } = await (supabase
        .from('employees') as any)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated as Employee;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] });
    },
  });
}
