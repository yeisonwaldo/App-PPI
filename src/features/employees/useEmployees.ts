import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { MOCK_EMPLOYEES } from '@/lib/mockData';
import type { Employee, EmployeeStatus, Database } from '@/types/database';

let inMemoryEmployees: Employee[] = [...MOCK_EMPLOYEES];

export interface EmployeeFilter {
  search?: string;
  status?: EmployeeStatus | 'all';
  department?: string;
}

export function useEmployees(filters?: EmployeeFilter) {
  const { profile, isDemoMode } = useAuthStore();

  return useQuery({
    queryKey: ['employees', filters, profile?.company_id, isDemoMode],
    queryFn: async (): Promise<Employee[]> => {
      if (!isSupabaseConfigured || isDemoMode) {
        let result = [...inMemoryEmployees];

        if (filters?.search) {
          const q = filters.search.toLowerCase();
          result = result.filter(
            (e) =>
              e.first_name.toLowerCase().includes(q) ||
              e.last_name.toLowerCase().includes(q) ||
              e.document_number.includes(q) ||
              e.position.toLowerCase().includes(q)
          );
        }

        if (filters?.status && filters.status !== 'all') {
          result = result.filter((e) => e.status === filters.status);
        }

        if (filters?.department) {
          result = result.filter((e) => e.department === filters.department);
        }

        return result;
      }

      let query = supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

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
  });
}

export function useEmployee(id: string) {
  const { isDemoMode } = useAuthStore();

  return useQuery({
    queryKey: ['employee', id],
    queryFn: async (): Promise<Employee | null> => {
      if (!isSupabaseConfigured || isDemoMode) {
        const found = inMemoryEmployees.find((e) => e.id === id);
        return found ?? null;
      }

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
  const { profile, isDemoMode } = useAuthStore();

  return useMutation({
    mutationFn: async (
      newEmployee: Omit<Employee, 'id' | 'created_at' | 'updated_at' | 'company_id'>
    ) => {
      const companyId = profile?.company_id || 'c0000000-0000-0000-0000-000000000001';

      if (!isSupabaseConfigured || isDemoMode) {
        const created: Employee = {
          ...newEmployee,
          id: `e-${Date.now()}`,
          company_id: companyId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        inMemoryEmployees = [created, ...inMemoryEmployees];
        return created;
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
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  const { isDemoMode } = useAuthStore();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<Employee, 'id' | 'created_at' | 'updated_at' | 'company_id'>>;
    }) => {
      if (!isSupabaseConfigured || isDemoMode) {
        const index = inMemoryEmployees.findIndex((e) => e.id === id);
        if (index !== -1) {
          const updatedEmployee: Employee = {
            ...inMemoryEmployees[index]!,
            ...data,
            updated_at: new Date().toISOString(),
          };
          inMemoryEmployees[index] = updatedEmployee;
          return updatedEmployee;
        }
        throw new Error('Empleado no encontrado');
      }

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
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  const { isDemoMode } = useAuthStore();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured || isDemoMode) {
        inMemoryEmployees = inMemoryEmployees.filter((e) => e.id !== id);
        return true;
      }

      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}
