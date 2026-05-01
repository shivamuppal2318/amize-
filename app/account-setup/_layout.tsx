import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRegistration } from '@/context/RegistrationContext';
import { router } from 'expo-router';

export default function AccountSetupLayout() {
    const { isAuthenticated, isInSignupFlow, loading } = useAuth();
    const { registrationData, isHydrated } = useRegistration();
    const hasPendingRegistration =
        Boolean(registrationData.username) ||
        Boolean(registrationData.email) ||
        Boolean(registrationData.password);

    useEffect(() => {
        // Wait for auth hydration before guarding this flow. Otherwise the layout can
        // redirect away from birthday/profile for a single frame during startup.
        if (!loading && isHydrated && !isInSignupFlow && !hasPendingRegistration && !isAuthenticated) {
            router.replace('/sign-in');
        }
    }, [loading, isHydrated, isInSignupFlow, hasPendingRegistration, isAuthenticated]);

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
