-- seed.sql
-- Datos de ejemplo para Construpay
-- 1 empresa · 3 proyectos · 25 empleados · documentos con estados variados · 1 periodo de nómina
-- ⚠️  Ejecutar DESPUÉS de las migraciones 001-007
-- ⚠️  Los usuarios Auth se crean con el script Node.js scripts/seed-users.js

-- ─────────────────────────────────────────────────────────────────────────────
-- EMPRESA
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO companies (id, name, nit, address, city, phone, email, payroll_settings) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Constructora Andina SAS',
  '900123456-7',
  'Cra 15 #93-75, Oficina 402',
  'Bogotá',
  '6017654321',
  'admin@constructoraandina.com',
  '{
    "salario_minimo":            1300000,
    "auxilio_transporte":         162000,
    "pct_salud_empleado":              4,
    "pct_pension_empleado":            4,
    "pct_salud_empleador":           8.5,
    "pct_pension_empleador":          12,
    "pct_arl":                     0.522,
    "pct_hora_extra_diurna":          25,
    "pct_hora_extra_nocturna":        75,
    "pct_recargo_nocturno":           35,
    "pct_hora_extra_dominical_festivo":100,
    "horas_jornada_diaria":            8,
    "dias_laborales_mes":             30
  }'::jsonb
);

-- ─────────────────────────────────────────────────────────────────────────────
-- PROYECTOS (obras de construcción)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO projects (id, company_id, name, location, status, start_date, end_date) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
   'Torre Norte Empresarial', 'Cra 7 #72-41, Bogotá', 'active', '2024-03-01', '2026-06-30'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111',
   'Conjunto Residencial El Prado', 'Cll 50 #68-32, Medellín', 'active', '2024-07-01', '2026-12-31'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111',
   'Vía Bogotá-Tunja Tramo 3', 'Km 45, Cundinamarca', 'paused', '2023-09-01', '2025-12-31');

-- ─────────────────────────────────────────────────────────────────────────────
-- TIPOS DE DOCUMENTO (los más comunes en construcción)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO document_types (id, company_id, name, requires_expiry, alert_days_before) VALUES
  ('d1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Cédula de Ciudadanía',         false, 0),
  ('d2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Contrato Laboral',             true,  60),
  ('d3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Examen Médico Ocupacional',    true,  30),
  ('d4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Certificado de Alturas',       true,  30),
  ('d5555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'Afiliación EPS',               false, 0),
  ('d6666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'Afiliación ARL',               false, 0),
  ('d7777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', 'RUT',                          false, 0),
  ('d8888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', 'Carné de Vacunas',             true,  90),
  ('d9999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', 'Paz y Salvo Previo Empleador', false, 0);

-- ─────────────────────────────────────────────────────────────────────────────
-- PERFILES (creados por el trigger trg_on_auth_user_created vía script seed-users.js)
-- Este INSERT es solo referencia — el script Node crea los auth.users primero.
-- IDs de ejemplo que coinciden con seed-users.js
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────────
-- EMPLEADOS (25 empleados del sector construcción colombiano)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO employees (
  id, company_id, document_type, document_number,
  first_name, last_name, email, phone,
  position, department, project_id,
  hire_date, contract_type, base_salary,
  eps, pension_fund, arl, cesantias_fund, status
) VALUES
-- Dirección / Ingeniería
('e0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
 'CC', '79456789', 'Carlos', 'Mendoza Ríos', 'cmendoza@andina.com', '3001234567',
 'Director de Obra', 'Ingeniería', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
 '2020-01-15', 'indefinido', 8500000,
 'Sanitas', 'Porvenir', 'Sura', 'Porvenir', 'active'),

('e0000002-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
 'CC', '43215678', 'Lucía', 'Vargas Ospina', 'lvargas@andina.com', '3012345678',
 'Ingeniera Residente', 'Ingeniería', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
 '2021-03-01', 'indefinido', 6500000,
 'Compensar', 'Protección', 'Sura', 'Protección', 'active'),

('e0000003-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111',
 'CC', '80123456', 'Juan', 'García Morales', 'jgarcia@andina.com', '3023456789',
 'Supervisor de Obra', 'Supervisión', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
 '2019-06-01', 'indefinido', 4200000,
 'Nueva EPS', 'Colpensiones', 'AXA Colpatria', 'Fondo Nacional', 'active'),

-- Maestros de obra
('e0000004-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111',
 'CC', '71234567', 'Pedro', 'Suárez López', NULL, '3034567890',
 'Maestro de Obra', 'Construcción', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
 '2018-02-01', 'obra_labor', 2800000,
 'Sanitas', 'Porvenir', 'Sura', 'Porvenir', 'active'),

('e0000005-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111',
 'CC', '73456789', 'Rodrigo', 'Patiño Cano', NULL, '3045678901',
 'Maestro de Obra', 'Construcción', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
 '2020-08-15', 'obra_labor', 2800000,
 'Compensar', 'Protección', 'Positiva', 'Protección', 'active'),

-- Oficiales de construcción
('e0000006-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111',
 'CC', '75678901', 'Andrés', 'Martínez Cruz', NULL, '3056789012',
 'Oficial de Construcción', 'Construcción', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
 '2021-01-10', 'obra_labor', 1850000,
 'Sura', 'Colfondos', 'Sura', 'Colfondos', 'active'),

('e0000007-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111',
 'CC', '76789012', 'Felipe', 'Torres Agudelo', NULL, '3067890123',
 'Oficial de Construcción', 'Construcción', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
 '2021-04-05', 'obra_labor', 1850000,
 'Nueva EPS', 'Porvenir', 'AXA Colpatria', 'Porvenir', 'active'),

('e0000008-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111',
 'CC', '77890123', 'Héctor', 'Ramírez Peña', NULL, '3078901234',
 'Oficial de Construcción', 'Construcción', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
 '2022-02-14', 'fijo', 1900000,
 'Compensar', 'Protección', 'Sura', 'Protección', 'active'),

-- Electricistas
('e0000009-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111',
 'CC', '78901234', 'Gustavo', 'Herrera Díaz', NULL, '3089012345',
 'Electricista', 'Instalaciones', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
 '2020-05-20', 'indefinido', 2200000,
 'Sanitas', 'Colfondos', 'Sura', 'Colfondos', 'active'),

('e0000010-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111',
 'CC', '79012345', 'Mario', 'Salcedo Vega', NULL, '3090123456',
 'Electricista', 'Instalaciones', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
 '2021-09-01', 'obra_labor', 2100000,
 'Compensar', 'Colpensiones', 'Positiva', 'Fondo Nacional', 'active'),

-- Plomeros
('e0000011-0000-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111',
 'CC', '71345678', 'Bernardo', 'Cárdenas Molina', NULL, '3101234567',
 'Plomero', 'Instalaciones', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
 '2019-11-01', 'indefinido', 1950000,
 'Nueva EPS', 'Protección', 'Sura', 'Protección', 'active'),

-- Auxiliares de construcción
('e0000012-0000-0000-0000-000000000012', '11111111-1111-1111-1111-111111111111',
 'CC', '72456789', 'Luis', 'Moreno Arce', NULL, '3112345678',
 'Auxiliar de Construcción', 'Construcción', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
 '2022-06-01', 'obra_labor', 1300000,
 'Sura', 'Porvenir', 'Sura', 'Porvenir', 'active'),

('e0000013-0000-0000-0000-000000000013', '11111111-1111-1111-1111-111111111111',
 'CC', '73567890', 'Diego', 'Castro Ávila', NULL, '3123456789',
 'Auxiliar de Construcción', 'Construcción', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
 '2022-08-15', 'obra_labor', 1300000,
 'Compensar', 'Colfondos', 'AXA Colpatria', 'Colfondos', 'active'),

('e0000014-0000-0000-0000-000000000014', '11111111-1111-1111-1111-111111111111',
 'CC', '74678901', 'Sebastián', 'Jiménez Ruiz', NULL, '3134567890',
 'Auxiliar de Construcción', 'Construcción', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
 '2023-01-09', 'obra_labor', 1300000,
 'Nueva EPS', 'Colpensiones', 'Positiva', 'Fondo Nacional', 'active'),

('e0000015-0000-0000-0000-000000000015', '11111111-1111-1111-1111-111111111111',
 'CC', '75789012', 'Camilo', 'González Reyes', NULL, '3145678901',
 'Auxiliar de Construcción', 'Construcción', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
 '2023-03-20', 'fijo', 1380000,
 'Sanitas', 'Protección', 'Sura', 'Protección', 'active'),

-- Soldadores
('e0000016-0000-0000-0000-000000000016', '11111111-1111-1111-1111-111111111111',
 'CC', '76890123', 'Eduardo', 'Lozano Pedraza', NULL, '3156789012',
 'Soldador', 'Estructura', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
 '2021-07-01', 'indefinido', 2400000,
 'Compensar', 'Porvenir', 'Sura', 'Porvenir', 'active'),

-- Operadores de maquinaria
('e0000017-0000-0000-0000-000000000017', '11111111-1111-1111-1111-111111111111',
 'CC', '77901234', 'Nelson', 'Bernal Saavedra', NULL, '3167890123',
 'Operador de Retroexcavadora', 'Maquinaria', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
 '2022-04-01', 'obra_labor', 3200000,
 'Sura', 'Colfondos', 'Sura', 'Colfondos', 'active'),

('e0000018-0000-0000-0000-000000000018', '11111111-1111-1111-1111-111111111111',
 'CC', '78012345', 'William', 'Ortiz Niño', NULL, '3178901234',
 'Operador de Grúa', 'Maquinaria', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
 '2020-09-15', 'indefinido', 3800000,
 'Nueva EPS', 'Protección', 'AXA Colpatria', 'Protección', 'active'),

-- Topógrafo
('e0000019-0000-0000-0000-000000000019', '11111111-1111-1111-1111-111111111111',
 'CC', '79123456', 'Javier', 'Espinosa Muñoz', 'jespinosa@andina.com', '3189012345',
 'Topógrafo', 'Ingeniería', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
 '2021-02-01', 'fijo', 3500000,
 'Sanitas', 'Porvenir', 'Sura', 'Porvenir', 'active'),

-- Administración / RRHH
('e0000020-0000-0000-0000-000000000020', '11111111-1111-1111-1111-111111111111',
 'CC', '52234567', 'Patricia', 'Rojas Gómez', 'projas@andina.com', '3190123456',
 'Analista de RRHH', 'Recursos Humanos', NULL,
 '2019-08-01', 'indefinido', 3200000,
 'Compensar', 'Protección', 'Sura', 'Protección', 'active'),

('e0000021-0000-0000-0000-000000000021', '11111111-1111-1111-1111-111111111111',
 'CC', '53345678', 'Gloria', 'Silva Medina', 'gsilva@andina.com', '3201234567',
 'Contadora', 'Contabilidad', NULL,
 '2020-03-01', 'indefinido', 4500000,
 'Sanitas', 'Colfondos', 'Sura', 'Colfondos', 'active'),

-- Empleados en otros estados
('e0000022-0000-0000-0000-000000000022', '11111111-1111-1111-1111-111111111111',
 'CC', '80456789', 'Mauricio', 'Acosta Vela', NULL, '3212345678',
 'Oficial de Construcción', 'Construcción', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
 '2021-11-01', 'obra_labor', 1850000,
 'Nueva EPS', 'Porvenir', 'Positiva', 'Porvenir', 'vacation'),  -- En vacaciones

('e0000023-0000-0000-0000-000000000023', '11111111-1111-1111-1111-111111111111',
 'CC', '81567890', 'Álvaro', 'Quintero Ossa', NULL, '3223456789',
 'Ayudante General', 'Construcción', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
 '2022-05-01', 'fijo', 1300000,
 'Compensar', 'Colpensiones', 'Sura', 'Fondo Nacional', 'inactive'),  -- Inactivo

-- Contratistas (prestación de servicios)
('e0000024-0000-0000-0000-000000000024', '11111111-1111-1111-1111-111111111111',
 'CC', '82678901', 'Oscar', 'Mejía Londoño', 'omejia@outl.com', '3234567890',
 'Diseñador Estructural', 'Ingeniería', NULL,
 '2023-06-01', 'prestacion_servicios', 7000000,
 NULL, NULL, NULL, NULL, 'active'),

('e0000025-0000-0000-0000-000000000025', '11111111-1111-1111-1111-111111111111',
 'CC', '83789012', 'Iván', 'Restrepo Arango', NULL, '3245678901',
 'Vigilante', 'Seguridad', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
 '2022-10-01', 'indefinido', 1400000,
 'Sanitas', 'Porvenir', 'Sura', 'Porvenir', 'active');

-- ─────────────────────────────────────────────────────────────────────────────
-- DOCUMENTOS (con estados variados: vigente, por_vencer, vencido)
-- file_path es un placeholder (el bucket real se pobla con el script de seed)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO employee_documents (employee_id, document_type_id, file_path, file_name, issue_date, expiry_date) VALUES

-- Carlos Mendoza (Director de Obra) - todos vigentes
('e0000001-0000-0000-0000-000000000001', 'd1111111-1111-1111-1111-111111111111',
 '11111111-1111-1111-1111-111111111111/e0000001-0000-0000-0000-000000000001/cedula.pdf',
 'cedula.pdf', '2015-05-10', NULL),
('e0000001-0000-0000-0000-000000000001', 'd3333333-3333-3333-3333-333333333333',
 '11111111-1111-1111-1111-111111111111/e0000001-0000-0000-0000-000000000001/examen_medico.pdf',
 'examen_medico.pdf', '2025-07-15', '2026-07-15'),  -- Vigente
('e0000001-0000-0000-0000-000000000001', 'd2222222-2222-2222-2222-222222222222',
 '11111111-1111-1111-1111-111111111111/e0000001-0000-0000-0000-000000000001/contrato.pdf',
 'contrato.pdf', '2020-01-15', NULL),  -- Indefinido: no vence

-- Lucía Vargas - examen médico POR VENCER (en ~20 días desde hoy)
('e0000002-0000-0000-0000-000000000002', 'd1111111-1111-1111-1111-111111111111',
 '11111111-1111-1111-1111-111111111111/e0000002-0000-0000-0000-000000000002/cedula.pdf',
 'cedula.pdf', '2018-03-20', NULL),
('e0000002-0000-0000-0000-000000000002', 'd3333333-3333-3333-3333-333333333333',
 '11111111-1111-1111-1111-111111111111/e0000002-0000-0000-0000-000000000002/examen_medico.pdf',
 'examen_medico.pdf', '2024-10-10', CURRENT_DATE + 18),  -- POR VENCER en 18 días

-- Juan García (Supervisor) - certificado de alturas VENCIDO
('e0000003-0000-0000-0000-000000000003', 'd1111111-1111-1111-1111-111111111111',
 '11111111-1111-1111-1111-111111111111/e0000003-0000-0000-0000-000000000003/cedula.pdf',
 'cedula.pdf', '2010-08-15', NULL),
('e0000003-0000-0000-0000-000000000003', 'd4444444-4444-4444-4444-444444444444',
 '11111111-1111-1111-1111-111111111111/e0000003-0000-0000-0000-000000000003/cert_alturas.pdf',
 'cert_alturas.pdf', '2023-10-01', '2025-09-30'),  -- VENCIDO
('e0000003-0000-0000-0000-000000000003', 'd3333333-3333-3333-3333-333333333333',
 '11111111-1111-1111-1111-111111111111/e0000003-0000-0000-0000-000000000003/examen_medico.pdf',
 'examen_medico.pdf', '2025-04-01', '2026-04-01'),  -- Vigente

-- Pedro Suárez (Maestro) - certificado alturas por vencer
('e0000004-0000-0000-0000-000000000004', 'd4444444-4444-4444-4444-444444444444',
 '11111111-1111-1111-1111-111111111111/e0000004-0000-0000-0000-000000000004/cert_alturas.pdf',
 'cert_alturas.pdf', '2024-11-01', CURRENT_DATE + 25),  -- POR VENCER en 25 días
('e0000004-0000-0000-0000-000000000004', 'd3333333-3333-3333-3333-333333333333',
 '11111111-1111-1111-1111-111111111111/e0000004-0000-0000-0000-000000000004/examen_medico.pdf',
 'examen_medico.pdf', '2025-03-15', '2026-03-15'),

-- Rodrigo Patiño - examen médico vencido
('e0000005-0000-0000-0000-000000000005', 'd3333333-3333-3333-3333-333333333333',
 '11111111-1111-1111-1111-111111111111/e0000005-0000-0000-0000-000000000005/examen_medico.pdf',
 'examen_medico.pdf', '2024-07-01', '2025-07-01'),  -- VENCIDO (julio 2025 < oct 2026)
('e0000005-0000-0000-0000-000000000005', 'd4444444-4444-4444-4444-444444444444',
 '11111111-1111-1111-1111-111111111111/e0000005-0000-0000-0000-000000000005/cert_alturas.pdf',
 'cert_alturas.pdf', '2025-01-15', '2026-01-15'),  -- Vigente

-- Andrés Martínez - documentos vigentes
('e0000006-0000-0000-0000-000000000006', 'd1111111-1111-1111-1111-111111111111',
 '11111111-1111-1111-1111-111111111111/e0000006-0000-0000-0000-000000000006/cedula.pdf',
 'cedula.pdf', '2012-06-20', NULL),
('e0000006-0000-0000-0000-000000000006', 'd3333333-3333-3333-3333-333333333333',
 '11111111-1111-1111-1111-111111111111/e0000006-0000-0000-0000-000000000006/examen_medico.pdf',
 'examen_medico.pdf', '2025-05-10', '2026-05-10'),

-- Felipe Torres - contrato por vencer
('e0000007-0000-0000-0000-000000000007', 'd2222222-2222-2222-2222-222222222222',
 '11111111-1111-1111-1111-111111111111/e0000007-0000-0000-0000-000000000007/contrato.pdf',
 'contrato.pdf', '2024-04-05', CURRENT_DATE + 45),  -- POR VENCER (alert 60 días)

-- Varios empleados con documentos básicos
('e0000008-0000-0000-0000-000000000008', 'd3333333-3333-3333-3333-333333333333',
 '11111111-1111-1111-1111-111111111111/e0000008-0000-0000-0000-000000000008/examen.pdf',
 'examen.pdf', '2025-06-01', '2026-06-01'),
('e0000009-0000-0000-0000-000000000009', 'd3333333-3333-3333-3333-333333333333',
 '11111111-1111-1111-1111-111111111111/e0000009-0000-0000-0000-000000000009/examen.pdf',
 'examen.pdf', '2025-08-15', '2026-08-15'),
('e0000010-0000-0000-0000-000000000010', 'd4444444-4444-4444-4444-444444444444',
 '11111111-1111-1111-1111-111111111111/e0000010-0000-0000-0000-000000000010/cert_alturas.pdf',
 'cert_alturas.pdf', '2025-02-01', '2026-02-01'),
('e0000011-0000-0000-0000-000000000011', 'd3333333-3333-3333-3333-333333333333',
 '11111111-1111-1111-1111-111111111111/e0000011-0000-0000-0000-000000000011/examen.pdf',
 'examen.pdf', '2024-09-01', CURRENT_DATE + 10),  -- POR VENCER en 10 días

-- Eduardo Lozano (Soldador) - certificado de alturas vencido
('e0000016-0000-0000-0000-000000000016', 'd4444444-4444-4444-4444-444444444444',
 '11111111-1111-1111-1111-111111111111/e0000016-0000-0000-0000-000000000016/cert_alturas.pdf',
 'cert_alturas.pdf', '2024-06-01', '2025-06-01');  -- VENCIDO

-- ─────────────────────────────────────────────────────────────────────────────
-- PERIODO DE NÓMINA (septiembre 2026, ya calculado)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO payroll_periods (id, company_id, name, start_date, end_date, period_type, status,
  total_earned, total_deductions, total_net)
VALUES (
  'ffffaaaa-ffff-aaaa-ffff-aaaaaaffffaa',
  '11111111-1111-1111-1111-111111111111',
  'Septiembre 2026',
  '2026-09-01', '2026-09-30',
  'mensual', 'calculated',
  NULL, NULL, NULL  -- Se actualizará al ejecutar calculate_payroll()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- REGISTROS DE ASISTENCIA (última semana de muestra)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO attendance_records (employee_id, work_date, check_in, check_out, overtime_hours, status, source)
SELECT
  e.id,
  CURRENT_DATE - d.day_offset,
  '07:00:00'::time + (random() * interval '30 minutes'),
  '17:00:00'::time + (random() * interval '2 hours'),
  CASE WHEN random() > 0.7 THEN ROUND((random() * 2)::numeric, 1) ELSE 0 END,
  CASE
    WHEN random() > 0.95 THEN 'absent'
    WHEN random() > 0.85 THEN 'late'
    ELSE 'present'
  END,
  'manual'
FROM employees e
CROSS JOIN (SELECT generate_series(0, 6) AS day_offset) d
WHERE e.company_id = '11111111-1111-1111-1111-111111111111'
  AND e.status = 'active'
  -- Solo días laborales (lunes-viernes)
  AND EXTRACT(DOW FROM CURRENT_DATE - d.day_offset) NOT IN (0, 6)
ON CONFLICT (employee_id, work_date) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- SOLICITUDES DE PERMISO (muestra)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days, reason, status) VALUES
('e0000012-0000-0000-0000-000000000012', 'permiso',
 CURRENT_DATE + 3, CURRENT_DATE + 3, 1,
 'Cita médica especialista', 'pending'),
('e0000006-0000-0000-0000-000000000006', 'licencia_medica',
 CURRENT_DATE + 7, CURRENT_DATE + 14, 5,
 'Cirugía programada', 'approved'),
('e0000022-0000-0000-0000-000000000022', 'vacaciones',
 CURRENT_DATE - 5, CURRENT_DATE + 9, 15,
 'Período de vacaciones anuales', 'approved'),
('e0000014-0000-0000-0000-000000000014', 'permiso',
 CURRENT_DATE + 1, CURRENT_DATE + 1, 1,
 'Diligencia personal', 'pending');
