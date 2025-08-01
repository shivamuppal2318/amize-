import * as SecureStore from 'expo-secure-store';

// Keys for storing tokens and user data
export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data',
    ONBOARDING_COMPLETED: 'onboarding_completed',
    SIGNUP_FLOW: 'signup_flow',
};

// Helper class for secure storage operations
export const secureStorage = {
    // Get an item from secure storage
    get: async (key: string): Promise<string | null> => {
        try {
            return await SecureStore.getItemAsync(key);
        } catch (error) {
            console.error(`Error retrieving ${key}:`, error);
            return null;
        }
    },

    // Store an item in secure storage
    set: async (key: string, value: string): Promise<void> => {
        try {
            await SecureStore.setItemAsync(key, value);
        } catch (error) {
            console.error(`Error storing ${key}:`, error);
        }
    },

    // Remove an item from secure storage
    remove: async (key: string): Promise<void> => {
        try {
            await SecureStore.deleteItemAsync(key);
        } catch (error) {
            console.error(`Error removing ${key}:`, error);
        }
    },

    // Clear multiple keys at once
    clearMultiple: async (keys: string[]): Promise<void> => {
        try {
            await Promise.all(keys.map(key => SecureStore.deleteItemAsync(key)));
        } catch (error) {
            console.error('Error clearing multiple keys:', error);
        }
    },
};