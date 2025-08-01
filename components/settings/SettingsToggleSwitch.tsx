import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';

interface SettingsToggleSwitchProps {
    icon: React.ReactNode;
    label: string;
    value: boolean;
    onToggle: (value: boolean) => void;
}

export const SettingsToggleSwitch = ({
                                         icon,
                                         label,
                                         value,
                                         onToggle
                                     }: SettingsToggleSwitchProps) => {
    return (
        <View className="flex-row items-center justify-between py-4 border-b border-gray-800">
            <View className="flex-row items-center">
                {icon}
                <Text className="ml-4 text-lg text-white">
                    {label}
                </Text>
            </View>

            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: '#3e3e3e', true: '#FF4D67' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#3e3e3e"
            />
        </View>
    );
};