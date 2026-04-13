import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const webStorage = {
    getItemAsync: async (key: string): Promise<string | null> => {
        if (typeof window === 'undefined') {
            return null;
        }

        return window.localStorage.getItem(key);
    },
    setItemAsync: async (key: string, value: string): Promise<void> => {
        if (typeof window === 'undefined') {
            return;
        }

        window.localStorage.setItem(key, value);
    },
    deleteItemAsync: async (key: string): Promise<void> => {
        if (typeof window === 'undefined') {
            return;
        }

        window.localStorage.removeItem(key);
    },
};

const storageBackend =
    Platform.OS === 'web'
        ? webStorage
        : {
              getItemAsync: SecureStore.getItemAsync,
              setItemAsync: SecureStore.setItemAsync,
              deleteItemAsync: SecureStore.deleteItemAsync,
          };

// Keys for storing tokens and user data
export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data',
    ONBOARDING_COMPLETED: 'onboarding_completed',
    SIGNUP_FLOW: 'signup_flow',
    LANGUAGE: 'app_language',
};

// Helper class for secure storage operations
export const secureStorage = {
    // Get an item from secure storage
    get: async (key: string): Promise<string | null> => {
        try {
            return await storageBackend.getItemAsync(key);
        } catch (error) {
            console.error(`Error retrieving ${key}:`, error);
            return null;
        }
    },

    // Store an item in secure storage
    set: async (key: string, value: string): Promise<void> => {
        try {
            await storageBackend.setItemAsync(key, value);
        } catch (error) {
            console.error(`Error storing ${key}:`, error);
        }
    },

    // Remove an item from secure storage
    remove: async (key: string): Promise<void> => {
        try {
            await storageBackend.deleteItemAsync(key);
        } catch (error) {
            console.error(`Error removing ${key}:`, error);
        }
    },

    // Clear multiple keys at once
    clearMultiple: async (keys: string[]): Promise<void> => {
        try {
            await Promise.all(keys.map(key => storageBackend.deleteItemAsync(key)));
        } catch (error) {
            console.error('Error clearing multiple keys:', error);
        }
    },
};
