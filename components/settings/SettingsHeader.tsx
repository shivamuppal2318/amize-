import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { SettingsHeaderProps } from '@/types/settings';

export function SettingsHeader({ title, onBackPress, rightElement }: SettingsHeaderProps) {
    return (
        <View className="flex-row items-center justify-between py-4 px-4">
            <View className="flex-row items-center">
                {onBackPress && (
                    <TouchableOpacity
                        className="p-2 -ml-2"
                        onPress={onBackPress}
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                    >
                        <ChevronLeft size={24} color="white" />
                    </TouchableOpacity>
                )}
                <Text className="text-white text-xl font-semibold ml-2">
                    {title}
                </Text>
            </View>

            {rightElement && (
                <View>
                    {rightElement}
                </View>
            )}
        </View>
    );
}