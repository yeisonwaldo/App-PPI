import React, { forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerClassName?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      onRightIconPress,
      containerClassName = '',
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <View className={`w-full mb-3.5 ${containerClassName}`}>
        {label && (
          <Text className="text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
            {label}
          </Text>
        )}
        <View
          className={`flex-row items-center border rounded-xl px-3.5 py-2.5 bg-slate-50 ${
            error
              ? 'border-rose-400 bg-rose-50/30'
              : 'border-slate-200 focus:border-blue-600 focus:bg-white'
          }`}
        >
          {leftIcon && <View className="mr-2.5">{leftIcon}</View>}
          <TextInput
            ref={ref}
            className={`flex-1 text-slate-900 text-sm py-1 ${className}`}
            placeholderTextColor="#94A3B8"
            {...props}
          />
          {rightIcon && (
            <TouchableOpacity
              activeOpacity={0.7}
              disabled={!onRightIconPress}
              onPress={onRightIconPress}
              className="ml-2"
            >
              {rightIcon}
            </TouchableOpacity>
          )}
        </View>
        {error ? (
          <Text className="text-rose-600 text-xs mt-1 font-medium">{error}</Text>
        ) : helperText ? (
          <Text className="text-slate-500 text-xs mt-1">{helperText}</Text>
        ) : null}
      </View>
    );
  }
);

Input.displayName = 'Input';
