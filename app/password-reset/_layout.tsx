import { Stack } from 'expo-router';
import React from 'react';

export default function PasswordResetLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#1a1a2e' },
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="method" />
            <Stack.Screen name="verify" />
            <Stack.Screen name="create-password" />
            <Stack.Screen name="success" />
        </Stack>
    );
}