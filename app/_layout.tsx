import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import '../global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutos
    },
  },
});

export default function RootLayout() {
  const initializeAuth = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
          <Stack.Screen name="(app)" options={{ animation: 'fade' }} />
          <Stack.Screen
            name="employees/new"
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Nuevo Colaborador',
              headerTintColor: '#1A56DB',
            }}
          />
          <Stack.Screen
            name="employees/[id]"
            options={{
              headerShown: true,
              title: 'Detalle de Colaborador',
              headerTintColor: '#1A56DB',
            }}
          />
          <Stack.Screen
            name="documents"
            options={{
              headerShown: true,
              title: 'Gestión Documental',
              headerTintColor: '#1A56DB',
            }}
          />
          <Stack.Screen
            name="leaves"
            options={{
              headerShown: true,
              title: 'Permisos y Licencias',
              headerTintColor: '#1A56DB',
            }}
          />
          <Stack.Screen
            name="notifications"
            options={{
              headerShown: true,
              title: 'Notificaciones',
              headerTintColor: '#1A56DB',
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              headerShown: true,
              title: 'Configuración y Empresa',
              headerTintColor: '#1A56DB',
            }}
          />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
