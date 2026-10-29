import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import {
  CheckCircle2,
  XCircle,
  Plus,
  X,
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  useLeaves,
  useCreateLeaveRequest,
  useUpdateLeaveStatus,
} from '@/features/leaves/useLeaves';
import { useEmployees } from '@/features/employees/useEmployees';
import type { LeaveType, LeaveStatus } from '@/types/database';

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  permiso: 'Permiso Remunerado / Personal',
  licencia_medica: 'Incapacidad Médica (EPS)',
  licencia_maternidad: 'Licencia de Maternidad / Paternidad',
  licencia_luto: 'Licencia de Luto',
  vacaciones: 'Vacaciones',
  otro: 'Otro Permiso',
};

export default function LeavesScreen() {
  const [statusFilter, setStatusFilter] = useState<'all' | LeaveStatus>('all');
  const [showNewModal, setShowNewModal] = useState(false);

  const {
    data: leaves = [],
    isLoading,
    refetch,
    isRefetching,
  } = useLeaves(statusFilter);

  const { data: employees = [] } = useEmployees({ status: 'active' });
  const createMutation = useCreateLeaveRequest();
  const updateStatusMutation = useUpdateLeaveStatus();

  // Estado del formulario de nueva solicitud
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType>('permiso');
  const [startDate, setStartDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]!
  );
  const [endDate, setEndDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]!
  );
  const [days, setDays] = useState<string>('1');
  const [reason, setReason] = useState<string>('');

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      await updateStatusMutation.mutateAsync({ id, status: newStatus });
      Alert.alert(
        newStatus === 'approved' ? 'Solicitud Aprobada' : 'Solicitud Rechazada',
        'El estado ha sido actualizado en Supabase.'
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo actualizar la solicitud.');
    }
  };

  const handleOpenNewModal = () => {
    if (!selectedEmployeeId && employees.length > 0) {
      setSelectedEmployeeId(employees[0]!.id);
    }
    setShowNewModal(true);
  };

  const handleCreateLeave = async () => {
    const empId = selectedEmployeeId || employees[0]?.id;
    if (!empId) {
      Alert.alert('Error', 'Selecciona un colaborador.');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Motivo requerido', 'Describe el motivo del permiso o incapacidad.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        employee_id: empId,
        leave_type: selectedLeaveType,
        start_date: startDate.trim(),
        end_date: endDate.trim(),
        days: Math.max(1, Number(days) || 1),
        reason: reason.trim(),
      });

      setShowNewModal(false);
      setReason('');
      setDays('1');
      Alert.alert('Solicitud Creada', 'La solicitud se guardó en Supabase.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo crear la solicitud.');
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        className="flex-1"
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
        <View className="mb-4">
          <Text className="text-xl font-bold text-slate-900">
            Permisos y Licencias
          </Text>
          <Text className="text-xs text-slate-500">
            Solicitudes sincronizadas con la tabla leave_requests en Supabase
          </Text>
        </View>

        <Button
          title="Crear Solicitud de Permiso"
          variant="primary"
          icon={<Plus size={16} color="#FFFFFF" />}
          onPress={handleOpenNewModal}
          className="mb-4"
        />

        {/* Filtros por estado */}
        <View className="flex-row gap-2 mb-4">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
            <TouchableOpacity
              key={st}
              onPress={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-full border ${
                statusFilter === st
                  ? 'bg-blue-600 border-blue-600'
                  : 'bg-white border-slate-200'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  statusFilter === st ? 'text-white' : 'text-slate-600'
                }`}
              >
                {st === 'all'
                  ? 'Todas'
                  : st === 'pending'
                  ? 'Pendientes'
                  : st === 'approved'
                  ? 'Aprobadas'
                  : 'Rechazadas'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#1A56DB" className="py-10" />
        ) : leaves.length === 0 ? (
          <Card className="p-6 items-center">
            <Text className="text-xs text-slate-500">
              No hay solicitudes registradas en este estado.
            </Text>
          </Card>
        ) : (
          leaves.map((item) => {
            const emp = item.employees;
            return (
              <Card key={item.id} className="p-4 mb-3">
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1 mr-2">
                    <Text className="text-sm font-bold text-slate-900">
                      {emp ? `${emp.first_name} ${emp.last_name}` : 'Colaborador'}
                    </Text>
                    <Text className="text-xs font-semibold text-blue-700 mt-0.5">
                      {LEAVE_TYPE_LABELS[item.leave_type] || item.leave_type} •{' '}
                      {item.days} {item.days === 1 ? 'día' : 'días'}
                    </Text>
                  </View>
                  <Badge
                    label={
                      item.status === 'approved'
                        ? 'Aprobado'
                        : item.status === 'rejected'
                        ? 'Rechazado'
                        : 'Pendiente'
                    }
                    variant={
                      item.status === 'approved'
                        ? 'success'
                        : item.status === 'rejected'
                        ? 'danger'
                        : 'warning'
                    }
                    size="sm"
                  />
                </View>

                <Text className="text-xs text-slate-600 mb-2">{item.reason}</Text>

                <Text className="text-[11px] text-slate-400 mb-3">
                  Periodo: {item.start_date} hasta {item.end_date}
                </Text>

                {item.status === 'pending' && (
                  <View className="flex-row gap-2 border-t border-slate-100 pt-2.5">
                    <Button
                      title="Aprobar"
                      variant="primary"
                      size="sm"
                      className="flex-1 bg-emerald-600"
                      loading={updateStatusMutation.isPending}
                      icon={<CheckCircle2 size={14} color="#FFFFFF" />}
                      onPress={() => handleUpdateStatus(item.id, 'approved')}
                    />
                    <Button
                      title="Rechazar"
                      variant="danger"
                      size="sm"
                      className="flex-1"
                      loading={updateStatusMutation.isPending}
                      icon={<XCircle size={14} color="#FFFFFF" />}
                      onPress={() => handleUpdateStatus(item.id, 'rejected')}
                    />
                  </View>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Modal para crear solicitud de permiso */}
      <Modal
        visible={showNewModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNewModal(false)}
      >
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[85%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-slate-900">
                Nueva Solicitud de Permiso
              </Text>
              <TouchableOpacity onPress={() => setShowNewModal(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Selector de Colaborador */}
              <Text className="text-xs font-semibold text-slate-700 mb-1.5">
                Colaborador *
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-4"
                contentContainerStyle={{ gap: 8 }}
              >
                {employees.map((emp) => {
                  const selected =
                    (selectedEmployeeId || employees[0]?.id) === emp.id;
                  return (
                    <TouchableOpacity
                      key={emp.id}
                      onPress={() => setSelectedEmployeeId(emp.id)}
                      className={`px-3 py-2 rounded-xl border ${
                        selected
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          selected ? 'text-white' : 'text-slate-700'
                        }`}
                      >
                        {emp.first_name} {emp.last_name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Tipo de Permiso */}
              <Text className="text-xs font-semibold text-slate-700 mb-1.5">
                Tipo de Permiso / Licencia *
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-4"
                contentContainerStyle={{ gap: 8 }}
              >
                {(Object.keys(LEAVE_TYPE_LABELS) as LeaveType[]).map((lt) => {
                  const selected = selectedLeaveType === lt;
                  return (
                    <TouchableOpacity
                      key={lt}
                      onPress={() => setSelectedLeaveType(lt)}
                      className={`px-3 py-2 rounded-xl border ${
                        selected
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          selected ? 'text-white' : 'text-slate-700'
                        }`}
                      >
                        {LEAVE_TYPE_LABELS[lt]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Input
                    label="Fecha Inicio (YYYY-MM-DD)"
                    placeholder="2026-10-28"
                    value={startDate}
                    onChangeText={setStartDate}
                  />
                </View>
                <View className="flex-1">
                  <Input
                    label="Fecha Fin (YYYY-MM-DD)"
                    placeholder="2026-10-30"
                    value={endDate}
                    onChangeText={setEndDate}
                  />
                </View>
              </View>

              <Input
                label="Número de Días *"
                placeholder="1"
                keyboardType="numeric"
                value={days}
                onChangeText={setDays}
              />

              <Input
                label="Motivo / Observaciones *"
                placeholder="Describe el soporte médico o razón del permiso..."
                value={reason}
                onChangeText={setReason}
              />

              <Button
                title="Guardar Solicitud en Supabase"
                variant="primary"
                size="lg"
                loading={createMutation.isPending}
                onPress={handleCreateLeave}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
