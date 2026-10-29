import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  LogOut,
  Save,
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import {
  useCompanySettings,
  useUpdateCompanySettings,
} from '@/features/settings/useSettings';
import type { PayrollSettings } from '@/types/database';

const DEFAULT_PAYROLL_SETTINGS: PayrollSettings = {
  salario_minimo: 1300000,
  auxilio_transporte: 162000,
  pct_salud_empleado: 4,
  pct_pension_empleado: 4,
  pct_salud_empleador: 8.5,
  pct_pension_empleador: 12,
  pct_arl: 0.522,
  pct_hora_extra_diurna: 25,
  pct_hora_extra_nocturna: 75,
  pct_recargo_nocturno: 35,
  pct_hora_extra_dominical_festivo: 100,
  horas_jornada_diaria: 8,
  dias_laborales_mes: 30,
};

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuthStore();
  const { data: companyData, isLoading } = useCompanySettings();
  const updateMutation = useUpdateCompanySettings();

  const [name, setName] = useState('');
  const [nit, setNit] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [payrollSettings, setPayrollSettings] = useState<PayrollSettings>(
    DEFAULT_PAYROLL_SETTINGS
  );

  useEffect(() => {
    if (companyData) {
      setName(companyData.name || '');
      setNit(companyData.nit || '');
      setCity(companyData.city || '');
      setAddress(companyData.address || '');
      setEmail(companyData.email || '');
      if (companyData.payroll_settings) {
        setPayrollSettings({
          ...DEFAULT_PAYROLL_SETTINGS,
          ...companyData.payroll_settings,
        });
      }
    }
  }, [companyData]);

  const handleSaveSettings = async () => {
    try {
      await updateMutation.mutateAsync({
        name: name.trim(),
        nit: nit.trim(),
        city: city.trim() || null,
        address: address.trim() || null,
        email: email.trim() || null,
        payroll_settings: payrollSettings,
      });
      Alert.alert(
        'Configuración Guardada',
        'Los datos corporativos y parámetros de nómina se actualizaron en Supabase.'
      );
    } catch (err: any) {
      Alert.alert(
        'Error al Guardar',
        err.message || 'Verifica que tu usuario tenga rol de Administrador.'
      );
    }
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

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#1A56DB" />
      </View>
    );
  }

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
          Parámetros legales de nómina y datos corporativos en Supabase
        </Text>
      </View>

      {/* Empresa */}
      <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
        Datos de la Empresa
      </Text>
      <Card className="p-4 mb-5">
        <Input
          label="Razón Social"
          value={name}
          onChangeText={setName}
        />
        <Input
          label="NIT"
          value={nit}
          onChangeText={setNit}
        />
        <Input
          label="Ciudad"
          value={city}
          onChangeText={setCity}
        />
        <Input
          label="Dirección"
          value={address}
          onChangeText={setAddress}
        />
        <Input
          label="Correo Corporativo"
          value={email}
          onChangeText={setEmail}
        />
      </Card>

      {/* Parámetros de nómina configurables */}
      <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
        Parámetros de Nómina (companies.payroll_settings)
      </Text>
      <Card className="p-4 mb-5">
        <Input
          label="Salario Mínimo Legal Mensual (COP)"
          value={String(payrollSettings.salario_minimo)}
          keyboardType="numeric"
          onChangeText={(val) =>
            setPayrollSettings({
              ...payrollSettings,
              salario_minimo: Number(val) || 0,
            })
          }
        />
        <Input
          label="Auxilio de Transporte (COP)"
          value={String(payrollSettings.auxilio_transporte)}
          keyboardType="numeric"
          onChangeText={(val) =>
            setPayrollSettings({
              ...payrollSettings,
              auxilio_transporte: Number(val) || 0,
            })
          }
        />
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Input
              label="% Salud Empleado"
              value={String(payrollSettings.pct_salud_empleado)}
              keyboardType="numeric"
              onChangeText={(val) =>
                setPayrollSettings({
                  ...payrollSettings,
                  pct_salud_empleado: Number(val) || 0,
                })
              }
            />
          </View>
          <View className="flex-1">
            <Input
              label="% Pensión Empleado"
              value={String(payrollSettings.pct_pension_empleado)}
              keyboardType="numeric"
              onChangeText={(val) =>
                setPayrollSettings({
                  ...payrollSettings,
                  pct_pension_empleado: Number(val) || 0,
                })
              }
            />
          </View>
        </View>

        <View className="flex-row gap-2">
          <View className="flex-1">
            <Input
              label="% Hora Extra Diurna"
              value={String(payrollSettings.pct_hora_extra_diurna)}
              keyboardType="numeric"
              onChangeText={(val) =>
                setPayrollSettings({
                  ...payrollSettings,
                  pct_hora_extra_diurna: Number(val) || 0,
                })
              }
            />
          </View>
          <View className="flex-1">
            <Input
              label="% Hora Extra Nocturna"
              value={String(payrollSettings.pct_hora_extra_nocturna)}
              keyboardType="numeric"
              onChangeText={(val) =>
                setPayrollSettings({
                  ...payrollSettings,
                  pct_hora_extra_nocturna: Number(val) || 0,
                })
              }
            />
          </View>
        </View>
      </Card>

      {/* Guardar cambios */}
      <Button
        title="Guardar Cambios en Supabase"
        variant="primary"
        size="lg"
        icon={<Save size={18} color="#FFFFFF" />}
        loading={updateMutation.isPending}
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
