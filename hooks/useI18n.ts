import { useContext } from "react";
import { LanguageContext } from "@/context/LanguageContext";

export const useI18n = () => {
  const context = useContext(LanguageContext);
  return context;
};
