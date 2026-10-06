import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Banknote,
  CalendarCheck,
  Info,
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'document' | 'payroll' | 'attendance' | 'system';
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Certificado de Alturas próximo a vencer',
    message: 'El certificado de Carlos Andrés Restrepo vence en 5 días (10 de Octubre).',
    time: 'Hace 2 horas',
    read: false,
    type: 'document',
  },
  {
    id: 'n2',
    title: 'Nueva solicitud de Incapacidad',
    message: 'Carlos Andrés Restrepo ha solicitado 3 días de incapacidad médica.',
    time: 'Hace 4 horas',
    read: false,
    type: 'attendance',
  },
  {
    id: 'n3',
    title: 'Nómina 1ra Quincena Octubre Calculada',
    message: 'La liquidación total por $ 39.422.000 COP está lista para revisión.',
    time: 'Ayer',
    read: true,
    type: 'payroll',
  },
  {
    id: 'n4',
    title: 'Copia de respaldo en la nube',
    message: 'Se sincronizaron correctamente todos los registros de obras.',
    time: 'Hace 2 días',
    read: true,
    type: 'system',
  },
];

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    Alert.alert('Notificaciones', 'Todas las notificaciones se marcaron como leídas.');
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'document':
        return <AlertTriangle size={18} color="#D97706" />;
      case 'payroll':
        return <Banknote size={18} color="#059669" />;
      case 'attendance':
        return <CalendarCheck size={18} color="#4F46E5" />;
      default:
        return <Info size={18} color="#1A56DB" />;
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
    >
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="text-xl font-bold text-slate-900">Notificaciones</Text>
          <Text className="text-xs text-slate-500">Alertas y novedades del sistema</Text>
        </View>

        <TouchableOpacity
          onPress={handleMarkAllAsRead}
          className="flex-row items-center px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200"
        >
          <CheckCheck size={14} color="#1A56DB" className="mr-1" />
          <Text className="text-xs font-bold text-blue-700">Leídas</Text>
        </TouchableOpacity>
      </View>

      {notifications.map((item) => (
        <Card
          key={item.id}
          className={`p-4 mb-3 border ${
            item.read ? 'border-slate-100 bg-white' : 'border-blue-200 bg-blue-50/30'
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
              <Text className="text-[10px] text-slate-400 mt-2">{item.time}</Text>
            </View>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}
