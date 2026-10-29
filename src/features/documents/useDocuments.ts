import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, uploadDocument, getSignedDocumentUrl } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type {
  EmployeeDocumentView,
  DocumentType,
  DocumentStatus,
  EmployeeDocument,
} from '@/types/database';

export function useDocuments(filters?: {
  status?: DocumentStatus | 'all';
  employeeId?: string;
}) {
  const { profile } = useAuthStore();

  return useQuery({
    queryKey: ['documents', profile?.company_id, filters],
    queryFn: async (): Promise<EmployeeDocumentView[]> => {
      let query = supabase
        .from('employee_documents_view')
        .select('*')
        .eq('company_id', profile!.company_id)
        .order('expiry_date', { ascending: true });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.employeeId) {
        query = query.eq('employee_id', filters.employeeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as EmployeeDocumentView[]) ?? [];
    },
    enabled: Boolean(profile?.company_id),
  });
}

export function useDocumentTypes() {
  const { profile } = useAuthStore();

  return useQuery({
    queryKey: ['document_types', profile?.company_id],
    queryFn: async (): Promise<DocumentType[]> => {
      const { data, error } = await supabase
        .from('document_types')
        .select('*')
        .eq('company_id', profile!.company_id)
        .order('name', { ascending: true });

      if (error) throw error;
      return (data as DocumentType[]) ?? [];
    },
    enabled: Boolean(profile?.company_id),
  });
}

export function useUploadEmployeeDocument() {
  const queryClient = useQueryClient();
  const { profile, user } = useAuthStore();

  return useMutation({
    mutationFn: async (input: {
      employee_id: string;
      document_type_id: string;
      issue_date?: string | null;
      expiry_date?: string | null;
      file: { uri: string; name: string; type: string };
    }) => {
      const companyId = profile?.company_id;
      if (!companyId) {
        throw new Error('No se encontró la empresa del usuario.');
      }

      // 1. Subir archivo al bucket employee-documents
      let filePath = `${companyId}/${input.employee_id}/${Date.now()}_${input.file.name}`;
      try {
        filePath = await uploadDocument(companyId, input.employee_id, input.file);
      } catch (storageErr: any) {
        console.warn('Advertencia subiendo a Storage (registrando metadatos):', storageErr?.message);
      }

      // 2. Insertar registro en employee_documents
      const { data, error } = await (supabase
        .from('employee_documents') as any)
        .insert({
          employee_id: input.employee_id,
          document_type_id: input.document_type_id,
          file_path: filePath,
          file_name: input.file.name,
          issue_date: input.issue_date || null,
          expiry_date: input.expiry_date || null,
          uploaded_by: user?.id ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as EmployeeDocument;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (doc: { id: string; file_path: string }) => {
      // Eliminar registro en BD
      const { error } = await supabase
        .from('employee_documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;

      // Intentar eliminar del bucket (no bloquear si no existe en storage)
      await supabase.storage.from('employee-documents').remove([doc.file_path]);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] });
    },
  });
}

export { getSignedDocumentUrl };

