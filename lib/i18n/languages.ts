import { Language } from "@/hooks/useLanguage";

export const LOCAL_LANGUAGES: Language[] = [
  { code: "en", name: "English" },
  { code: "en-US", name: "English (US)" },
  { code: "en-UK", name: "English (UK)" },
  { code: "hi", name: "Hindi" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "zh", name: "Mandarin" },
  { code: "ar", name: "Arabic" },
  { code: "bn", name: "Bengali" },
  { code: "ru", name: "Russian" },
  { code: "pt", name: "Portuguese" },
  { code: "id", name: "Indonesian" },
  { code: "ja", name: "Japanese" },
  { code: "ur", name: "Urdu" },
  { code: "ne", name: "Nepali" },
];

export const resolveLanguageCode = (language: string) => {
  const normalized = language.trim().toLowerCase();
  const directMatch = LOCAL_LANGUAGES.find(
    (item) =>
      item.name.toLowerCase() === normalized ||
      item.code.toLowerCase() === normalized
  );

  if (directMatch) {
    if (directMatch.code.toLowerCase().startsWith("en")) {
      return "en";
    }
    return directMatch.code;
  }

  const baseCode = normalized.split("-")[0];
  const baseMatch = LOCAL_LANGUAGES.find(
    (item) => item.code.toLowerCase() === baseCode
  );

  if (baseMatch) {
    return baseMatch.code;
  }

  return "en";
};

export const resolveLanguageName = (code: string) => {
  const normalized = code.trim().toLowerCase();
  const exactMatch = LOCAL_LANGUAGES.find(
    (item) => item.code.toLowerCase() === normalized
  );

  if (exactMatch) {
    return exactMatch.name;
  }

  const baseCode = normalized.split("-")[0];
  const baseMatch = LOCAL_LANGUAGES.find(
    (item) => item.code.toLowerCase() === baseCode
  );

  return baseMatch?.name ?? "English";
};
