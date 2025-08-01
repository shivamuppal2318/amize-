import React from 'react';
import { Stack } from 'expo-router';

export default function HelpCenterLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#1a1a2e' },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="contact-us" />
        </Stack>
    );
}