import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';
import { Alert } from 'react-native';
import { secureStorage, STORAGE_KEYS } from '@/lib/auth/storage';
import { LOCAL_LANGUAGES, resolveLanguageCode, resolveLanguageName } from '@/lib/i18n/languages';
import { useI18n } from './useI18n';

// API response types
export interface Language {
    code: string;
    name: string;
}

interface LanguageResponse {
    success: boolean;
    language: string;
    availableLanguages: Language[];
}

interface UpdateLanguageResponse {
    success: boolean;
    message: string;
    language: string;
}

interface UseLanguageResult {
    currentLanguage: string;
    availableLanguages: Language[];
    suggestedLanguages: Language[];
    otherLanguages: Language[];
    isLoading: boolean;
    error: string | null;
    fetchLanguages: () => Promise<void>;
    updateLanguage: (language: string) => Promise<boolean>;
}

export function useLanguage(): UseLanguageResult {
    const { setLanguage: setAppLanguage } = useI18n();
    const getLanguageApi = useApi<LanguageResponse>('/settings/language', 'get');
    const updateLanguageApi = useApi<UpdateLanguageResponse, { language: string }>('/settings/language', 'put');

    const [currentLanguage, setCurrentLanguage] = useState<string>('');
    const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Split languages into suggested and others
    // For this example, we'll mark the first 5 languages as suggested
    const suggestedLanguages = availableLanguages.slice(0, 5);
    const otherLanguages = availableLanguages.slice(5);

    const fetchLanguages = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await getLanguageApi.execute();

            if (response && response.success) {
                setCurrentLanguage(response.language);
                setAvailableLanguages(response.availableLanguages);
                await secureStorage.set(STORAGE_KEYS.LANGUAGE, response.language);
                await setAppLanguage(response.language);
            } else {
                throw new Error(getLanguageApi.error || 'Failed to load language settings');
            }
        } catch (err) {
            console.error('Error in useLanguage hook:', err);
            const storedLanguage = await secureStorage.get(STORAGE_KEYS.LANGUAGE);
            const resolvedLanguage =
                storedLanguage || resolveLanguageName(resolveLanguageCode('en'));
            setCurrentLanguage(resolvedLanguage);
            setAvailableLanguages(LOCAL_LANGUAGES);
            setError(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateLanguage = useCallback(async (language: string): Promise<boolean> => {
        if (language === currentLanguage) return true;

        setIsLoading(true);
        setError(null);

        try {
            const response = await updateLanguageApi.execute({ language });

            if (response && response.success) {
                setCurrentLanguage(response.language);
                await secureStorage.set(STORAGE_KEYS.LANGUAGE, response.language);
                await setAppLanguage(response.language);
                return true;
            }

            throw new Error(updateLanguageApi.error || 'Failed to update language');
        } catch (err) {
            console.error('Error updating language:', err);
            setCurrentLanguage(language);
            await secureStorage.set(STORAGE_KEYS.LANGUAGE, language);
            await setAppLanguage(language);
            setError(null);
            return true;
        } finally {
            setIsLoading(false);
        }
    }, [currentLanguage, setAppLanguage]);

    // Fetch languages on mount
    useEffect(() => {
        fetchLanguages();
    }, []);

    return {
        currentLanguage,
        availableLanguages,
        suggestedLanguages,
        otherLanguages,
        isLoading,
        error,
        fetchLanguages,
        updateLanguage
    };
}
