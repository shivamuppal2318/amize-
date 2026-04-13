import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';

export default function AccountSetupLayout() {
    const { isAuthenticated, isInSignupFlow } = useAuth();

    useEffect(() => {
        if (!isInSignupFlow && !isAuthenticated) {
            router.replace('/(auth)/sign-in');
        }
    }, [isInSignupFlow, isAuthenticated]);

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#1a1a2e' },
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
