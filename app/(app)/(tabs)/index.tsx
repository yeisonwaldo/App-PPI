import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Users,
  Banknote,
  FileText,
  Clock,
  AlertTriangle,
  ChevronRight,
  UserPlus,
  ArrowUpRight,
  Bell,
  HardHat,
} from 'lucide-react-native';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/authStore';
import { useDashboardMetrics } from '@/features/dashboard/useDashboardMetrics';
import { useNotifications } from '@/features/notifications/useNotifications';
import { formatCOP, getDocumentStatusInfo } from '@/lib/formatters';

export default function DashboardScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { data: metrics, isLoading, refetch, isRefetching } = useDashboardMetrics();
  const { data: notifications = [] } = useNotifications();

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetch();
            }}
            tintColor="#1A56DB"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View className="px-5 pt-4 pb-3 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 mr-3">
            <View className="w-11 h-11 rounded-2xl bg-blue-600 items-center justify-center mr-3 shadow-md shadow-blue-500/20">
              <HardHat size={22} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {profile?.role === 'admin'
                  ? 'Administrador'
                  : profile?.role === 'hr'
                  ? 'Gestión Humana'
                  : profile?.role === 'supervisor'
                  ? 'Supervisor de Obra'
                  : 'Colaborador'}
              </Text>
              <Text className="text-lg font-bold text-slate-900" numberOfLines={1}>
                {profile?.full_name || 'Usuario'}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => router.push('/notifications')}
              className="w-10 h-10 rounded-full bg-white border border-slate-200 items-center justify-center shadow-sm relative"
            >
              <Bell size={18} color="#475569" />
              {unreadCount > 0 && (
                <View className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute top-2 right-2" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* KPI Metrics Grid */}
        <View className="px-3.5 mb-5">
          <View className="flex-row">
            <MetricCard
              title="Empleados Activos"
              value={isLoading ? '...' : (metrics?.activeEmployees ?? 0)}
              subtitle="En todas las obras"
              icon={<Users size={20} color="#1A56DB" />}
              iconBgColor="bg-blue-50"
            />
            <MetricCard
              title="Nómina del Mes"
              value={isLoading ? '...' : formatCOP(metrics?.monthlyPayrollTotal)}
              subtitle="Neto calculado"
              icon={<Banknote size={20} color="#059669" />}
              iconBgColor="bg-emerald-50"
            />
          </View>

          <View className="flex-row">
            <MetricCard
              title="Documentos"
              value={isLoading ? '...' : (metrics?.totalDocuments ?? 0)}
              subtitle={
                metrics?.expiringDocumentsCount
                  ? `${metrics.expiringDocumentsCount} por revisar`
                  : 'Al día'
              }
              icon={<FileText size={20} color="#D97706" />}
              iconBgColor="bg-amber-50"
            />
            <MetricCard
              title="Asistencia Hoy"
              value={
                isLoading
                  ? '...'
                  : `${metrics?.attendancePresent ?? 0}/${metrics?.attendanceTotal ?? 0}`
              }
              subtitle="Presentes en obra"
              icon={<Clock size={20} color="#4F46E5" />}
              iconBgColor="bg-indigo-50"
            />
          </View>
        </View>

        {/* Quick Actions Row */}
        <View className="px-5 mb-6">
          <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
            Acciones Rápidas
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.push('/employees/new')}
              className="flex-1 bg-blue-600 rounded-xl py-3 px-3 flex-row items-center justify-center shadow-sm active:bg-blue-700"
            >
              <UserPlus size={16} color="#FFFFFF" className="mr-2" />
              <Text className="text-white text-xs font-bold">Nuevo Empleado</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(app)/(tabs)/payroll')}
              className="flex-1 bg-white border border-slate-200 rounded-xl py-3 px-3 flex-row items-center justify-center shadow-sm active:bg-slate-50"
            >
              <Banknote size={16} color="#1A56DB" className="mr-2" />
              <Text className="text-blue-700 text-xs font-bold">Ver Nómina</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section: Alertas de Vencimiento */}
        <View className="px-5 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <AlertTriangle size={18} color="#D97706" className="mr-2" />
              <Text className="text-base font-bold text-slate-900">
                Alertas de Vencimiento
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/documents')}
              className="flex-row items-center"
            >
              <Text className="text-xs font-semibold text-blue-600 mr-1">
                Ver todos
              </Text>
              <ChevronRight size={14} color="#1A56DB" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator size="small" color="#1A56DB" className="py-4" />
          ) : !metrics?.expiringDocuments?.length ? (
            <Card className="items-center py-6">
              <Text className="text-xs text-slate-500">
                No hay alertas de vencimiento pendientes en Supabase.
              </Text>
            </Card>
          ) : (
            <View className="space-y-2.5">
              {metrics.expiringDocuments.slice(0, 3).map((doc) => {
                const statusInfo = getDocumentStatusInfo(
                  doc.expiry_date,
                  doc.alert_days_before
                );
                return (
                  <TouchableOpacity
                    key={doc.id}
                    activeOpacity={0.7}
                    onPress={() => router.push(`/employees/${doc.employee_id}`)}
                  >
                    <Card className="flex-row items-center justify-between p-3.5 mb-2.5">
                      <View className="flex-1 mr-3">
                        <Text className="text-sm font-bold text-slate-900">
                          {doc.document_type_name}
                        </Text>
                        <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>
                          {doc.first_name} {doc.last_name}
                        </Text>
                        <Text className="text-[11px] text-slate-400 mt-0.5">
                          Vence: {doc.expiry_date || 'Sin fecha'}
                        </Text>
                      </View>
                      <Badge
                        label={statusInfo.label}
                        variant={statusInfo.badgeVariant}
                        size="sm"
                      />
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Section: Actividad Reciente */}
        <View className="px-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-slate-900">
              Actividad Reciente
            </Text>
          </View>

          {metrics?.recentActivities?.map((item) => (
            <Card key={item.id} className="p-3.5 mb-2.5 flex-row items-center">
              <View className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center mr-3">
                <ArrowUpRight size={18} color="#1A56DB" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-900">{item.title}</Text>
                <Text className="text-[11px] text-slate-500 mt-0.5">
                  {item.subtitle}
                </Text>
                <Text className="text-[10px] text-slate-400 mt-0.5">
                  {item.timestamp}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
