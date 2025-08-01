import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { FieldEditItemProps } from '@/types/settings';

export function FieldEditItem({ label, value, icon, onPress }: FieldEditItemProps) {
    return (
        <TouchableOpacity
            className="flex-row items-center justify-between py-4"
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${label}`}
        >
            <View className="flex-row items-center">
                {icon && <View className="mr-3">{icon}</View>}
                <Text className="text-white">{label}</Text>
            </View>

            <View className="flex-row items-center">
                <Text className="text-gray-400 mr-2" numberOfLines={1}>
                    {value}
                </Text>
                <ChevronRight size={20} color="#9CA3AF" />
            </View>
        </TouchableOpacity>
    );
}