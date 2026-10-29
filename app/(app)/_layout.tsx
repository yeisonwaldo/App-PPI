import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/stores/authStore';

export default function AppLayout() {
  const { user, profile, isLoading, isInitialized } = useAuthStore();

  if (!isInitialized || isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#1A56DB" />
      </View>
    );
  }

  // Si no hay sesión autenticada en Supabase, redirigir a Login
  if (!user && !profile) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
