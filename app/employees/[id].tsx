import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  User,
  Briefcase,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Building,
  Shield,
  FileText,
  Banknote,
  Trash2,
  Edit3,
  CheckCircle2,
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useEmployee, useUpdateEmployee, useDeleteEmployee } from '@/features/employees/useEmployees';
import {
  formatCOP,
  formatDate,
  getEmployeeStatusInfo,
  getDocumentStatusInfo,
} from '@/lib/formatters';
import { MOCK_DOCUMENTS_VIEW } from '@/lib/mockData';
import type { EmployeeStatus } from '@/types/database';

export default function EmployeeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'info' | 'docs' | 'payroll'>('info');

  const { data: employee, isLoading } = useEmployee(id);
  const updateMutation = useUpdateEmployee();
  const deleteMutation = useDeleteEmployee();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#1A56DB" />
      </View>
    );
  }

  if (!employee) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-slate-50">
        <Text className="text-base font-bold text-slate-800 mb-2">
          Colaborador no encontrado
        </Text>
        <Button title="Volver a la lista" onPress={() => router.back()} />
      </View>
    );
  }

  const statusInfo = getEmployeeStatusInfo(employee.status);

  // Cálculos preliminares de nómina para este empleado en COP
  const baseSalary = Number(employee.base_salary);
  const transportAllowance = baseSalary <= 2600000 ? 162000 : 0;
  const healthDeduction = baseSalary * 0.04;
  const pensionDeduction = baseSalary * 0.04;
  const netEstimated = baseSalary + transportAllowance - (healthDeduction + pensionDeduction);

  const employeeDocs = MOCK_DOCUMENTS_VIEW.filter((d) => d.employee_id === employee.id);

  const handleChangeStatus = (newStatus: EmployeeStatus) => {
    Alert.alert(
      'Cambiar Estado',
      `¿Deseas cambiar el estado a ${newStatus}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await updateMutation.mutateAsync({
                id: employee.id,
                data: { status: newStatus },
              });
              Alert.alert('Éxito', 'Estado actualizado correctamente.');
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Colaborador',
      `¿Estás seguro de eliminar a ${employee.first_name} ${employee.last_name}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(employee.id);
              Alert.alert('Eliminado', 'El colaborador fue retirado del sistema.', [
                { text: 'Aceptar', onPress: () => router.back() },
              ]);
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
    >
      {/* Profile Header Card */}
      <Card className="p-5 mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="w-14 h-14 rounded-2xl bg-blue-100 items-center justify-center">
            <User size={30} color="#1A56DB" />
          </View>
          <Badge label={statusInfo.label} variant={statusInfo.badgeVariant} />
        </View>

        <Text className="text-xl font-black text-slate-900 leading-tight">
          {employee.first_name} {employee.last_name}
        </Text>
        <Text className="text-xs text-slate-500 mt-0.5">
          {employee.document_type}: {employee.document_number}
        </Text>

        <View className="flex-row items-center mt-3 pt-3 border-t border-slate-100">
          <Briefcase size={16} color="#64748B" className="mr-2" />
          <Text className="text-sm font-semibold text-slate-700">
            {employee.position} • {employee.department || 'Obra General'}
          </Text>
        </View>
      </Card>

      {/* Tabs Switcher */}
      <View className="flex-row bg-slate-200/80 p-1 rounded-xl mb-4">
        <TouchableOpacity
          onPress={() => setActiveTab('info')}
          className={`flex-1 py-2 rounded-lg items-center ${
            activeTab === 'info' ? 'bg-white shadow-sm' : ''
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeTab === 'info' ? 'text-blue-700' : 'text-slate-600'
            }`}
          >
            Información
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('docs')}
          className={`flex-1 py-2 rounded-lg items-center ${
            activeTab === 'docs' ? 'bg-white shadow-sm' : ''
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeTab === 'docs' ? 'text-blue-700' : 'text-slate-600'
            }`}
          >
            Documentos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('payroll')}
          className={`flex-1 py-2 rounded-lg items-center ${
            activeTab === 'payroll' ? 'bg-white shadow-sm' : ''
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeTab === 'payroll' ? 'text-blue-700' : 'text-slate-600'
            }`}
          >
            Nómina Estimada
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB CONTENT: INFORMACIÓN */}
      {activeTab === 'info' && (
        <View className="space-y-3">
          <Card className="p-4 mb-3">
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Contacto y Ubicación
            </Text>
            <View className="flex-row items-center mb-2.5">
              <Phone size={16} color="#64748B" className="mr-2.5" />
              <Text className="text-sm text-slate-800">
                {employee.phone || 'No registrado'}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Mail size={16} color="#64748B" className="mr-2.5" />
              <Text className="text-sm text-slate-800">
                {employee.email || 'No registrado'}
              </Text>
            </View>
          </Card>

          <Card className="p-4 mb-3">
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Condiciones Laborales
            </Text>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs text-slate-500">Tipo de Contrato</Text>
              <Text className="text-xs font-semibold text-slate-800 uppercase">
                {employee.contract_type.replace('_', ' ')}
              </Text>
            </View>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs text-slate-500">Fecha de Ingreso</Text>
              <Text className="text-xs font-semibold text-slate-800">
                {formatDate(employee.hire_date)}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-slate-500">Salario Base Mensual</Text>
              <Text className="text-sm font-bold text-blue-700">
                {formatCOP(employee.base_salary)}
              </Text>
            </View>
          </Card>

          <Card className="p-4 mb-4">
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Afiliaciones a Seguridad Social
            </Text>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs text-slate-500">EPS</Text>
              <Text className="text-xs font-semibold text-slate-800">
                {employee.eps || 'Sura EPS'}
              </Text>
            </View>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs text-slate-500">Fondo de Pensión</Text>
              <Text className="text-xs font-semibold text-slate-800">
                {employee.pension_fund || 'Protección'}
              </Text>
            </View>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs text-slate-500">ARL</Text>
              <Text className="text-xs font-semibold text-slate-800">
                {employee.arl || 'Sura ARL'}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-slate-500">Fondo Cesantías</Text>
              <Text className="text-xs font-semibold text-slate-800">
                {employee.cesantias_fund || 'Protección'}
              </Text>
            </View>
          </Card>

          {/* Quick status change buttons */}
          <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Gestionar Estado
          </Text>
          <View className="flex-row gap-2 mb-4">
            <TouchableOpacity
              onPress={() => handleChangeStatus('active')}
              className="flex-1 py-2 bg-emerald-100 rounded-xl items-center"
            >
              <Text className="text-xs font-bold text-emerald-800">Activo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleChangeStatus('vacation')}
              className="flex-1 py-2 bg-amber-100 rounded-xl items-center"
            >
              <Text className="text-xs font-bold text-amber-800">Vacaciones</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleChangeStatus('inactive')}
              className="flex-1 py-2 bg-slate-200 rounded-xl items-center"
            >
              <Text className="text-xs font-bold text-slate-800">Inactivo</Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Eliminar Colaborador"
            variant="danger"
            size="md"
            icon={<Trash2 size={16} color="#FFFFFF" />}
            onPress={handleDelete}
            loading={deleteMutation.isPending}
          />
        </View>
      )}

      {/* TAB CONTENT: DOCUMENTOS */}
      {activeTab === 'docs' && (
        <View>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Documentación Laboral y SST
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/documents')}
              className="flex-row items-center"
            >
              <Text className="text-xs font-bold text-blue-600">Subir Nuevo</Text>
            </TouchableOpacity>
          </View>

          {employeeDocs.length === 0 ? (
            <Card className="items-center py-8">
              <FileText size={32} color="#94A3B8" className="mb-2" />
              <Text className="text-xs text-slate-500">
                No hay documentos cargados aún para este colaborador.
              </Text>
            </Card>
          ) : (
            employeeDocs.map((doc) => {
              const statusInfo = getDocumentStatusInfo(doc.expiry_date);
              return (
                <Card key={doc.id} className="p-4 mb-3">
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1 mr-2">
                      <Text className="text-sm font-bold text-slate-900">
                        {doc.document_type_name}
                      </Text>
                      <Text className="text-xs text-slate-400 mt-0.5">
                        {doc.file_name}
                      </Text>
                    </View>
                    <Badge
                      label={statusInfo.label}
                      variant={statusInfo.badgeVariant}
                      size="sm"
                    />
                  </View>
                  <View className="border-t border-slate-100 pt-2 flex-row justify-between">
                    <Text className="text-[11px] text-slate-500">
                      Emisión: {doc.issue_date || '-'}
                    </Text>
                    <Text className="text-[11px] text-slate-500">
                      Vencimiento: {doc.expiry_date || 'Sin vencimiento'}
                    </Text>
                  </View>
                </Card>
              );
            })
          )}
        </View>
      )}

      {/* TAB CONTENT: NÓMINA ESTIMADA */}
      {activeTab === 'payroll' && (
        <View>
          <Card className="p-4 mb-4">
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Desglose Quincenal Estimado (Colombia)
            </Text>

            <View className="space-y-2">
              <View className="flex-row justify-between mb-2">
                <Text className="text-xs text-slate-600">Salario Básico (15 días)</Text>
                <Text className="text-xs font-bold text-slate-900">
                  {formatCOP(baseSalary / 2)}
                </Text>
              </View>

              <View className="flex-row justify-between mb-2">
                <Text className="text-xs text-slate-600">Auxilio de Transporte (15 días)</Text>
                <Text className="text-xs font-bold text-slate-900">
                  {formatCOP(transportAllowance / 2)}
                </Text>
              </View>

              <View className="border-t border-slate-100 pt-2 flex-row justify-between mb-2">
                <Text className="text-xs text-rose-600">Deducción Salud (4%)</Text>
                <Text className="text-xs font-bold text-rose-600">
                  - {formatCOP(healthDeduction / 2)}
                </Text>
              </View>

              <View className="flex-row justify-between mb-3">
                <Text className="text-xs text-rose-600">Deducción Pensión (4%)</Text>
                <Text className="text-xs font-bold text-rose-600">
                  - {formatCOP(pensionDeduction / 2)}
                </Text>
              </View>

              <View className="border-t-2 border-slate-200 pt-3 flex-row justify-between items-center">
                <Text className="text-sm font-black text-slate-900">Neto Quincenal a Pagar</Text>
                <Text className="text-base font-black text-emerald-700">
                  {formatCOP(netEstimated / 2)}
                </Text>
              </View>
            </View>
          </Card>

          <Button
            title="Ver Todas las Nóminas"
            variant="outline"
            onPress={() => router.push('/(app)/(tabs)/payroll')}
          />
        </View>
      )}
    </ScrollView>
  );
}
