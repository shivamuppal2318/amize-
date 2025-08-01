import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SettingsToggleProps } from '@/types/settings';

export function SettingsToggle({
                                   label,
                                   value,
                                   onToggle,
                                   icon,
                                   disabled = false
                               }: SettingsToggleProps) {
    return (
        <TouchableOpacity
            className={`flex-row items-center justify-between px-4 py-4 bg-blue-600/5 border border-white/10 rounded-lg mb-3 ${
                disabled ? 'opacity-50' : ''
            }`}
            onPress={() => !disabled && onToggle(!value)}
            disabled={disabled}
            accessibilityRole="switch"
            accessibilityLabel={label}
            accessibilityState={{ checked: value, disabled }}
        >
            <View className="flex-row items-center">
                {icon && <View className="mr-3">{icon}</View>}
                <Text className="text-white">{label}</Text>
            </View>

            <View className={`w-12 h-6 rounded-full ${value ? 'bg-[#FF5A5F]' : 'bg-gray-600'} justify-center px-1`}>
                <View
                    className={`w-5 h-5 rounded-full bg-white ${
                        value ? 'ml-auto' : 'mr-auto'
                    }`}
                />
            </View>
        </TouchableOpacity>
    );
}