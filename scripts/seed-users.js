#!/usr/bin/env node
/**
 * scripts/seed-users.js
 * Crea 8 usuarios de prueba en Supabase Auth usando la Admin API (service_role key)
 * y sus perfiles correspondientes en la tabla profiles.
 *
 * ⚠️  SOLO EJECUTAR EN AMBIENTE DE DESARROLLO
 * ⚠️  Nunca exponer SUPABASE_SERVICE_ROLE_KEY en el cliente
 *
 * Uso:
 *   node scripts/seed-users.js
 *
 * Variables requeridas (en .env.local o exportadas):
 *   SUPABASE_URL=https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...
 */

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const COMPANY_ID = '11111111-1111-1111-1111-111111111111';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'apikey': SERVICE_ROLE_KEY,
};

/**
 * Usuarios de prueba:
 * 1 admin · 2 hr · 2 supervisores · 3 empleados (con employee_id vinculado)
 */
const USERS = [
  {
    email: 'admin@constructoraandina.com',
    password: 'Construpay2026!',
    full_name: 'Administrador General',
    role: 'admin',
    employee_id: null, // El admin puede no tener empleado asociado
  },
  {
    email: 'projas@andina.com',
    password: 'Construpay2026!',
    full_name: 'Patricia Rojas Gómez',
    role: 'hr',
    employee_id: 'e0000020-0000-0000-0000-000000000020',
  },
  {
    email: 'gsilva@andina.com',
    password: 'Construpay2026!',
    full_name: 'Gloria Silva Medina',
    role: 'hr',
    employee_id: 'e0000021-0000-0000-0000-000000000021',
  },
  {
    email: 'jgarcia@andina.com',
    password: 'Construpay2026!',
    full_name: 'Juan García Morales',
    role: 'supervisor',
    employee_id: 'e0000003-0000-0000-0000-000000000003',
  },
  {
    email: 'lvargas@andina.com',
    password: 'Construpay2026!',
    full_name: 'Lucía Vargas Ospina',
    role: 'supervisor',
    employee_id: 'e0000002-0000-0000-0000-000000000002',
  },
  {
    email: 'cmendoza@andina.com',
    password: 'Construpay2026!',
    full_name: 'Carlos Mendoza Ríos',
    role: 'employee',
    employee_id: 'e0000001-0000-0000-0000-000000000001',
  },
  {
    email: 'jespinosa@andina.com',
    password: 'Construpay2026!',
    full_name: 'Javier Espinosa Muñoz',
    role: 'employee',
    employee_id: 'e0000019-0000-0000-0000-000000000019',
  },
  {
    email: 'omejia@outl.com',
    password: 'Construpay2026!',
    full_name: 'Oscar Mejía Londoño',
    role: 'employee',
    employee_id: 'e0000024-0000-0000-0000-000000000024',
  },
];

async function createUser(user) {
  const url = `${SUPABASE_URL}/auth/v1/admin/users`;

  const body = {
    email: user.email,
    password: user.password,
    email_confirm: true, // Confirmar automáticamente para desarrollo
    user_metadata: {
      full_name: user.full_name,
      company_id: COMPANY_ID,
      role: user.role,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    // Si ya existe, retornar sin error
    if (data.message?.includes('already') || data.code === 'email_address_not_authorized') {
      console.warn(`  ⚠️  Usuario ya existe: ${user.email}`);
      return null;
    }
    throw new Error(`Error creando ${user.email}: ${JSON.stringify(data)}`);
  }

  return data;
}

async function updateEmployeeProfile(userId, employeeId) {
  if (!employeeId) return;

  // Actualizar el profile_id en la tabla employees
  const url = `${SUPABASE_URL}/rest/v1/employees?id=eq.${employeeId}`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      ...headers,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ profile_id: userId }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.warn(`  ⚠️  No se pudo actualizar profile_id en employees: ${text}`);
  }
}

async function main() {
  console.log('🚀  Construpay — Seed de usuarios de prueba');
  console.log(`   Supabase URL: ${SUPABASE_URL}`);
  console.log(`   Empresa: ${COMPANY_ID}\n`);

  let created = 0;
  let skipped = 0;

  for (const user of USERS) {
    process.stdout.write(`  👤  ${user.full_name} (${user.role})... `);

    try {
      const data = await createUser(user);

      if (data === null) {
        skipped++;
        continue;
      }

      const userId = data.id;

      // El trigger handle_new_user debería crear el profile automáticamente.
      // Si el trigger no funcionó (ej. company_id no en metadata), crear manualmente:
      if (!data.user_metadata?.company_id) {
        const profileUrl = `${SUPABASE_URL}/rest/v1/profiles`;
        await fetch(profileUrl, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            id: userId,
            company_id: COMPANY_ID,
            full_name: user.full_name,
            role: user.role,
          }),
        });
      }

      // Vincular con el registro de employee
      await updateEmployeeProfile(userId, user.employee_id);

      console.log(`✅  Creado (id: ${userId})`);
      created++;
    } catch (err) {
      console.error(`❌  Error: ${err.message}`);
    }
  }

  console.log(`\n✅  Resumen: ${created} creados, ${skipped} ya existían`);
  console.log('\n📋  Credenciales de prueba:');
  console.log('   ┌──────────────────────────────────────────────┬──────────────────┬──────────────┐');
  console.log('   │ Email                                        │ Rol              │ Contraseña   │');
  console.log('   ├──────────────────────────────────────────────┼──────────────────┼──────────────┤');
  for (const u of USERS) {
    console.log(`   │ ${u.email.padEnd(44)} │ ${u.role.padEnd(16)} │ Construpay2026!│`);
  }
  console.log('   └──────────────────────────────────────────────┴──────────────────┴──────────────┘');
  console.log('\n💡  Después de crear usuarios, ejecuta calculate_payroll() desde Supabase SQL Editor:');
  console.log("   SELECT calculate_payroll('ffffaaaa-ffff-aaaa-ffff-aaaaaaffffaa');");
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
