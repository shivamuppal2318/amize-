import { Language } from "@/hooks/useLanguage";

export const LOCAL_LANGUAGES: Language[] = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "es", name: "Spanish" },
];

export const resolveLanguageCode = (language: string) => {
  const match = LOCAL_LANGUAGES.find(
    (item) => item.name.toLowerCase() === language.toLowerCase()
  );
  return match?.code ?? "en";
};

export const resolveLanguageName = (code: string) => {
  const match = LOCAL_LANGUAGES.find((item) => item.code === code);
  return match?.name ?? "English";
};
