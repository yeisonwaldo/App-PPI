import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Clock,
  UserCheck,
  UserX,
  AlertCircle,
  LogIn,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { addDays, subDays, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  useAttendanceByDate,
  useUpsertAttendance,
  useBulkAttendance,
} from '@/features/attendance/useAttendance';
import type { AttendanceStatus } from '@/types/database';

export default function AttendanceScreen() {
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split('T')[0]!
  );

  const {
    data: attendanceRows = [],
    isLoading,
    refetch,
    isRefetching,
  } = useAttendanceByDate(selectedDate);

  const upsertMutation = useUpsertAttendance();
  const bulkMutation = useBulkAttendance();

  const metrics = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let totalHours = 0;

    for (const row of attendanceRows) {
      const st = row.record?.status;
      if (st === 'present') present++;
      else if (st === 'late') late++;
      else if (st === 'absent') absent++;

      if (row.record?.hours_worked) {
        totalHours += Number(row.record.hours_worked);
      }
    }

    return {
      present,
      absent,
      late,
      totalHours: Math.round(totalHours * 10) / 10,
    };
  }, [attendanceRows]);

  const handleChangeDay = (delta: number) => {
    const current = parseISO(selectedDate);
    const next = delta > 0 ? addDays(current, delta) : subDays(current, Math.abs(delta));
    setSelectedDate(next.toISOString().split('T')[0]!);
  };

  const handleRegisterQuick = (type: 'in' | 'out') => {
    if (attendanceRows.length === 0) return;

    const nowTime = new Date().toTimeString().split(' ')[0]!; // HH:MM:SS

    Alert.alert(
      type === 'in' ? 'Registrar Ingreso Masivo' : 'Registrar Salida Masiva',
      `¿Deseas guardar la hora (${nowTime.slice(0, 5)}) en Supabase para los ${attendanceRows.length} colaboradores activos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              const rows = attendanceRows.map(({ employee, record }) => ({
                employee_id: employee.id,
                work_date: selectedDate,
                check_in: type === 'in' ? nowTime : (record?.check_in ?? '07:00:00'),
                check_out: type === 'out' ? nowTime : (record?.check_out ?? null),
                status: (record?.status ?? 'present') as AttendanceStatus,
              }));

              await bulkMutation.mutateAsync({ rows });
              Alert.alert('Éxito', 'Registros sincronizados en Supabase.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo guardar la asistencia.');
            }
          },
        },
      ]
    );
  };

  const handleSingleStatus = async (
    employeeId: string,
    status: AttendanceStatus,
    existingCheckIn?: string | null,
    existingCheckOut?: string | null
  ) => {
    try {
      const nowTime = new Date().toTimeString().split(' ')[0]!;
      await upsertMutation.mutateAsync({
        employee_id: employeeId,
        work_date: selectedDate,
        status,
        check_in:
          status === 'absent'
            ? null
            : existingCheckIn || nowTime,
        check_out: status === 'absent' ? null : existingCheckOut ?? null,
      });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo actualizar la asistencia.');
    }
  };

  const handleSingleCheckOut = async (
    employeeId: string,
    existingCheckIn?: string | null,
    existingStatus?: AttendanceStatus
  ) => {
    try {
      const nowTime = new Date().toTimeString().split(' ')[0]!;
      await upsertMutation.mutateAsync({
        employee_id: employeeId,
        work_date: selectedDate,
        status: existingStatus || 'present',
        check_in: existingCheckIn || '07:00:00',
        check_out: nowTime,
      });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo registrar la salida.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
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
          <Text className="text-2xl font-black text-slate-900 tracking-tight">
            Control de Asistencia
          </Text>
          <Text className="text-xs text-slate-500">
            Registro diario en tiempo real conectado a Supabase
          </Text>
        </View>

        {/* Selector de Fecha */}
        <Card className="p-3 mb-4 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => handleChangeDay(-1)}
            className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center"
          >
            <ChevronLeft size={18} color="#334155" />
          </TouchableOpacity>

          <View className="items-center">
            <Text className="text-sm font-bold text-slate-900 capitalize">
              {format(parseISO(selectedDate), "EEEE, d 'de' MMMM", { locale: es })}
            </Text>
            <Text className="text-[11px] text-slate-400">{selectedDate}</Text>
          </View>

          <TouchableOpacity
            onPress={() => handleChangeDay(1)}
            className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center"
          >
            <ChevronRight size={18} color="#334155" />
          </TouchableOpacity>
        </Card>

        {/* Metrics Grid */}
        <View className="flex-row gap-2 mb-4">
          <View className="flex-1 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm items-center">
            <UserCheck size={20} color="#059669" />
            <Text className="text-lg font-bold text-slate-900 mt-1">
              {metrics.present}
            </Text>
            <Text className="text-[10px] text-slate-500">Presentes</Text>
          </View>

          <View className="flex-1 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm items-center">
            <UserX size={20} color="#E11D48" />
            <Text className="text-lg font-bold text-slate-900 mt-1">
              {metrics.absent}
            </Text>
            <Text className="text-[10px] text-slate-500">Ausentes</Text>
          </View>

          <View className="flex-1 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm items-center">
            <AlertCircle size={20} color="#D97706" />
            <Text className="text-lg font-bold text-slate-900 mt-1">
              {metrics.late}
            </Text>
            <Text className="text-[10px] text-slate-500">Tardanzas</Text>
          </View>

          <View className="flex-1 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm items-center">
            <Clock size={20} color="#1A56DB" />
            <Text className="text-lg font-bold text-slate-900 mt-1">
              {metrics.totalHours}h
            </Text>
            <Text className="text-[10px] text-slate-500">Horas Tot.</Text>
          </View>
        </View>

        {/* Quick check-in/out actions */}
        <View className="flex-row gap-3 mb-5">
          <Button
            title="Ingreso Masivo"
            variant="primary"
            size="sm"
            className="flex-1"
            loading={bulkMutation.isPending}
            icon={<LogIn size={16} color="#FFFFFF" />}
            onPress={() => handleRegisterQuick('in')}
          />
          <Button
            title="Salida Masiva"
            variant="secondary"
            size="sm"
            className="flex-1"
            loading={bulkMutation.isPending}
            icon={<LogOut size={16} color="#FFFFFF" />}
            onPress={() => handleRegisterQuick('out')}
          />
        </View>

        {/* List of daily attendance */}
        <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
          Colaboradores ({attendanceRows.length})
        </Text>

        {isLoading ? (
          <ActivityIndicator size="large" color="#1A56DB" className="py-10" />
        ) : attendanceRows.length === 0 ? (
          <Card className="p-6 items-center">
            <Text className="text-xs text-slate-500">
              No hay colaboradores activos registrados en la empresa.
            </Text>
          </Card>
        ) : (
          attendanceRows.map(({ employee, record }) => {
            const status = record?.status;
            return (
              <Card key={employee.id} className="p-3.5 mb-2.5">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-1 mr-2">
                    <Text className="text-sm font-bold text-slate-900">
                      {employee.first_name} {employee.last_name}
                    </Text>
                    <Text className="text-xs text-slate-500">{employee.position}</Text>
                  </View>
                  <Badge
                    label={
                      status === 'present'
                        ? 'Presente'
                        : status === 'late'
                        ? 'Tardanza'
                        : status === 'absent'
                        ? 'Ausente'
                        : status === 'excused'
                        ? 'Excusado'
                        : 'Sin marcar'
                    }
                    variant={
                      status === 'present'
                        ? 'success'
                        : status === 'late'
                        ? 'warning'
                        : status === 'absent'
                        ? 'danger'
                        : 'neutral'
                    }
                    size="sm"
                  />
                </View>

                <View className="flex-row items-center justify-between border-t border-slate-100 pt-2 mb-2">
                  <Text className="text-[11px] text-slate-600">
                    Entrada:{' '}
                    <Text className="font-semibold">
                      {record?.check_in ? record.check_in.slice(0, 5) : 'Sin registro'}
                    </Text>
                  </Text>
                  <Text className="text-[11px] text-slate-600">
                    Salida:{' '}
                    <Text className="font-semibold">
                      {record?.check_out ? record.check_out.slice(0, 5) : 'Pendiente'}
                    </Text>
                  </Text>
                  <Text className="text-[11px] font-bold text-blue-700">
                    {record?.hours_worked ? `${Number(record.hours_worked).toFixed(1)} hrs` : '0 hrs'}
                  </Text>
                </View>

                {/* Botones rápidos por colaborador */}
                <View className="flex-row gap-1.5 pt-1">
                  <TouchableOpacity
                    onPress={() =>
                      handleSingleStatus(
                        employee.id,
                        'present',
                        record?.check_in,
                        record?.check_out
                      )
                    }
                    className={`flex-1 py-1.5 rounded-lg items-center border ${
                      status === 'present'
                        ? 'bg-emerald-600 border-emerald-600'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-bold ${
                        status === 'present' ? 'text-white' : 'text-slate-700'
                      }`}
                    >
                      Presente
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      handleSingleStatus(
                        employee.id,
                        'late',
                        record?.check_in,
                        record?.check_out
                      )
                    }
                    className={`flex-1 py-1.5 rounded-lg items-center border ${
                      status === 'late'
                        ? 'bg-amber-500 border-amber-500'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-bold ${
                        status === 'late' ? 'text-white' : 'text-slate-700'
                      }`}
                    >
                      Tarde
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      handleSingleStatus(employee.id, 'absent', null, null)
                    }
                    className={`flex-1 py-1.5 rounded-lg items-center border ${
                      status === 'absent'
                        ? 'bg-rose-600 border-rose-600'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-bold ${
                        status === 'absent' ? 'text-white' : 'text-slate-700'
                      }`}
                    >
                      Ausente
                    </Text>
                  </TouchableOpacity>

                  {status && status !== 'absent' && !record?.check_out && (
                    <TouchableOpacity
                      onPress={() =>
                        handleSingleCheckOut(employee.id, record?.check_in, status)
                      }
                      className="flex-1 py-1.5 rounded-lg items-center bg-blue-50 border border-blue-200"
                    >
                      <Text className="text-[11px] font-bold text-blue-700">
                        Salida
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
