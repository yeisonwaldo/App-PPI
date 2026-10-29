import React, { useState, useEffect } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Calendar,
  CheckCircle2,
  Play,
  Plus,
  X,
  ChevronRight,
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  usePayrollPeriods,
  usePayrollItems,
  useCreatePayrollPeriod,
  useCalculatePayroll,
  useMarkPayrollPaid,
} from '@/features/payroll/usePayroll';
import { formatCOP, getPayrollStatusInfo } from '@/lib/formatters';
import type { PayrollPeriodType } from '@/types/database';

export default function PayrollScreen() {
  const {
    data: periods = [],
    isLoading: loadingPeriods,
    refetch: refetchPeriods,
    isRefetching,
  } = usePayrollPeriods();

  const [selectedPeriodId, setSelectedPeriodId] = useState<string | undefined>(undefined);
  const [showNewModal, setShowNewModal] = useState(false);

  // Formulario para nuevo periodo
  const [newName, setNewName] = useState('');
  const [newStartDate, setNewStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0]!
  );
  const [newEndDate, setNewEndDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
      .toISOString()
      .split('T')[0]!
  );
  const [newType, setNewType] = useState<PayrollPeriodType>('quincenal');

  useEffect(() => {
    if (!selectedPeriodId && periods.length > 0) {
      setSelectedPeriodId(periods[0]!.id);
    }
  }, [periods, selectedPeriodId]);

  const currentPeriod = periods.find((p) => p.id === selectedPeriodId) ?? periods[0];

  const {
    data: items = [],
    isLoading: loadingItems,
    refetch: refetchItems,
  } = usePayrollItems(currentPeriod?.id);

  const createPeriodMutation = useCreatePayrollPeriod();
  const calculateMutation = useCalculatePayroll();
  const markPaidMutation = useMarkPayrollPaid();

  const handleGeneratePayroll = async () => {
    if (!currentPeriod) return;
    try {
      const result = await calculateMutation.mutateAsync(currentPeriod.id);
      Alert.alert(
        'Nómina Calculada en Supabase',
        `Se liquidaron ${result?.employees ?? items.length} colaboradores aplicando la configuración legal de la empresa.`
      );
    } catch (err: any) {
      Alert.alert(
        'Error al Calcular',
        err.message || 'No se pudo ejecutar el cálculo de nómina.'
      );
    }
  };

  const handleMarkAsPaid = () => {
    if (!currentPeriod) return;
    Alert.alert(
      'Confirmar Pago',
      `¿Deseas marcar el periodo "${currentPeriod.name}" como PAGADO en Supabase?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar Pago',
          onPress: async () => {
            try {
              await markPaidMutation.mutateAsync(currentPeriod.id);
              Alert.alert('Éxito', 'El periodo ha sido marcado como pagado exitosamente.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo actualizar el periodo.');
            }
          },
        },
      ]
    );
  };

  const handleCreatePeriod = async () => {
    if (!newName.trim() || !newStartDate.trim() || !newEndDate.trim()) {
      Alert.alert('Campos requeridos', 'Completa el nombre y las fechas del periodo.');
      return;
    }

    try {
      const created = await createPeriodMutation.mutateAsync({
        name: newName.trim(),
        start_date: newStartDate.trim(),
        end_date: newEndDate.trim(),
        period_type: newType,
      });
      setSelectedPeriodId(created.id);
      setShowNewModal(false);
      setNewName('');
      Alert.alert('Periodo Creado', 'Ahora puedes presionar "Generar / Recalcular" para liquidar la nómina.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo crear el periodo.');
    }
  };

  const statusInfo = currentPeriod
    ? getPayrollStatusInfo(currentPeriod.status)
    : null;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetchPeriods();
              refetchItems();
            }}
            tintColor="#1A56DB"
          />
        }
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1 mr-2">
            <Text className="text-2xl font-black text-slate-900 tracking-tight">
              Gestión de Nómina
            </Text>
            <Text className="text-xs text-slate-500">
              Liquidación conectada a Supabase • Ley Colombiana
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowNewModal(true)}
            className="flex-row items-center bg-blue-600 px-3.5 py-2.5 rounded-xl shadow-sm"
          >
            <Plus size={16} color="#FFFFFF" className="mr-1" />
            <Text className="text-xs font-bold text-white">Periodo</Text>
          </TouchableOpacity>
        </View>

        {/* Selector horizontal de periodos si hay más de 1 */}
        {periods.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
            contentContainerStyle={{ gap: 8 }}
          >
            {periods.map((p) => {
              const isSelected = p.id === currentPeriod?.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setSelectedPeriodId(p.id)}
                  className={`px-3.5 py-2 rounded-xl border ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isSelected ? 'text-white' : 'text-slate-700'
                    }`}
                  >
                    {p.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {loadingPeriods ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#1A56DB" />
          </View>
        ) : !currentPeriod ? (
          <Card className="p-6 items-center mb-4">
            <Text className="text-sm font-bold text-slate-800 mb-1">
              No hay periodos de nómina registrados
            </Text>
            <Text className="text-xs text-slate-500 text-center mb-4">
              Crea un nuevo periodo quincenal o mensual para calcular los desprendibles desde Supabase.
            </Text>
            <Button
              title="Crear Primer Periodo"
              variant="primary"
              size="sm"
              icon={<Plus size={15} color="#FFFFFF" />}
              onPress={() => setShowNewModal(true)}
            />
          </Card>
        ) : (
          <>
            {/* Detalle del Periodo Seleccionado */}
            <Card className="p-4 mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center flex-1 mr-2">
                  <Calendar size={18} color="#1A56DB" className="mr-2" />
                  <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>
                    {currentPeriod.name}
                  </Text>
                </View>
                {statusInfo && (
                  <Badge label={statusInfo.label} variant={statusInfo.badgeVariant} />
                )}
              </View>
              <Text className="text-xs text-slate-500 mb-3 capitalize">
                Rango: {currentPeriod.start_date} al {currentPeriod.end_date} •{' '}
                {currentPeriod.period_type}
              </Text>

              {/* Totales consolidados */}
              <View className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-3">
                <View className="flex-row justify-between mb-1.5">
                  <Text className="text-xs text-slate-500">Total Devengado</Text>
                  <Text className="text-xs font-semibold text-slate-800">
                    {formatCOP(currentPeriod.total_earned)}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-1.5">
                  <Text className="text-xs text-slate-500">
                    Deducciones (Salud + Pensión)
                  </Text>
                  <Text className="text-xs font-semibold text-rose-600">
                    - {formatCOP(currentPeriod.total_deductions)}
                  </Text>
                </View>
                <View className="border-t border-slate-200 pt-2 flex-row justify-between items-center">
                  <Text className="text-sm font-bold text-slate-900">
                    Neto Total a Pagar
                  </Text>
                  <Text className="text-base font-black text-emerald-700">
                    {formatCOP(currentPeriod.total_net)}
                  </Text>
                </View>
              </View>

              {/* Action buttons */}
              <View className="flex-row gap-2">
                {currentPeriod.status !== 'paid' && (
                  <Button
                    title="Generar / Recalcular"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    icon={<Play size={14} color="#1A56DB" />}
                    loading={calculateMutation.isPending}
                    onPress={handleGeneratePayroll}
                  />
                )}
                {currentPeriod.status === 'calculated' && (
                  <Button
                    title="Marcar Pagada"
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    icon={<CheckCircle2 size={14} color="#FFFFFF" />}
                    loading={markPaidMutation.isPending}
                    onPress={handleMarkAsPaid}
                  />
                )}
              </View>
            </Card>

            {/* Lista de Colaboradores en la Nómina (payroll_items reales) */}
            <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              Desprendibles Individuales ({items.length})
            </Text>

            {loadingItems ? (
              <ActivityIndicator size="small" color="#1A56DB" className="py-6" />
            ) : items.length === 0 ? (
              <Card className="p-6 items-center">
                <Text className="text-xs text-slate-500 text-center">
                  Aún no se han generado los desprendibles para este periodo. Presiona{' '}
                  <Text className="font-bold text-slate-700">"Generar / Recalcular"</Text>{' '}
                  para ejecutar la función RPC en Supabase.
                </Text>
              </Card>
            ) : (
              items.map((item) => {
                const emp = item.employees;
                return (
                  <Card key={item.id} className="p-3.5 mb-2.5">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-sm font-bold text-slate-900 flex-1 mr-2">
                        {emp
                          ? `${emp.first_name} ${emp.last_name}`
                          : 'Colaborador'}
                      </Text>
                      <Text className="text-sm font-bold text-emerald-700">
                        {formatCOP(item.net_pay)}
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between mb-1.5">
                      <Text className="text-xs text-slate-500">
                        {emp?.position || 'Obra'} • {item.days_worked} días
                      </Text>
                      {Number(item.overtime_pay) > 0 && (
                        <Text className="text-[11px] font-semibold text-blue-600">
                          +H.E: {formatCOP(item.overtime_pay)}
                        </Text>
                      )}
                    </View>
                    <View className="border-t border-slate-100 pt-1.5 flex-row items-center justify-between">
                      <Text className="text-[11px] text-slate-500">
                        Devengado: {formatCOP(item.total_earned)}
                      </Text>
                      <Text className="text-[11px] text-rose-600">
                        Deducciones: - {formatCOP(item.total_deductions)}
                      </Text>
                    </View>
                  </Card>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      {/* Modal para crear nuevo periodo de nómina */}
      <Modal
        visible={showNewModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNewModal(false)}
      >
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-slate-900">
                Nuevo Periodo de Nómina
              </Text>
              <TouchableOpacity onPress={() => setShowNewModal(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Input
              label="Nombre del Periodo *"
              placeholder="ej. Octubre 2026 - 2da Quincena"
              value={newName}
              onChangeText={setNewName}
            />

            <View className="flex-row gap-2">
              <View className="flex-1">
                <Input
                  label="Fecha Inicio (YYYY-MM-DD)"
                  placeholder="2026-10-16"
                  value={newStartDate}
                  onChangeText={setNewStartDate}
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Fecha Fin (YYYY-MM-DD)"
                  placeholder="2026-10-31"
                  value={newEndDate}
                  onChangeText={setNewEndDate}
                />
              </View>
            </View>

            <Text className="text-xs font-semibold text-slate-700 mb-2">
              Tipo de Periodo
            </Text>
            <View className="flex-row gap-2 mb-5">
              {(['quincenal', 'mensual'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setNewType(t)}
                  className={`flex-1 py-2.5 rounded-xl border items-center ${
                    newType === t
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold capitalize ${
                      newType === t ? 'text-white' : 'text-slate-700'
                    }`}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title="Crear Periodo en Supabase"
              variant="primary"
              size="lg"
              loading={createPeriodMutation.isPending}
              onPress={handleCreatePeriod}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
