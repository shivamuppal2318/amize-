import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { LogOut } from 'lucide-react-native';

interface LogoutButtonProps {
    onPress: () => void;
}

export const LogoutButton = ({ onPress }: LogoutButtonProps) => {
    return (
        <TouchableOpacity
            className="flex-row items-center py-4"
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View className="mr-4">
                <LogOut size={24} color="#FF4D67" />
            </View>
            <Text className="text-[#FF4D67] text-lg font-medium">
                Logout
            </Text>
        </TouchableOpacity>
    );
};