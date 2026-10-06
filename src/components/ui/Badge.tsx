import React from 'react';
import { View, Text } from 'react-native';

export type BadgeVariant =
  | 'success'   // Verde: vigente, activo, pagado, aprobado, present
  | 'warning'   // Amarillo: por_vencer, pending, draft, late, vacation
  | 'danger'    // Rojo: vencido, rejected, terminated, absent
  | 'info'      // Azul: calculado, permiso, app
  | 'neutral';   // Gris: inactive, manual, otro

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  success: {
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  warning: {
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
  },
  danger: {
    bg: 'bg-rose-50 border-rose-200',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
  },
  info: {
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  neutral: {
    bg: 'bg-slate-100 border-slate-200',
    text: 'text-slate-700',
    dot: 'bg-slate-400',
  },
};

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
}) => {
  const style = variantStyles[variant] || variantStyles.neutral;
  const isSm = size === 'sm';

  return (
    <View
      className={`flex-row items-center border rounded-full self-start ${style.bg} ${
        isSm ? 'px-2 py-0.5' : 'px-2.5 py-1'
      }`}
    >
      <View className={`rounded-full mr-1.5 ${style.dot} ${isSm ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} />
      <Text
        className={`font-semibold capitalize ${style.text} ${
          isSm ? 'text-[11px]' : 'text-xs'
        }`}
      >
        {label}
      </Text>
    </View>
  );
};
