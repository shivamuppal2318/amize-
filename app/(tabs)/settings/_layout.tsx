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
            <Stack.Screen name="notifications"/>
            <Stack.Screen name="wallet"/>
            <Stack.Screen name="premium"/>
            <Stack.Screen name="creator-earnings"/>
            <Stack.Screen name="client-showcase"/>
            <Stack.Screen name="admin-overview"/>
            <Stack.Screen name="admin-system-health"/>
            <Stack.Screen name="admin-release-readiness"/>
            <Stack.Screen name="admin-topics"/>
            <Stack.Screen name="admin-withdrawals"/>
            <Stack.Screen name="admin-reports"/>
            <Stack.Screen name="language"/>
            <Stack.Screen name="data-storage"/>
            <Stack.Screen name="help-center/index"/>
            <Stack.Screen name="help-center/contact-us"/>
            <Stack.Screen name="privacy-policy"/>
        </Stack>
    );
}
