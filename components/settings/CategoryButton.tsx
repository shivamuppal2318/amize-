import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { CategoryButtonProps } from '@/types/settings';

export function CategoryButton({ icon, label, onPress, selected = false }: CategoryButtonProps) {
    return (
        <TouchableOpacity
            className={`items-center justify-center py-2 px-4 rounded-full ${
                selected ? 'bg-[#FF5A5F]' : 'bg-blue-600/5 border border-white/10'
            }`}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
        >
            <View className="flex-row items-center">
                {icon && <View className="mr-2">{icon}</View>}
                <Text className={`${selected ? 'text-white' : 'text-gray-300'} text-sm font-medium`}>
                    {label}
                </Text>
            </View>
        </TouchableOpacity>
    );
}