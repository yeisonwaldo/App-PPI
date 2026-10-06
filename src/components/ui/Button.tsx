import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  TouchableOpacityProps,
} from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  loading = false,
  icon,
  rightIcon,
  size = 'md',
  disabled,
  className = '',
  ...props
}) => {
  const getContainerStyle = () => {
    const base = 'flex-row items-center justify-center rounded-xl shadow-sm';
    const sizeStyle =
      size === 'sm' ? 'py-2 px-3' : size === 'lg' ? 'py-4 px-6' : 'py-3.5 px-4';

    if (disabled || loading) {
      return `${base} ${sizeStyle} bg-slate-200 border border-slate-300 opacity-70`;
    }

    switch (variant) {
      case 'primary':
        return `${base} ${sizeStyle} bg-blue-600 active:bg-blue-700`;
      case 'secondary':
        return `${base} ${sizeStyle} bg-slate-800 active:bg-slate-900`;
      case 'outline':
        return `${base} ${sizeStyle} bg-transparent border border-blue-600 active:bg-blue-50`;
      case 'danger':
        return `${base} ${sizeStyle} bg-rose-600 active:bg-rose-700`;
      case 'ghost':
        return `${base} ${sizeStyle} bg-transparent active:bg-slate-100 shadow-none`;
      default:
        return `${base} ${sizeStyle} bg-blue-600`;
    }
  };

  const getTextStyle = () => {
    const textSize =
      size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base font-bold' : 'text-sm font-semibold';

    if (disabled || loading) {
      return `${textSize} text-slate-400`;
    }

    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
        return `${textSize} text-white`;
      case 'outline':
        return `${textSize} text-blue-600`;
      case 'ghost':
        return `${textSize} text-slate-700`;
      default:
        return `${textSize} text-white`;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      className={`${getContainerStyle()} ${className}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? '#1A56DB' : '#FFFFFF'}
        />
      ) : (
        <View className="flex-row items-center justify-center">
          {icon && <View className="mr-2">{icon}</View>}
          <Text className={getTextStyle()}>{title}</Text>
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};
