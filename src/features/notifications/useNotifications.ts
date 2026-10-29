import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { Notification } from '@/types/database';

// Controla una única suscripción activa por usuario aunque múltiples pantallas usen useNotifications()
let activeChannel: ReturnType<typeof supabase.channel> | null = null;
let activeChannelUserId: string | null = null;
let subscriberCount = 0;

export function useNotifications() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Suscripción en tiempo real compartida a nuevas notificaciones de este usuario
  useEffect(() => {
    if (!user?.id) return;

    const userId = user.id;
    subscriberCount += 1;

    // Si cambió el usuario y había un canal previo, limpiarlo primero
    if (activeChannel && activeChannelUserId !== userId) {
      supabase.removeChannel(activeChannel);
      activeChannel = null;
      activeChannelUserId = null;
    }

    // Crear el canal solo si no existe ya uno activo para este usuario
    if (!activeChannel) {
      activeChannelUserId = userId;
      activeChannel = supabase
        .channel(`notifications:user:${userId}:${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
            queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] });
          }
        )
        .subscribe();
    }

    return () => {
      subscriberCount = Math.max(0, subscriberCount - 1);
      if (subscriberCount === 0 && activeChannel) {
        supabase.removeChannel(activeChannel);
        activeChannel = null;
        activeChannelUserId = null;
      }
    };
  }, [user?.id, queryClient]);

  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async (): Promise<Notification[]> => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as Notification[]) ?? [];
    },
    enabled: Boolean(user?.id),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await (supabase
        .from('notifications') as any)
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) return false;
      const { error } = await (supabase
        .from('notifications') as any)
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });
}

export function useCheckDocumentExpiry() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase.rpc as any)('check_document_expiry');
      if (error) throw error;
      return data as { success: boolean; notifications_created: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] });
    },
  });
}
