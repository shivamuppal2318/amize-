// src/hooks/useToast.ts
import { useCallback } from 'react';
import { Alert, Platform, ToastAndroid } from 'react-native';

/**
 * A hook that provides a platform-specific toast/alert functionality.
 * On Android, it uses the native ToastAndroid.
 * On iOS, it uses Alert with a single button for simplicity.
 * On web, it uses console.log and Alert.
 */
export const useToast = () => {
    const show = useCallback((title: string, message?: string, duration: 'SHORT' | 'LONG' = 'SHORT') => {
        // Log for debugging
        console.log(`[Toast] ${title}: ${message}`);
        
        if (Platform.OS === 'web') {
            // On web, use Alert for visibility
            if (!message) {
                Alert.alert('', title, [{ text: 'OK' }]);
            } else {
                Alert.alert(title, message, [{ text: 'OK' }]);
            }
        } else if (Platform.OS === 'android') {
            ToastAndroid.show(
                message || title,
                duration === 'SHORT' ? ToastAndroid.SHORT : ToastAndroid.LONG
            );
        } else {
            // On iOS, use Alert with a single button
            if (!message) {
                Alert.alert('', title, [{ text: 'OK' }]);
            } else {
                Alert.alert(title, message, [{ text: 'OK' }]);
            }
        }
    }, []);

    return { show };
};