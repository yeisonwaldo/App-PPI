import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FileText,
  CalendarDays,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Building,
  User,
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/authStore';

export default function MoreMenuScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const MENU_SECTIONS = [
    {
      title: 'Módulos Operativos',
      items: [
        {
          title: 'Gestión Documental & SST',
          subtitle: 'Certificados de alturas, exámenes médicos, afiliaciones',
          icon: FileText,
          route: '/documents',
          color: 'text-blue-600 bg-blue-50',
        },
        {
          title: 'Permisos y Licencias',
          subtitle: 'Incapacidades, permisos remunerados y vacaciones',
          icon: CalendarDays,
          route: '/leaves',
          color: 'text-purple-600 bg-purple-50',
        },
        {
          title: 'Centro de Notificaciones',
          subtitle: 'Alertas de vencimiento y novedades de nómina',
          icon: Bell,
          route: '/notifications',
          color: 'text-amber-600 bg-amber-50',
        },
      ],
    },
    {
      title: 'Administración y Sistema',
      items: [
        {
          title: 'Configuración de Empresa',
          subtitle: 'Parámetros de nómina, NIT, tipos de documentos',
          icon: Settings,
          route: '/settings',
          color: 'text-slate-600 bg-slate-100',
        },
      ],
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-black text-slate-900 tracking-tight mb-4">
          Más Opciones
        </Text>

        {/* Profile Card */}
        <Card className="p-4 mb-6 flex-row items-center">
          <View className="w-12 h-12 rounded-2xl bg-blue-100 items-center justify-center mr-3.5">
            <User size={24} color="#1A56DB" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-slate-900">
              {profile?.full_name || 'Alejandro Morales'}
            </Text>
            <Text className="text-xs text-slate-500">
              Rol: {profile?.role === 'admin' ? 'Administrador' : 'Gestión Humana'}
            </Text>
          </View>
        </Card>

        {/* Menu items */}
        {MENU_SECTIONS.map((sec, idx) => (
          <View key={idx} className="mb-6">
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              {sec.title}
            </Text>
            <View className="space-y-2">
              {sec.items.map((item, itemIdx) => {
                const IconComp = item.icon;
                return (
                  <TouchableOpacity
                    key={itemIdx}
                    activeOpacity={0.7}
                    onPress={() => router.push(item.route as any)}
                    className="mb-2.5"
                  >
                    <Card className="p-3.5 flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1 mr-2">
                        <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center mr-3">
                          <IconComp size={20} color="#1A56DB" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-bold text-slate-900">
                            {item.title}
                          </Text>
                          <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>
                            {item.subtitle}
                          </Text>
                        </View>
                      </View>
                      <ChevronRight size={18} color="#94A3B8" />
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Log Out Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSignOut}
          className="flex-row items-center justify-center p-4 bg-rose-50 border border-rose-200 rounded-2xl"
        >
          <LogOut size={18} color="#E11D48" className="mr-2" />
          <Text className="text-sm font-bold text-rose-700">Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
