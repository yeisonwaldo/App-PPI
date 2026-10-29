import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  CheckCheck,
  AlertTriangle,
  Banknote,
  CalendarCheck,
  Info,
  RefreshCw,
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useCheckDocumentExpiry,
} from '@/features/notifications/useNotifications';
import { formatDate } from '@/lib/formatters';
import type { NotificationType } from '@/types/database';

export default function NotificationsScreen() {
  const {
    data: notifications = [],
    isLoading,
    refetch,
    isRefetching,
  } = useNotifications();

  const markReadMutation = useMarkNotificationRead();
  const markAllMutation = useMarkAllNotificationsRead();
  const checkExpiryMutation = useCheckDocumentExpiry();

  const handleMarkAllAsRead = async () => {
    try {
      await markAllMutation.mutateAsync();
      Alert.alert('Notificaciones', 'Todas las notificaciones se marcaron como leídas en Supabase.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudieron actualizar las notificaciones.');
    }
  };

  const handleRunDocumentCheck = async () => {
    try {
      const res = await checkExpiryMutation.mutateAsync();
      Alert.alert(
        'Verificación Completada',
        `Se revisaron los vencimientos en Supabase (${res?.notifications_created ?? 0} nuevas alertas generadas).`
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo ejecutar check_document_expiry.');
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'document_expiry':
        return <AlertTriangle size={18} color="#D97706" />;
      case 'payroll':
        return <Banknote size={18} color="#059669" />;
      case 'attendance':
      case 'leave_request':
        return <CalendarCheck size={18} color="#4F46E5" />;
      default:
        return <Info size={18} color="#1A56DB" />;
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            refetch();
          }}
          tintColor="#1A56DB"
        />
      }
    >
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-1 mr-2">
          <Text className="text-xl font-bold text-slate-900">Notificaciones</Text>
          <Text className="text-xs text-slate-500">
            Suscripción en tiempo real a Supabase Realtime
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={handleRunDocumentCheck}
            disabled={checkExpiryMutation.isPending}
            className="flex-row items-center px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200"
          >
            <RefreshCw size={13} color="#D97706" className="mr-1" />
            <Text className="text-xs font-bold text-amber-800">Verificar Docs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleMarkAllAsRead}
            disabled={markAllMutation.isPending}
            className="flex-row items-center px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200"
          >
            <CheckCheck size={14} color="#1A56DB" className="mr-1" />
            <Text className="text-xs font-bold text-blue-700">Leídas</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#1A56DB" className="py-10" />
      ) : notifications.length === 0 ? (
        <Card className="p-6 items-center">
          <Text className="text-sm font-bold text-slate-700 mb-1">
            No tienes notificaciones pendientes
          </Text>
          <Text className="text-xs text-slate-500 text-center">
            Puedes presionar "Verificar Docs" arriba para buscar documentos próximos a vencer o crear una solicitud de permiso para probar el trigger automático.
          </Text>
        </Card>
      ) : (
        notifications.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.8}
            onPress={() => {
              if (!item.read) {
                markReadMutation.mutate(item.id);
              }
            }}
          >
            <Card
              className={`p-4 mb-3 border ${
                item.read
                  ? 'border-slate-100 bg-white'
                  : 'border-blue-200 bg-blue-50/30'
              }`}
            >
              <View className="flex-row items-start">
                <View className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center mr-3 mt-0.5">
                  {getIcon(item.type)}
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-bold text-slate-900 flex-1 mr-2">
                      {item.title}
                    </Text>
                    {!item.read && (
                      <View className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                  </View>
                  <Text className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {item.message}
                  </Text>
                  <Text className="text-[10px] text-slate-400 mt-2">
                    {formatDate(item.created_at)}
                  </Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}
