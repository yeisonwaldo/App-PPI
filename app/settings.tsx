import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Building2,
  Sliders,
  User,
  LogOut,
  Save,
  CheckCircle2,
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { MOCK_COMPANY } from '@/lib/mockData';
import { formatCOP } from '@/lib/formatters';

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuthStore();
  const [company, setCompany] = useState(MOCK_COMPANY);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      Alert.alert(
        'Configuración Guardada',
        'Los parámetros de nómina y los datos corporativos se actualizaron correctamente.'
      );
    }, 600);
  };

  const handleSignOut = () => {
    Alert.alert('Cerrar Sesión', '¿Deseas salir del sistema?', [
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

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
    >
      <View className="mb-4">
        <Text className="text-xl font-bold text-slate-900">
          Configuración del Sistema
        </Text>
        <Text className="text-xs text-slate-500">
          Parámetros legales de nómina y datos corporativos
        </Text>
      </View>

      {/* Empresa */}
      <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
        Datos de la Empresa
      </Text>
      <Card className="p-4 mb-5">
        <Input
          label="Razón Social"
          value={company.name}
          onChangeText={(val) => setCompany({ ...company, name: val })}
        />
        <Input
          label="NIT"
          value={company.nit}
          onChangeText={(val) => setCompany({ ...company, nit: val })}
        />
        <Input
          label="Ciudad"
          value={company.city || ''}
          onChangeText={(val) => setCompany({ ...company, city: val })}
        />
        <Input
          label="Dirección"
          value={company.address || ''}
          onChangeText={(val) => setCompany({ ...company, address: val })}
        />
        <Input
          label="Correo Corporativo"
          value={company.email || ''}
          onChangeText={(val) => setCompany({ ...company, email: val })}
        />
      </Card>

      {/* Parámetros de nómina configurables (NO hardcodeados) */}
      <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
        Parámetros de Nómina (Configurables)
      </Text>
      <Card className="p-4 mb-5">
        <Input
          label="Salario Mínimo Legal Mensual (COP)"
          value={String(company.payroll_settings.salario_minimo)}
          keyboardType="numeric"
          onChangeText={(val) =>
            setCompany({
              ...company,
              payroll_settings: {
                ...company.payroll_settings,
                salario_minimo: Number(val) || 0,
              },
            })
          }
        />
        <Input
          label="Auxilio de Transporte (COP)"
          value={String(company.payroll_settings.auxilio_transporte)}
          keyboardType="numeric"
          onChangeText={(val) =>
            setCompany({
              ...company,
              payroll_settings: {
                ...company.payroll_settings,
                auxilio_transporte: Number(val) || 0,
              },
            })
          }
        />
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Input
              label="% Salud Empleado"
              value={String(company.payroll_settings.pct_salud_empleado)}
              keyboardType="numeric"
              onChangeText={(val) =>
                setCompany({
                  ...company,
                  payroll_settings: {
                    ...company.payroll_settings,
                    pct_salud_empleado: Number(val) || 0,
                  },
                })
              }
            />
          </View>
          <View className="flex-1">
            <Input
              label="% Pensión Empleado"
              value={String(company.payroll_settings.pct_pension_empleado)}
              keyboardType="numeric"
              onChangeText={(val) =>
                setCompany({
                  ...company,
                  payroll_settings: {
                    ...company.payroll_settings,
                    pct_pension_empleado: Number(val) || 0,
                  },
                })
              }
            />
          </View>
        </View>

        <View className="flex-row gap-2">
          <View className="flex-1">
            <Input
              label="% Hora Extra Diurna"
              value={String(company.payroll_settings.pct_hora_extra_diurna)}
              keyboardType="numeric"
              onChangeText={(val) =>
                setCompany({
                  ...company,
                  payroll_settings: {
                    ...company.payroll_settings,
                    pct_hora_extra_diurna: Number(val) || 0,
                  },
                })
              }
            />
          </View>
          <View className="flex-1">
            <Input
              label="% Hora Extra Nocturna"
              value={String(company.payroll_settings.pct_hora_extra_nocturna)}
              keyboardType="numeric"
              onChangeText={(val) =>
                setCompany({
                  ...company,
                  payroll_settings: {
                    ...company.payroll_settings,
                    pct_hora_extra_nocturna: Number(val) || 0,
                  },
                })
              }
            />
          </View>
        </View>
      </Card>

      {/* Guardar cambios */}
      <Button
        title="Guardar Cambios"
        variant="primary"
        size="lg"
        icon={<Save size={18} color="#FFFFFF" />}
        loading={isSaving}
        onPress={handleSaveSettings}
        className="mb-6"
      />

      {/* Cerrar Sesión */}
      <TouchableOpacity
        onPress={handleSignOut}
        className="flex-row items-center justify-center p-3.5 bg-rose-50 border border-rose-200 rounded-2xl"
      >
        <LogOut size={16} color="#E11D48" className="mr-2" />
        <Text className="text-sm font-bold text-rose-700">Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
