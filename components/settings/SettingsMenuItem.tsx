import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

interface SettingsMenuItemProps {
    icon: ReactNode;
    label: string;
    onPress?: () => void;
    showChevron?: boolean;
    destructive?: boolean;
    rightElement?: ReactNode;
}

export const SettingsMenuItem = ({
                                     icon,
                                     label,
                                     onPress,
                                     showChevron = true,
                                     destructive = false,
                                     rightElement
                                 }: SettingsMenuItemProps) => {
    return (
        <TouchableOpacity
            className="flex-row items-center justify-between py-4 border-b border-gray-800"
            onPress={onPress}
            activeOpacity={0.7}
            disabled={!onPress}
        >
            <View className="flex-row items-center">
                {icon}
                <Text className={`ml-4 text-lg ${destructive ? 'text-[#FF4D67]' : 'text-white'}`}>
                    {label}
                </Text>
            </View>

            <View className="flex-row items-center">
                {rightElement}
                {showChevron && <ChevronRight size={20} color="#9CA3AF" />}
            </View>
        </TouchableOpacity>
    );
};