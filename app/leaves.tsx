import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Plus,
  Clock,
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface MockLeave {
  id: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

const INITIAL_LEAVES: MockLeave[] = [
  {
    id: 'l1',
    employeeName: 'Carlos Andrés Restrepo Montoya',
    leaveType: 'Incapacidad Médica (EPS)',
    startDate: '2026-10-08',
    endDate: '2026-10-10',
    days: 3,
    reason: 'Reposo médico por lumbalgia certificada por EPS Sura.',
    status: 'pending',
  },
  {
    id: 'l2',
    employeeName: 'Álvaro José Cardona Silva',
    leaveType: 'Vacaciones',
    startDate: '2026-10-01',
    endDate: '2026-10-15',
    days: 15,
    reason: 'Periodo reglamentario de vacaciones acumuladas.',
    status: 'approved',
  },
  {
    id: 'l3',
    employeeName: 'Jhon Jairo Gómez Henao',
    leaveType: 'Permiso Personal',
    startDate: '2026-09-28',
    endDate: '2026-09-28',
    days: 1,
    reason: 'Trámite notarial y bancario urgente.',
    status: 'approved',
  },
];

export default function LeavesScreen() {
  const [leaves, setLeaves] = useState<MockLeave[]>(INITIAL_LEAVES);

  const handleUpdateStatus = (id: string, newStatus: 'approved' | 'rejected') => {
    setLeaves((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
    );
    Alert.alert(
      newStatus === 'approved' ? 'Solicitud Aprobada' : 'Solicitud Rechazada',
      'El estado ha sido actualizado y se notificará al colaborador.'
    );
  };

  const handleNewRequest = () => {
    Alert.alert(
      'Nueva Solicitud',
      'Ingresa el tipo de permiso (incapacidad médica, permiso remunerado, luto o vacaciones).',
      [
        {
          text: 'Crear Permiso de Prueba',
          onPress: () => {
            const newReq: MockLeave = {
              id: `l-${Date.now()}`,
              employeeName: 'Diana Marcela Valencia Ríos',
              leaveType: 'Permiso Capacitación SST',
              startDate: '2026-10-12',
              endDate: '2026-10-12',
              days: 1,
              reason: 'Asistencia al Congreso Nacional de Seguridad en la Construcción.',
              status: 'pending',
            };
            setLeaves([newReq, ...leaves]);
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
    >
      <View className="mb-4">
        <Text className="text-xl font-bold text-slate-900">
          Permisos y Licencias
        </Text>
        <Text className="text-xs text-slate-500">
          Gestión de incapacidades, permisos remunerados y vacaciones
        </Text>
      </View>

      <Button
        title="Crear Solicitud de Permiso"
        variant="primary"
        icon={<Plus size={16} color="#FFFFFF" />}
        onPress={handleNewRequest}
        className="mb-4"
      />

      {leaves.map((item) => (
        <Card key={item.id} className="p-4 mb-3">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1 mr-2">
              <Text className="text-sm font-bold text-slate-900">
                {item.employeeName}
              </Text>
              <Text className="text-xs font-semibold text-blue-700 mt-0.5">
                {item.leaveType} • {item.days} {item.days === 1 ? 'día' : 'días'}
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
            Periodo: {item.startDate} hasta {item.endDate}
          </Text>

          {item.status === 'pending' && (
            <View className="flex-row gap-2 border-t border-slate-100 pt-2.5">
              <Button
                title="Aprobar"
                variant="primary"
                size="sm"
                className="flex-1 bg-emerald-600"
                icon={<CheckCircle2 size={14} color="#FFFFFF" />}
                onPress={() => handleUpdateStatus(item.id, 'approved')}
              />
              <Button
                title="Rechazar"
                variant="danger"
                size="sm"
                className="flex-1"
                icon={<XCircle size={14} color="#FFFFFF" />}
                onPress={() => handleUpdateStatus(item.id, 'rejected')}
              />
            </View>
          )}
        </Card>
      ))}
    </ScrollView>
  );
}
