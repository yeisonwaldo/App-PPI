/**
 * src/lib/supabase.ts
 * Cliente Supabase con persistencia de sesión via AsyncStorage
 * ⚠️  Solo usar EXPO_PUBLIC_SUPABASE_ANON_KEY — nunca service_role en el cliente
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from '@/types/database';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured = Boolean(
  process.env.EXPO_PUBLIC_SUPABASE_URL && 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.EXPO_PUBLIC_SUPABASE_URL.includes('tu-proyecto')
);

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ Supabase no está configurado aún. Configura EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY en .env'
  );
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Persistir sesión en AsyncStorage (sobrevive cierres de app)
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers tipados
// ─────────────────────────────────────────────────────────────────────────────

/** Retorna el usuario activo o null */
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/** Retorna el perfil completo del usuario actual (con company_id y rol) */
export async function getCurrentProfile() {
  const user = await getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Genera un signed URL de 1 hora para un archivo del bucket employee-documents.
 * Usar siempre esto en lugar de URLs públicas (bucket es privado).
 */
export async function getSignedDocumentUrl(filePath: string, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from('employee-documents')
    .createSignedUrl(filePath, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}

/**
 * Sube un archivo al bucket employee-documents.
 * Ruta: {company_id}/{employee_id}/{uuid}_{filename}
 */
export async function uploadDocument(
  companyId: string,
  employeeId: string,
  file: { uri: string; name: string; type: string }
): Promise<string> {
  const fileExt = file.name.split('.').pop() ?? 'pdf';
  const uuid = Math.random().toString(36).substring(2, 10);
  const fileName = `${uuid}_${file.name}`;
  const filePath = `${companyId}/${employeeId}/${fileName}`;

  const response = await fetch(file.uri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from('employee-documents')
    .upload(filePath, blob, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw error;
  return filePath;
}
