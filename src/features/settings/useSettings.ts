import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { Company, PayrollSettings } from '@/types/database';

export function useCompanySettings() {
  const { profile } = useAuthStore();

  return useQuery({
    queryKey: ['company', profile?.company_id],
    queryFn: async (): Promise<Company | null> => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile!.company_id)
        .single();

      if (error) throw error;
      return data as Company;
    },
    enabled: Boolean(profile?.company_id),
  });
}

export function useUpdateCompanySettings() {
  const queryClient = useQueryClient();
  const { profile } = useAuthStore();

  return useMutation({
    mutationFn: async (input: {
      name?: string;
      nit?: string;
      address?: string | null;
      phone?: string | null;
      email?: string | null;
      city?: string | null;
      payroll_settings?: PayrollSettings;
    }) => {
      if (!profile?.company_id) {
        throw new Error('No se encontró la empresa del usuario.');
      }

      const { data, error } = await (supabase
        .from('companies') as any)
        .update(input)
        .eq('id', profile.company_id)
        .select()
        .single();

      if (error) throw error;
      return data as Company;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', profile?.company_id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] });
    },
  });
}

