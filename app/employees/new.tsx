import React from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCreateEmployee } from '@/features/employees/useEmployees';

const employeeSchema = z.object({
  first_name: z.string().min(2, 'El nombre es obligatorio'),
  last_name: z.string().min(2, 'Los apellidos son obligatorios'),
  document_type: z.enum(['CC', 'CE', 'NIT', 'PA', 'TI']),
  document_number: z.string().min(6, 'Número de documento inválido'),
  email: z.string().email('Correo inválido').optional().or(z.literal('')),
  phone: z.string().min(7, 'Teléfono debe tener al menos 7 dígitos').optional().or(z.literal('')),
  position: z.string().min(2, 'El cargo es obligatorio'),
  department: z.string().min(2, 'El departamento es obligatorio'),
  base_salary: z.coerce.number().min(1300000, 'El salario base debe ser mínimo $ 1.300.000 COP'),
  hire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha YYYY-MM-DD requerido'),
  contract_type: z.enum(['indefinido', 'fijo', 'obra_labor', 'prestacion_servicios']),
  eps: z.string().min(2, 'La EPS es obligatoria'),
  pension_fund: z.string().min(2, 'El fondo de pensión es obligatorio'),
  arl: z.string().min(2, 'La ARL es obligatoria'),
  cesantias_fund: z.string().optional().or(z.literal('')),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export default function NewEmployeeScreen() {
  const router = useRouter();
  const createEmployeeMutation = useCreateEmployee();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      document_type: 'CC',
      document_number: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      position: '',
      department: 'Construcción Civil',
      base_salary: 2000000,
      hire_date: new Date().toISOString().split('T')[0],
      contract_type: 'obra_labor',
      eps: 'Sura EPS',
      pension_fund: 'Protección',
      arl: 'Sura ARL',
      cesantias_fund: 'Protección',
    },
  });

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      await createEmployeeMutation.mutateAsync({
        ...data,
        profile_id: null,
        project_id: null,
        termination_date: null,
        status: 'active',
        email: data.email || null,
        phone: data.phone || null,
        cesantias_fund: data.cesantias_fund || null,
      });

      Alert.alert('Éxito', 'Colaborador registrado correctamente.', [
        { text: 'Aceptar', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo guardar el colaborador.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-slate-50"
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-sm text-slate-500 mb-4">
          Ingresa la información básica y laboral del nuevo colaborador para la nómina y seguridad social.
        </Text>

        {/* Sección: Identificación */}
        <Text className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
          1. Identificación y Contacto
        </Text>
        <View className="bg-white rounded-2xl p-4 border border-slate-100 mb-4 shadow-sm">
          <Controller
            control={control}
            name="first_name"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Nombres *"
                placeholder="ej. Juan Carlos"
                value={value}
                onChangeText={onChange}
                error={errors.first_name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="last_name"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Apellidos *"
                placeholder="ej. Pérez Gómez"
                value={value}
                onChangeText={onChange}
                error={errors.last_name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="document_number"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Cédula / Documento (CC) *"
                placeholder="ej. 1018456789"
                keyboardType="numeric"
                value={value}
                onChangeText={onChange}
                error={errors.document_number?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Teléfono Celular"
                placeholder="ej. 3124567890"
                keyboardType="phone-pad"
                value={value || ''}
                onChangeText={onChange}
                error={errors.phone?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Correo Electrónico"
                placeholder="ej. juan.perez@empresa.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={value || ''}
                onChangeText={onChange}
                error={errors.email?.message}
              />
            )}
          />
        </View>

        {/* Sección: Información Laboral */}
        <Text className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
          2. Datos Laborales y Salario
        </Text>
        <View className="bg-white rounded-2xl p-4 border border-slate-100 mb-4 shadow-sm">
          <Controller
            control={control}
            name="position"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Cargo *"
                placeholder="ej. Oficial de Estructuras"
                value={value}
                onChangeText={onChange}
                error={errors.position?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="department"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Departamento / Área *"
                placeholder="ej. Construcción Civil"
                value={value}
                onChangeText={onChange}
                error={errors.department?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="base_salary"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Salario Base Mensual (COP) *"
                placeholder="ej. 2000000"
                keyboardType="numeric"
                value={value ? String(value) : ''}
                onChangeText={onChange}
                error={errors.base_salary?.message}
                helperText="Mínimo legal en Colombia: $ 1.300.000 COP"
              />
            )}
          />

          <Controller
            control={control}
            name="hire_date"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Fecha de Contratación (YYYY-MM-DD) *"
                placeholder="2026-10-01"
                value={value}
                onChangeText={onChange}
                error={errors.hire_date?.message}
              />
            )}
          />
        </View>

        {/* Sección: Seguridad Social */}
        <Text className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
          3. Seguridad Social (Colombia)
        </Text>
        <View className="bg-white rounded-2xl p-4 border border-slate-100 mb-6 shadow-sm">
          <Controller
            control={control}
            name="eps"
            render={({ field: { onChange, value } }) => (
              <Input
                label="EPS *"
                placeholder="ej. Sura EPS, Sanitas, Compensar"
                value={value}
                onChangeText={onChange}
                error={errors.eps?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="pension_fund"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Fondo de Pensión *"
                placeholder="ej. Protección, Porvenir, Colpensiones"
                value={value}
                onChangeText={onChange}
                error={errors.pension_fund?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="arl"
            render={({ field: { onChange, value } }) => (
              <Input
                label="ARL *"
                placeholder="ej. Sura ARL, Positiva"
                value={value}
                onChangeText={onChange}
                error={errors.arl?.message}
              />
            )}
          />
        </View>

        <Button
          title="Guardar Colaborador"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting || createEmployeeMutation.isPending}
          size="lg"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
