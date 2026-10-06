import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Banknote,
  Calendar,
  CheckCircle2,
  Play,
  ArrowRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MOCK_PAYROLL_PERIOD, MOCK_EMPLOYEES } from '@/lib/mockData';
import { formatCOP, getPayrollStatusInfo } from '@/lib/formatters';

export default function PayrollScreen() {
  const [period, setPeriod] = useState(MOCK_PAYROLL_PERIOD);
  const [isProcessing, setIsProcessing] = useState(false);

  const statusInfo = getPayrollStatusInfo(period.status);

  const handleGeneratePayroll = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setPeriod((prev) => ({
        ...prev,
        status: 'calculated',
        total_earned: 42850000,
        total_deductions: 3428000,
        total_net: 39422000,
      }));
      setIsProcessing(false);
      Alert.alert(
        'Nómina Calculada',
        'Se aplicaron los cálculos de ley (salario base, auxilio de transporte y deducciones de salud y pensión del 4%).'
      );
    }, 800);
  };

  const handleMarkAsPaid = () => {
    Alert.alert(
      'Confirmar Pago',
      '¿Deseas marcar este periodo de nómina como PAGADO? Se generará el registro contable.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar Pago',
          onPress: () => {
            setPeriod((prev) => ({
              ...prev,
              status: 'paid',
              paid_at: new Date().toISOString(),
            }));
            Alert.alert('Éxito', 'El periodo ha sido marcado como pagado exitosamente.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-4">
          <Text className="text-2xl font-black text-slate-900 tracking-tight">
            Gestión de Nómina
          </Text>
          <Text className="text-xs text-slate-500">
            Sector Construcción • Ley Laboral Colombiana
          </Text>
        </View>

        {/* Selector de Periodo */}
        <Card className="p-4 mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <Calendar size={18} color="#1A56DB" className="mr-2" />
              <Text className="text-sm font-bold text-slate-900">{period.name}</Text>
            </View>
            <Badge label={statusInfo.label} variant={statusInfo.badgeVariant} />
          </View>
          <Text className="text-xs text-slate-500 mb-3">
            Rango: {period.start_date} al {period.end_date} • Quincenal
          </Text>

          {/* Totales consolidados */}
          <View className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-3">
            <View className="flex-row justify-between mb-1.5">
              <Text className="text-xs text-slate-500">Total Devengado</Text>
              <Text className="text-xs font-semibold text-slate-800">
                {formatCOP(period.total_earned)}
              </Text>
            </View>
            <View className="flex-row justify-between mb-1.5">
              <Text className="text-xs text-slate-500">Deducciones (Salud + Pensión)</Text>
              <Text className="text-xs font-semibold text-rose-600">
                - {formatCOP(period.total_deductions)}
              </Text>
            </View>
            <View className="border-t border-slate-200 pt-2 flex-row justify-between items-center">
              <Text className="text-sm font-bold text-slate-900">Neto Total a Pagar</Text>
              <Text className="text-base font-black text-emerald-700">
                {formatCOP(period.total_net)}
              </Text>
            </View>
          </View>

          {/* Action buttons */}
          <View className="flex-row gap-2">
            <Button
              title="Generar / Recalcular"
              variant="outline"
              size="sm"
              className="flex-1"
              icon={<Play size={14} color="#1A56DB" />}
              loading={isProcessing}
              onPress={handleGeneratePayroll}
            />
            {period.status !== 'paid' && (
              <Button
                title="Marcar Pagada"
                variant="primary"
                size="sm"
                className="flex-1"
                icon={<CheckCircle2 size={14} color="#FFFFFF" />}
                onPress={handleMarkAsPaid}
              />
            )}
          </View>
        </Card>

        {/* Lista de Colaboradores en la Nómina */}
        <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
          Desprendibles Individuales ({MOCK_EMPLOYEES.length})
        </Text>

        {MOCK_EMPLOYEES.map((emp) => {
          const base = emp.base_salary / 2;
          const transport = emp.base_salary <= 2600000 ? 162000 / 2 : 0;
          const deductions = (emp.base_salary * 0.08) / 2;
          const net = base + transport - deductions;

          return (
            <Card key={emp.id} className="p-3.5 mb-2.5">
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-sm font-bold text-slate-900">
                  {emp.first_name} {emp.last_name}
                </Text>
                <Text className="text-sm font-bold text-emerald-700">
                  {formatCOP(net)}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-slate-500">{emp.position}</Text>
                <Text className="text-[11px] text-slate-400">
                  Dev: {formatCOP(base + transport)} | Ded: {formatCOP(deductions)}
                </Text>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
