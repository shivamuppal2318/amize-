// app/(tabs)/profile/_layout.tsx

import React from 'react';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function ProfileLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#000000' },
                animation: Platform.OS === 'ios' ? 'slide_from_right' : 'fade_from_bottom',
                animationDuration: Platform.OS === 'ios' ? 300 : 250,
                gestureEnabled: true,
                gestureDirection: 'horizontal',
                fullScreenGestureEnabled: true,
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    animation: 'fade',
                }}
            />
            <Stack.Screen
                name="[id]"
                options={{
                    animation: 'slide_from_right',
                    gestureEnabled: true,
                }}
            />
        </Stack>
    );
}