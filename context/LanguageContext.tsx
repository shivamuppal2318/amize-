import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { secureStorage, STORAGE_KEYS } from "@/lib/auth/storage";
import { translations, TranslationKey } from "@/lib/i18n/translations";
import { resolveLanguageCode, resolveLanguageName } from "@/lib/i18n/languages";

type LanguageContextValue = {
  languageCode: string;
  languageName: string;
  setLanguage: (language: string) => Promise<void>;
  t: (key: TranslationKey) => string;
  ready: boolean;
};

const fallbackContext: LanguageContextValue = {
  languageCode: "en",
  languageName: "English",
  setLanguage: async () => {},
  t: (key) => translations.en[key] || key,
  ready: false,
};

export const LanguageContext =
  createContext<LanguageContextValue>(fallbackContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [languageCode, setLanguageCode] = useState("en");
  const [ready, setReady] = useState(false);

  const loadLanguage = useCallback(async () => {
    const stored = await secureStorage.get(STORAGE_KEYS.LANGUAGE);
    if (stored) {
      setLanguageCode(resolveLanguageCode(stored) || stored);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    loadLanguage();
  }, [loadLanguage]);

  const setLanguage = useCallback(async (language: string) => {
    const code = resolveLanguageCode(language);
    setLanguageCode(code);
    await secureStorage.set(STORAGE_KEYS.LANGUAGE, language);
  }, []);

  const value = useMemo<LanguageContextValue>(() => {
    const table = translations[languageCode] || translations.en;
    return {
      languageCode,
      languageName: resolveLanguageName(languageCode),
      setLanguage,
      t: (key) => table[key] || translations.en[key] || key,
      ready,
    };
  }, [languageCode, ready, setLanguage]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
