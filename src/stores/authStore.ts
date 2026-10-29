import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';
import type { Session, User } from '@supabase/supabase-js';

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
      await supabase.auth.signOut();
      set({ session: null, user: null, profile: null });
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    } finally {
      set({ isLoading: false });
    }
  },
}));
