import React, { useMemo, useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';

const StyledView = View;
const StyledSafeAreaView = SafeAreaView;
const StyledTouchableOpacity = TouchableOpacity;

export default function ResetMethodScreen() {
    const [selectedMethod, setSelectedMethod] = useState<'sms' | 'email'>('sms');

    const methodOptions = useMemo(
        () => [
            {
                key: 'sms' as const,
                label: 'via SMS',
                value: '+1 (555) ******99',
                icon: 'SMS',
            },
            {
                key: 'email' as const,
                label: 'via Email',
                value: '****@yourdomain.com',
                icon: '@',
            },
        ],
        []
    );

    const handleContinue = () => {
        const selectedOption = methodOptions.find(
            (option) => option.key === selectedMethod
        );

        router.push({
            pathname: '/password-reset/verify',
            params: {
                method: selectedMethod,
                target: selectedOption?.value ?? '',
            },
        });
    };

    return (
        <StyledSafeAreaView className="flex-1 bg-[#1a1a2e]">
            <StyledView className="flex-1 p-6">
                <StyledTouchableOpacity
                    className="p-2 -ml-2 mb-4"
                    onPress={() => router.back()}
                >
                    <ChevronLeft size={24} color="white" />
                </StyledTouchableOpacity>

                <StyledView className="mb-6">
                    <Text className="text-white text-2xl font-bold">
                        Forgot Password
                    </Text>
                </StyledView>

                <StyledView className="flex-1 items-center justify-center">
                    <StyledView className="w-64 h-64 justify-center items-center mb-6">
                        <StyledView className="w-48 h-48 bg-[#1E1E1E] rounded-full justify-center items-center">
                            <Text className="text-[#FF5A5F] text-4xl font-bold">
                                SMS
                            </Text>
                        </StyledView>
                    </StyledView>

                    <Text className="text-gray-400 text-center mb-8">
                        Select which contact details should we use to reset your password
                    </Text>
                </StyledView>

                <StyledView className="mb-6">
                    {methodOptions.map((option, index) => {
                        const isSelected = option.key === selectedMethod;

                        return (
                            <TouchableOpacity
                                key={option.key}
                                className="flex-row items-center bg-[#2A2A2A] rounded-xl p-4 border"
                                style={{
                                    borderColor: isSelected ? '#FF5A5F' : 'transparent',
                                    marginBottom: index === 0 ? 16 : 0,
                                }}
                                onPress={() => setSelectedMethod(option.key)}
                            >
                                <StyledView className="w-12 h-12 bg-[#1E1E1E] rounded-full items-center justify-center mr-4">
                                    <Text className="text-[#FF5A5F] text-xl">
                                        {option.icon}
                                    </Text>
                                </StyledView>
                                <StyledView className="flex-1">
                                    <Text className="text-gray-400 text-sm">
                                        {option.label}
                                    </Text>
                                    <Text className="text-white font-medium">
                                        {option.value}
                                    </Text>
                                </StyledView>
                            </TouchableOpacity>
                        );
                    })}
                </StyledView>

                <Button
                    label="Continue"
                    onPress={handleContinue}
                    variant="primary"
                    fullWidth
                />
            </StyledView>
        </StyledSafeAreaView>
    );
}
