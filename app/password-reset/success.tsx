import React, { useEffect } from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { StatusIndicator } from '@/components/ui/StatusIndicator';

const StyledView = View
const StyledSafeAreaView = SafeAreaView

export default function PasswordSuccessScreen() {
    useEffect(() => {
        // Auto-redirect after a few seconds
        const timer = setTimeout(() => {
            router.replace('/(auth)/sign-in');
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    const handleContinue = () => {
        router.replace('/(auth)/sign-in');
    };

    return (
        <StyledSafeAreaView className="flex-1 bg-[#1a1a2e]">
            <StyledView className="flex-1 p-6 justify-center items-center">
                <StatusIndicator
                    status="success"
                    title="Congratulations!"
                    message="Your account is ready to use. You will be redirected to the login page in a few seconds."
                    className="mb-8"
                />

                <StyledView className="w-full mt-auto">
                    <Button
                        label="Continue"
                        onPress={handleContinue}
                        variant="primary"
                        fullWidth
                    />
                </StyledView>
            </StyledView>
        </StyledSafeAreaView>
    );
}