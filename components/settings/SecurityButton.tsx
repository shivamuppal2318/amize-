import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

interface SecurityButtonProps {
  label: string;
  onPress: () => void;
}

export const SecurityButton = ({
  label,
  onPress
}: SecurityButtonProps) => {
  return (
    <TouchableOpacity
      className="bg-[#2A2A2A] py-4 rounded-full items-center justify-center my-3"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text className="text-white text-lg font-medium">
        {label}
      </Text>
    </TouchableOpacity>
  );
};