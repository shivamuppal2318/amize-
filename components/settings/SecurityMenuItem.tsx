import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

interface SecurityMenuItemProps {
    label: string;
    value?: string;
    onPress: () => void;
}

export const SecurityMenuItem = ({
                                     label,
                                     value,
                                     onPress
                                 }: SecurityMenuItemProps) => {
    return (
        <TouchableOpacity
            className="flex-row items-center justify-between py-5"
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Text className="text-white text-lg">
                {label}
            </Text>

            <View className="flex-row items-center">
                {value && (
                    <Text className="text-white text-lg mr-2">
                        {value}
                    </Text>
                )}
                <ChevronRight size={20} color="#9CA3AF" />
            </View>
        </TouchableOpacity>
    );
};