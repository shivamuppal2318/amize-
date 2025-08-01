import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRegistration } from '@/context/RegistrationContext';
import { router } from 'expo-router';

export default function AccountSetupLayout() {
    const { isAuthenticated, isInSignupFlow } = useAuth();
    const { currentStep } = useRegistration();

    // Protect account setup routes - redirect if not in signup flow
    useEffect(() => {
        if (!isInSignupFlow && !isAuthenticated) {
            console.log('Not in signup flow, redirecting to sign-in');
            router.replace('/(auth)/sign-in');
        }
    }, [isInSignupFlow, isAuthenticated]);

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#1a1a2e' },
                // Prevent going back with gesture
                gestureEnabled: false,
            }}
        >
            <Stack.Screen name="interests" />
            <Stack.Screen name="gender" />
            <Stack.Screen name="birthday" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="pin" />
            <Stack.Screen name="fingerprint" />
            <Stack.Screen name="verify" />
            <Stack.Screen name="success" />
        </Stack>
    );
}