import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types/database';
import type { Session, User } from '@supabase/supabase-js';

const DEFAULT_SEED_COMPANY_ID = '11111111-1111-1111-1111-111111111111';

/**
 * Carga el perfil del usuario en `profiles`.
 * Si el usuario fue creado manualmente desde el panel de Supabase Auth y aún no tiene
 * fila en `profiles`, intenta resolver su `company_id` desde user_metadata o `companies`.
 */
async function resolveUserProfile(user: User): Promise<Profile | null> {
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (existingProfile) {
    return existingProfile as Profile;
  }

  // Fallback si el usuario no tenía fila en profiles
  const metaCompanyId = user.user_metadata?.company_id as string | undefined;
  let companyId: string = metaCompanyId || DEFAULT_SEED_COMPANY_ID;

  if (!metaCompanyId) {
    const { data: firstCompany } = await supabase
      .from('companies')
      .select('id')
      .limit(1)
      .maybeSingle();
    companyId = ((firstCompany as any)?.id as string) || DEFAULT_SEED_COMPANY_ID;
  }

  const fullName =
    (user.user_metadata?.full_name as string) ||
    user.email?.split('@')[0] ||
    'Administrador';
  const role = ((user.user_metadata?.role as UserRole) || 'admin') as UserRole;

  // Intentar crear el perfil en la base de datos si RLS lo permite
  const { data: insertedProfile } = await (supabase.from('profiles') as any)
    .upsert({
      id: user.id,
      company_id: companyId,
      full_name: fullName,
      role,
      active: true,
    })
    .select('*')
    .maybeSingle();

  if (insertedProfile) {
    return insertedProfile as Profile;
  }

  // Si RLS no permite insert en profiles desde el cliente, retornar perfil con el company_id resuelto
  return {
    id: user.id,
    company_id: companyId,
    full_name: fullName,
    role,
    avatar_url: null,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isInitialized: false,

  setSession: (session) => set({ session, user: session?.user ?? null }),
  setProfile: (profile) => set({ profile }),

  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        set({ session, user: session.user });
        const profile = await resolveUserProfile(session.user);
        set({ profile });
      }
    } catch (err) {
      console.error('Error al inicializar sesión:', err);
    } finally {
      set({ isLoading: false, isInitialized: true });
    }

    // Escuchar cambios de autenticación en Supabase
    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session, user: session?.user ?? null });
      if (session?.user) {
        const profile = await resolveUserProfile(session.user);
        set({ profile });
      } else {
        set({ profile: null });
      }
    });
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data.session && data.user) {
        set({ session: data.session, user: data.user });
        const profile = await resolveUserProfile(data.user);
        set({ profile });
      }

      return { error: null };
    } catch (err: any) {
      return { error: err };
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await supabase.auth.signOut();
      set({ session: null, user: null, profile: null });
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    } finally {
      set({ isLoading: false });
    }
  },
}));
