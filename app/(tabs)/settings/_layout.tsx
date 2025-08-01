import React from 'react';
import {Stack} from 'expo-router';
import {Platform} from "react-native";

export default function SettingsLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: {
                    backgroundColor: '#1a1a2e',
                    ...Platform.select({
                        ios: {paddingTop: 1},
                        android: {paddingTop: 50},
                    }),
                },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="index"/>
            <Stack.Screen name="edit-profile"/>
            <Stack.Screen name="manage-accounts"/>
            <Stack.Screen name="security"/>
            <Stack.Screen name="language"/>
            <Stack.Screen name="help-center/index"/>
            <Stack.Screen name="help-center/contact-us"/>
            <Stack.Screen name="privacy-policy"/>
        </Stack>
    );
}