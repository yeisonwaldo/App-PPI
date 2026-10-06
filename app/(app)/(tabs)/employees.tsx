import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  UserPlus,
  Briefcase,
  ChevronRight,
  Filter,
} from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useEmployees } from '@/features/employees/useEmployees';
import { formatCOP, getEmployeeStatusInfo } from '@/lib/formatters';
import type { Employee, EmployeeStatus } from '@/types/database';

const STATUS_FILTERS: Array<{ id: EmployeeStatus | 'all'; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'active', label: 'Activos' },
  { id: 'vacation', label: 'Vacaciones' },
  { id: 'inactive', label: 'Inactivos' },
];

export default function EmployeesListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<EmployeeStatus | 'all'>('all');

  const {
    data: employees = [],
    isLoading,
    refetch,
    isRefetching,
  } = useEmployees({
    search: search.trim() || undefined,
    status: selectedStatus,
  });

  const renderEmployeeCard = ({ item }: { item: Employee }) => {
    const statusInfo = getEmployeeStatusInfo(item.status);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push(`/employees/${item.id}`)}
        className="mb-3"
      >
        <Card className="p-4">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1 mr-2">
              <Text className="text-base font-bold text-slate-900 leading-snug">
                {item.first_name} {item.last_name}
              </Text>
              <Text className="text-xs text-slate-500 mt-0.5">
                {item.document_type} {item.document_number}
              </Text>
            </View>
            <Badge label={statusInfo.label} variant={statusInfo.badgeVariant} size="sm" />
          </View>

          <View className="border-t border-slate-100 pt-2.5 mt-1 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-2">
              <Briefcase size={14} color="#64748B" className="mr-1.5" />
              <Text className="text-xs text-slate-700 font-medium" numberOfLines={1}>
                {item.position}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-xs font-bold text-blue-700 mr-1">
                {formatCOP(item.base_salary)}
              </Text>
              <ChevronRight size={14} color="#94A3B8" />
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Top Header */}
      <View className="px-5 pt-4 pb-2">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-2xl font-black text-slate-900 tracking-tight">
              Colaboradores
            </Text>
            <Text className="text-xs text-slate-500">
              {employees.length} colaboradores registrados
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/employees/new')}
            className="flex-row items-center bg-blue-600 px-3.5 py-2.5 rounded-xl shadow-sm active:bg-blue-700"
          >
            <UserPlus size={16} color="#FFFFFF" className="mr-1.5" />
            <Text className="text-xs font-bold text-white">Nuevo</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <Input
          placeholder="Buscar por nombre, cédula o cargo..."
          value={search}
          onChangeText={setSearch}
          leftIcon={<Search size={16} color="#94A3B8" />}
          containerClassName="mb-2"
        />

        {/* Status Filters Pills */}
        <View className="flex-row gap-2 py-1">
          {STATUS_FILTERS.map((f) => {
            const isSelected = selectedStatus === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => setSelectedStatus(f.id)}
                className={`px-3 py-1.5 rounded-full border ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-white border-slate-200'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    isSelected ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1A56DB" />
        </View>
      ) : (
        <FlatList
          data={employees}
          keyExtractor={(item) => item.id}
          renderItem={renderEmployeeCard}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#1A56DB"
            />
          }
          ListEmptyComponent={
            <Card className="items-center py-10 mt-6">
              <Text className="text-sm font-semibold text-slate-700 mb-1">
                No se encontraron colaboradores
              </Text>
              <Text className="text-xs text-slate-400 text-center px-6">
                Intenta cambiar los términos de búsqueda o filtros seleccionados.
              </Text>
            </Card>
          }
        />
      )}
    </SafeAreaView>
  );
}
