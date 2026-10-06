import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Calculator,
  FileCheck2,
  CalendarCheck2,
  BarChart3,
  CalendarDays,
  ShieldCheck,
  ChevronRight,
  HardHat,
  ArrowRight,
} from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';

const FEATURES = [
  {
    icon: Calculator,
    title: 'Cálculo automático de nómina',
    desc: 'Salario base, horas extra, recargos y deducciones de ley colombiana (salud, pensión).',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: FileCheck2,
    title: 'Gestión documental',
    desc: 'Alertas tempranas de certificados de alturas, exámenes médicos y afiliaciones a seguridad social.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: CalendarCheck2,
    title: 'Control de asistencia',
    desc: 'Registro diario en obra de ingresos, salidas, horas laboradas y horas extra en tiempo real.',
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    icon: BarChart3,
    title: 'Reportes financieros',
    desc: 'Totales devengados, deducciones consolidadas y neto a pagar por obra y periodo.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: CalendarDays,
    title: 'Gestión de permisos',
    desc: 'Flujo rápido de solicitud y aprobación de incapacidades, licencias y vacaciones.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: ShieldCheck,
    title: 'Cumplimiento legal',
    desc: 'Diseñado bajo la normatividad laboral de Colombia (código sustantivo del trabajo y UGPP).',
    color: 'bg-rose-50 text-rose-600',
  },
];

export default function LandingScreen() {
  const router = useRouter();
  const { enableDemoMode } = useAuthStore();

  const handleStartDemo = () => {
    enableDemoMode();
    router.replace('/(app)/(tabs)');
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header / Brand */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-xl bg-blue-600 items-center justify-center shadow-md mr-3">
                <HardHat size={22} color="#FFFFFF" />
              </View>
              <View>
                <Text className="text-xl font-black text-slate-900 tracking-tight">
                  Constru<Text className="text-blue-600">pay</Text>
                </Text>
                <Text className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase">
                  Colombia • Nómina & Obra
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              className="px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200"
            >
              <Text className="text-xs font-bold text-blue-700">Entrar</Text>
            </TouchableOpacity>
          </View>

          {/* Hero Section */}
          <View className="bg-blue-600 rounded-3xl p-6 shadow-lg shadow-blue-600/20 mb-6">
            <View className="bg-blue-500/40 self-start px-3 py-1 rounded-full mb-3 border border-blue-400/30">
              <Text className="text-white text-xs font-semibold">
                Sector Construcción Colombia
              </Text>
            </View>
            <Text className="text-2xl font-black text-white leading-tight mb-2">
              Gestión de Nómina y Documentación Laboral
            </Text>
            <Text className="text-blue-100 text-sm leading-relaxed mb-5">
              Control integral de colaboradores, liquidaciones quincenales y mensuales, y
              certificados con alertas de vencimiento para obras sin contratiempos.
            </Text>

            <View className="flex-col gap-2.5">
              <Button
                title="Iniciar sesión"
                variant="secondary"
                size="lg"
                onPress={() => router.push('/(auth)/login')}
                rightIcon={<ChevronRight size={18} color="#FFFFFF" />}
              />
              <Button
                title="Explorar Demostración Rápida"
                variant="outline"
                size="md"
                className="bg-blue-700/60 border-blue-300 text-white"
                onPress={handleStartDemo}
                rightIcon={<ArrowRight size={16} color="#DBEAFE" />}
              />
            </View>
          </View>
        </View>

        {/* 6 Features */}
        <View className="px-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-base font-bold text-slate-900 tracking-tight">
              Funcionalidades Clave
            </Text>
            <Text className="text-xs text-slate-400 font-medium">6 Módulos</Text>
          </View>

          <View className="space-y-3">
            {FEATURES.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <View
                  key={idx}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex-row items-start mb-3"
                >
                  <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center mr-3.5 mt-0.5">
                    <IconComp size={20} color="#1A56DB" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-900 mb-1">
                      {item.title}
                    </Text>
                    <Text className="text-xs text-slate-500 leading-relaxed">
                      {item.desc}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
