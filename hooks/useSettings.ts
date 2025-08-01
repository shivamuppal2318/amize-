import { useState, useEffect } from 'react';
import { secureStorage } from '@/lib/auth/storage';
import { DEFAULT_USER_SETTINGS } from '@/lib/settings/constants';
import { UserSettings } from '@/types/settings';

// Key for storing settings
const SETTINGS_STORAGE_KEY = 'user_settings';

export function useSettings() {
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
    const [loading, setLoading] = useState(true);

    // Load settings from storage on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const storedSettings = await secureStorage.get(SETTINGS_STORAGE_KEY);

                if (storedSettings) {
                    setSettings(JSON.parse(storedSettings));
                }
            } catch (error) {
                console.error('Error loading settings:', error);
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, []);

    // Save settings whenever they change
    const saveSettings = async (newSettings: UserSettings) => {
        try {
            await secureStorage.set(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
            setSettings(newSettings);
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    };

    // Update a specific setting
    const updateSetting = async <K extends keyof UserSettings>(
        key: K,
        value: UserSettings[K]
    ) => {
        const newSettings = { ...settings, [key]: value };
        return await saveSettings(newSettings);
    };

    // Update a nested setting
    const updateNestedSetting = async <
        K extends keyof UserSettings,
        N extends keyof UserSettings[K]
    >(
        key: K,
        nestedKey: N,
        value: UserSettings[K][N]
    ) => {
        const newSettings = {
            ...settings,
            [key]: {
                ...settings[key],
                [nestedKey]: value
            }
        };
        return await saveSettings(newSettings);
    };

    // Reset settings to defaults
    const resetSettings = async () => {
        return await saveSettings(DEFAULT_USER_SETTINGS);
    };

    return {
        settings,
        loading,
        saveSettings,
        updateSetting,
        updateNestedSetting,
        resetSettings
    };
}