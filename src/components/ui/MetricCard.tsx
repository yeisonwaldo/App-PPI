import React from 'react';
import { View, Text } from 'react-native';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBgColor = 'bg-blue-50',
  trend,
}) => {
  return (
    <View className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex-1 min-w-[140px] m-1.5">
      <View className="flex-row items-center justify-between mb-2.5">
        <View className={`w-10 h-10 rounded-xl items-center justify-center ${iconBgColor}`}>
          {icon}
        </View>
        {trend && (
          <View
            className={`px-2 py-0.5 rounded-full ${
              trend.isPositive ? 'bg-emerald-50' : 'bg-rose-50'
            }`}
          >
            <Text
              className={`text-[11px] font-bold ${
                trend.isPositive ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {trend.value}
            </Text>
          </View>
        )}
      </View>
      <Text className="text-xs font-medium text-slate-500 mb-0.5">{title}</Text>
      <Text className="text-xl font-bold text-slate-900 tracking-tight">{value}</Text>
      {subtitle && <Text className="text-[11px] text-slate-400 mt-1">{subtitle}</Text>}
    </View>
  );
};
