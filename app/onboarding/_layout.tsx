import { Stack } from 'expo-router';
import React from 'react';
import { Platform, StatusBar } from 'react-native';

export default function OnboardingLayout() {
    return (
        <>
            {/* Enhanced Status Bar */}
            <StatusBar
                barStyle="light-content"
                backgroundColor="#1a1a2e"
                translucent={Platform.OS === 'android'}
            />

            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: {
                        backgroundColor: '#1a1a2e',
                    },
                    animation: Platform.OS === 'ios' ? 'slide_from_right' : 'fade_from_bottom',
                    animationDuration: Platform.OS === 'ios' ? 400 : 300,
                    gestureEnabled: true,
                    gestureDirection: 'horizontal',
                    fullScreenGestureEnabled: false, // Disable for onboarding flow
                }}
            >
                <Stack.Screen
                    name="index"
                    options={{
                        animation: 'fade',
                        gestureEnabled: false, // Disable gesture for splash
                    }}
                />
                <Stack.Screen
                    name="step1"
                    options={{
                        animation: 'slide_from_right',
                        gestureEnabled: false, // Disable swipe back in onboarding
                    }}
                />
                <Stack.Screen
                    name="step2"
                    options={{
                        animation: 'slide_from_right',
                        gestureEnabled: false,
                    }}
                />
                <Stack.Screen
                    name="step3"
                    options={{
                        animation: 'slide_from_right',
                        gestureEnabled: false,
                    }}
                />
            </Stack>
        </>
    );
}