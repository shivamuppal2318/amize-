import React from 'react';
import { View, Text } from 'react-native';
import { SettingsSectionProps } from '@/types/settings';

export function SettingsSection({ title, children, className = '' }: SettingsSectionProps) {
    return (
        <View className={`mb-6 ${className}`}>
            {title && (
                <Text className="text-white text-lg font-semibold mb-3">
                    {title}
                </Text>
            )}
            <View>
                {children}
            </View>
        </View>
    );
}