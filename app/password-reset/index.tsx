import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';

const StyledView = View;

const StyledSafeAreaView = SafeAreaView;
const StyledTouchableOpacity = TouchableOpacity;

export default function ForgotPasswordScreen() {
    const handleContinue = () => {
        router.push('/password-reset/method');
    };

    return (
        <StyledSafeAreaView className="flex-1 bg-[#1a1a2e]">
            <StyledView className="flex-1 p-6">
                <StyledTouchableOpacity
                    className="p-2 -ml-2 mb-4"
                    onPress={() => router.back()}
                >
                    <ChevronLeft size={24} color="white"/>
                </StyledTouchableOpacity>

                <StyledView className="mb-6">
                    <Text className="text-white text-2xl font-bold">
                        Forgot Password
                    </Text>
                </StyledView>

                <StyledView className="flex-1 items-center justify-center">
                    <StyledView className="w-64 h-64 justify-center items-center mb-6">
                        <StyledView className="w-48 h-48 bg-[#1E1E1E] rounded-full justify-center items-center">
                            <Text className="text-[#FF5A5F] text-6xl">?</Text>
                        </StyledView>
                    </StyledView>

                    <Text className="text-gray-400 text-center mb-8">
                        We will guide you through selecting a reset method and verifying your account before you create a new password.
                    </Text>
                </StyledView>

                <Button
                    label="Choose Reset Method"
                    onPress={handleContinue}
                    variant="primary"
                    fullWidth
                />
            </StyledView>
        </StyledSafeAreaView>
    );
}
