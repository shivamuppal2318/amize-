import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';
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

    const mergeLanguages = useCallback((languages: Language[]) => {
        const byCode = new Map<string, Language>();

        [...LOCAL_LANGUAGES, ...languages].forEach((language) => {
            const normalizedCode = resolveLanguageCode(language.code || language.name);
            if (!byCode.has(normalizedCode)) {
                byCode.set(normalizedCode, {
                    code: normalizedCode,
                    name: resolveLanguageName(language.code || language.name),
                });
            }
        });

        return Array.from(byCode.values());
    }, []);

    const fetchLanguages = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await getLanguageApi.execute();

            if (response && response.success) {
                const normalizedCode = resolveLanguageCode(response.language);
                setCurrentLanguage(normalizedCode);
                setAvailableLanguages(mergeLanguages(response.availableLanguages));
                await secureStorage.set(STORAGE_KEYS.LANGUAGE, normalizedCode);
                await setAppLanguage(normalizedCode);
            } else {
                throw new Error(getLanguageApi.error || 'Failed to load language settings');
            }
        } catch (err) {
            console.error('Error in useLanguage hook:', err);
            const storedLanguage = await secureStorage.get(STORAGE_KEYS.LANGUAGE);
            const resolvedLanguage = resolveLanguageCode(storedLanguage || 'en');
            setCurrentLanguage(resolvedLanguage);
            setAvailableLanguages(mergeLanguages([]));
            setError(null);
        } finally {
            setIsLoading(false);
        }
    }, [getLanguageApi, mergeLanguages, setAppLanguage]);

    const updateLanguage = useCallback(async (language: string): Promise<boolean> => {
        const normalizedCode = resolveLanguageCode(language);
        if (normalizedCode === currentLanguage) return true;

        setIsLoading(true);
        setError(null);

        try {
            const response = await updateLanguageApi.execute({ language: normalizedCode });

            if (response && response.success) {
                const persistedCode = resolveLanguageCode(response.language);
                setCurrentLanguage(persistedCode);
                await secureStorage.set(STORAGE_KEYS.LANGUAGE, persistedCode);
                await setAppLanguage(persistedCode);
                return true;
            }

            throw new Error(updateLanguageApi.error || 'Failed to update language');
        } catch (err) {
            console.error('Error updating language:', err);
            setCurrentLanguage(normalizedCode);
            await secureStorage.set(STORAGE_KEYS.LANGUAGE, normalizedCode);
            await setAppLanguage(normalizedCode);
            setError(null);
            return true;
        } finally {
            setIsLoading(false);
        }
    }, [currentLanguage, setAppLanguage, updateLanguageApi]);

    // Fetch languages on mount
    useEffect(() => {
        fetchLanguages();
    }, [fetchLanguages]);

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
