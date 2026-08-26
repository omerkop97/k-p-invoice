"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { dictionaries, locales, type Dict, type Lang } from "@/lib/i18n";

interface LanguageContextValue {
  lang: Lang;
  locale: string;
  t: Dict;
  setLang: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("nl");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("lang");
      if (stored === "nl" || stored === "en") setLangState(stored);
    } catch {
      // localStorage unavailable (private mode) — keep the default
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  function setLang(next: Lang) {
    setLangState(next);
    try {
      localStorage.setItem("lang", next);
    } catch {
      // best effort only
    }
  }

  return (
    <LanguageContext.Provider
      value={{ lang, locale: locales[lang], t: dictionaries[lang], setLang }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}
