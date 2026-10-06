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
  Clock,
  UserCheck,
  UserX,
  AlertCircle,
  LogIn,
  LogOut,
  Calendar,
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MOCK_EMPLOYEES, MOCK_ATTENDANCE_SUMMARY } from '@/lib/mockData';

export default function AttendanceScreen() {
  const [attendanceList, setAttendanceList] = useState(
    MOCK_EMPLOYEES.map((e, idx) => ({
      id: `att-${e.id}`,
      employee: e,
      check_in: idx === 2 ? null : idx === 3 ? '07:25 AM' : '06:55 AM',
      check_out: idx === 2 ? null : '05:00 PM',
      status: idx === 2 ? 'absent' : idx === 3 ? 'late' : 'present',
      hours: idx === 2 ? 0 : 9.5,
    }))
  );

  const handleRegisterQuick = (type: 'in' | 'out') => {
    Alert.alert(
      type === 'in' ? 'Registrar Ingreso Masivo' : 'Registrar Salida Masiva',
      '¿Deseas marcar la hora actual para los colaboradores seleccionados en obra?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setAttendanceList((prev) =>
              prev.map((item) =>
                type === 'in'
                  ? { ...item, check_in: timeStr, status: 'present' }
                  : { ...item, check_out: timeStr }
              )
            );
            Alert.alert('Éxito', `Registrado a las ${timeStr}`);
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
        <View className="mb-4">
          <Text className="text-2xl font-black text-slate-900 tracking-tight">
            Control de Asistencia
          </Text>
          <Text className="text-xs text-slate-500">
            Registro diario en obra • Jornada ordinaria y horas extra
          </Text>
        </View>

        {/* Metrics Grid */}
        <View className="flex-row gap-2 mb-4">
          <View className="flex-1 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm items-center">
            <UserCheck size={20} color="#059669" />
            <Text className="text-lg font-bold text-slate-900 mt-1">
              {MOCK_ATTENDANCE_SUMMARY.present}
            </Text>
            <Text className="text-[10px] text-slate-500">Presentes</Text>
          </View>

          <View className="flex-1 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm items-center">
            <UserX size={20} color="#E11D48" />
            <Text className="text-lg font-bold text-slate-900 mt-1">
              {MOCK_ATTENDANCE_SUMMARY.absent}
            </Text>
            <Text className="text-[10px] text-slate-500">Ausentes</Text>
          </View>

          <View className="flex-1 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm items-center">
            <AlertCircle size={20} color="#D97706" />
            <Text className="text-lg font-bold text-slate-900 mt-1">
              {MOCK_ATTENDANCE_SUMMARY.late}
            </Text>
            <Text className="text-[10px] text-slate-500">Tardanzas</Text>
          </View>

          <View className="flex-1 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm items-center">
            <Clock size={20} color="#1A56DB" />
            <Text className="text-lg font-bold text-slate-900 mt-1">
              {MOCK_ATTENDANCE_SUMMARY.totalHoursToday}h
            </Text>
            <Text className="text-[10px] text-slate-500">Horas Tot.</Text>
          </View>
        </View>

        {/* Quick check-in/out actions */}
        <View className="flex-row gap-3 mb-5">
          <Button
            title="Marcar Ingreso"
            variant="primary"
            size="sm"
            className="flex-1"
            icon={<LogIn size={16} color="#FFFFFF" />}
            onPress={() => handleRegisterQuick('in')}
          />
          <Button
            title="Marcar Salida"
            variant="secondary"
            size="sm"
            className="flex-1"
            icon={<LogOut size={16} color="#FFFFFF" />}
            onPress={() => handleRegisterQuick('out')}
          />
        </View>

        {/* List of daily attendance */}
        <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
          Lista de Colaboradores Hoy
        </Text>

        {attendanceList.map((item) => (
          <Card key={item.id} className="p-3.5 mb-2.5">
            <View className="flex-row items-center justify-between mb-1.5">
              <View className="flex-1 mr-2">
                <Text className="text-sm font-bold text-slate-900">
                  {item.employee.first_name} {item.employee.last_name}
                </Text>
                <Text className="text-xs text-slate-500">{item.employee.position}</Text>
              </View>
              <Badge
                label={
                  item.status === 'present'
                    ? 'Presente'
                    : item.status === 'late'
                    ? 'Tardanza'
                    : 'Ausente'
                }
                variant={
                  item.status === 'present'
                    ? 'success'
                    : item.status === 'late'
                    ? 'warning'
                    : 'danger'
                }
                size="sm"
              />
            </View>

            <View className="flex-row items-center justify-between border-t border-slate-100 pt-2 text-xs">
              <Text className="text-[11px] text-slate-600">
                Entrada: <Text className="font-semibold">{item.check_in || 'Sin registro'}</Text>
              </Text>
              <Text className="text-[11px] text-slate-600">
                Salida: <Text className="font-semibold">{item.check_out || 'Pendiente'}</Text>
              </Text>
              <Text className="text-[11px] font-bold text-blue-700">
                {item.hours} hrs
              </Text>
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
