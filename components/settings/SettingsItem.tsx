import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { SettingsItemProps } from '@/types/settings';

export function SettingsItem({
                                 icon,
                                 label,
                                 value,
                                 onPress,
                                 showChevron = true,
                                 destructive = false,
                                 disabled = false
                             }: SettingsItemProps) {
    return (
        <TouchableOpacity
            className={`flex-row items-center justify-between px-4 py-4 bg-blue-600/5 border border-white/10 rounded-lg mb-3 ${
                disabled ? 'opacity-50' : ''
            }`}
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ disabled }}
        >
            <View className="flex-row items-center">
                {icon}
                <Text className={`ml-3 ${destructive ? 'text-red-500' : 'text-white'}`}>
                    {label}
                </Text>
            </View>

            <View className="flex-row items-center">
                {value && (
                    <Text className="text-gray-400 mr-2">
                        {typeof value === 'string' ? value : null}
                    </Text>
                )}
                {showChevron && <ChevronRight size={20} color="#9CA3AF" />}
            </View>
        </TouchableOpacity>
    );
}