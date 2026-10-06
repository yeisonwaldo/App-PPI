import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Profile } from '@/types/database';
import type { Session, User } from '@supabase/supabase-js';

// Demo profile para pruebas si Supabase no está conectado todavía
export const DEMO_PROFILE: Profile = {
  id: 'd0000000-0000-0000-0000-000000000001',
  company_id: 'c0000000-0000-0000-0000-000000000001',
  full_name: 'Alejandro Morales (Admin)',
  role: 'admin',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;
  isDemoMode: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  enableDemoMode: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isInitialized: false,
  isDemoMode: false,

  setSession: (session) => set({ session, user: session?.user ?? null }),
  setProfile: (profile) => set({ profile }),

  initialize: async () => {
    try {
      if (!isSupabaseConfigured) {
        // Modo demo por defecto si no hay credenciales en .env
        set({
          user: { id: DEMO_PROFILE.id, email: 'admin@construpay.co' } as User,
          profile: DEMO_PROFILE,
          isLoading: false,
          isInitialized: true,
          isDemoMode: true,
        });
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        set({ session, user: session.user });
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          set({ profile });
        }
      }
    } catch (err) {
      console.error('Error al inicializar sesión:', err);
    } finally {
      set({ isLoading: false, isInitialized: true });
    }

    // Escuchar cambios de autenticación en Supabase
    if (isSupabaseConfigured) {
      supabase.auth.onAuthStateChange(async (_event, session) => {
        set({ session, user: session?.user ?? null });
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          set({ profile: profile ?? null });
        } else {
          set({ profile: null });
        }
      });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    try {
      if (!isSupabaseConfigured) {
        // En modo demo, aceptar credenciales
        set({
          user: { id: DEMO_PROFILE.id, email } as User,
          profile: DEMO_PROFILE,
          isDemoMode: true,
          isLoading: false,
        });
        return { error: null };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data.session && data.user) {
        set({ session: data.session, user: data.user });
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        set({ profile: profile ?? null });
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
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      set({ session: null, user: null, profile: null, isDemoMode: false });
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  enableDemoMode: () => {
    set({
      user: { id: DEMO_PROFILE.id, email: 'admin@construpay.co' } as User,
      profile: DEMO_PROFILE,
      isDemoMode: true,
      isLoading: false,
    });
  },
}));
