import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  HardHat,
  ArrowLeft,
} from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

const loginSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@constructoraandina.com',
      password: 'Construpay2026!',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setErrorMessage(null);
    const { error } = await signIn(data.email, data.password);
    if (error) {
      setErrorMessage(
        error.message.includes('Invalid login')
          ? 'Credenciales incorrectas. Verifica tu correo y contraseña.'
          : error.message
      );
    } else {
      router.replace('/(app)/(tabs)');
    }
  };

  const handleForgotPassword = () => {
    Alert.prompt
      ? Alert.prompt(
          'Recuperar Contraseña',
          'Ingresa tu correo para enviarte el enlace de restablecimiento:',
          async (email) => {
            if (!email) return;
            await supabase.auth.resetPasswordForEmail(email);
            Alert.alert(
              'Enlace Enviado',
              'Si el correo está registrado, recibirás un correo con las instrucciones.'
            );
          }
        )
      : Alert.alert(
          'Recuperar Contraseña',
          'Comunícate con el administrador de la empresa o escribe a soporte@construpay.co.'
        );
  };

  const handleFillSeedUser = (email: string) => {
    setValue('email', email);
    setValue('password', 'Construpay2026!');
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Bar */}
          <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white border border-slate-200 items-center justify-center shadow-sm"
            >
              <ArrowLeft size={20} color="#334155" />
            </TouchableOpacity>
          </View>

          {/* Form Container */}
          <View className="flex-1 justify-center px-6 py-6">
            {/* Header */}
            <View className="items-center mb-8">
              <View className="w-16 h-16 rounded-2xl bg-blue-600 items-center justify-center shadow-lg shadow-blue-500/30 mb-3">
                <HardHat size={34} color="#FFFFFF" />
              </View>
              <Text className="text-2xl font-black text-slate-900">
                Bienvenido a Constru<Text className="text-blue-600">pay</Text>
              </Text>
              <Text className="text-sm text-slate-500 mt-1 text-center">
                Ingresa con tus credenciales de Supabase Auth
              </Text>
            </View>

            {/* Error Banner */}
            {errorMessage && (
              <View className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 mb-4">
                <Text className="text-rose-700 text-xs font-medium">
                  {errorMessage}
                </Text>
              </View>
            )}

            {/* Fields */}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Correo Electrónico"
                  placeholder="ej. admin@constructoraandina.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.email?.message}
                  leftIcon={<Mail size={18} color="#64748B" />}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Contraseña"
                  placeholder="Tu contraseña"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.password?.message}
                  leftIcon={<Lock size={18} color="#64748B" />}
                  rightIcon={
                    showPassword ? (
                      <EyeOff size={18} color="#64748B" />
                    ) : (
                      <Eye size={18} color="#64748B" />
                    )
                  }
                  onRightIconPress={() => setShowPassword(!showPassword)}
                />
              )}
            />

            {/* Forgot password */}
            <View className="flex-row justify-end mb-6">
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text className="text-xs font-semibold text-blue-600">
                  ¿Olvidaste tu contraseña?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Submit button */}
            <Button
              title="Iniciar Sesión"
              onPress={() => handleSubmit(onSubmit)()}
              loading={isSubmitting}
              size="lg"
            />

            {/* Seed credentials helper card */}
            <View className="mt-8 bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4">
              <Text className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
                Usuarios de Prueba en Supabase
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-2">
                <TouchableOpacity
                  onPress={() => handleFillSeedUser('admin@constructoraandina.com')}
                  className="bg-white px-2.5 py-1.5 rounded-lg border border-blue-200"
                >
                  <Text className="text-[11px] font-bold text-blue-700">Admin</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleFillSeedUser('projas@andina.com')}
                  className="bg-white px-2.5 py-1.5 rounded-lg border border-blue-200"
                >
                  <Text className="text-[11px] font-bold text-blue-700">RRHH</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleFillSeedUser('jgarcia@andina.com')}
                  className="bg-white px-2.5 py-1.5 rounded-lg border border-blue-200"
                >
                  <Text className="text-[11px] font-bold text-blue-700">Supervisor</Text>
                </TouchableOpacity>
              </View>
              <Text className="text-[11px] text-blue-800">
                Clave: <Text className="font-semibold">Construpay2026!</Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
