-- 006_storage.sql
-- Configuración del bucket de documentos en Supabase Storage
-- Requiere: 005_rls.sql ejecutado previamente

-- ─────────────────────────────────────────────────────────────────────────────
-- BUCKET PRIVADO: employee-documents
-- Ruta de archivos: {company_id}/{employee_id}/{uuid}_{filename}
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'employee-documents',
  'employee-documents',
  false,        -- Bucket PRIVADO: requiere signed URLs para acceso
  10485760,     -- 10 MB máximo por archivo
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─────────────────────────────────────────────────────────────────────────────
-- POLÍTICAS DE STORAGE
-- La primera carpeta del path DEBE ser el company_id del usuario
-- ─────────────────────────────────────────────────────────────────────────────

-- Cualquier usuario autenticado de la empresa puede ver documentos
CREATE POLICY "storage_select_company"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'employee-documents'
    AND (storage.foldername(name))[1] = auth_company_id()::text
  );

-- Solo admin/HR pueden subir documentos
CREATE POLICY "storage_insert_admin"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'employee-documents'
    AND (storage.foldername(name))[1] = auth_company_id()::text
    AND is_admin_or_hr()
  );

-- Solo admin/HR pueden actualizar metadatos
CREATE POLICY "storage_update_admin"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'employee-documents'
    AND (storage.foldername(name))[1] = auth_company_id()::text
    AND is_admin_or_hr()
  );

-- Solo admin puede eliminar documentos
CREATE POLICY "storage_delete_admin"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'employee-documents'
    AND (storage.foldername(name))[1] = auth_company_id()::text
    AND auth_user_role() IN ('admin', 'hr')
  );
