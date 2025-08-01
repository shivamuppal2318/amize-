import { Stack } from 'expo-router';
import React from 'react';

export default function AuthLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#1a1a2e' },
            }}
        >
            <Stack.Screen name="get-started" />
            <Stack.Screen name="sign-up" />
            <Stack.Screen name="sign-in" />
        </Stack>
    );
}
