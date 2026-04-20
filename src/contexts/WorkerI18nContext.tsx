'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { LANGS, TRANSLATIONS, type LangCode, type TranslationKey } from '@/lib/worker-translations';

interface WorkerI18nContextValue {
  lang: LangCode;
  setLang: (code: LangCode) => void;
  t: (key: TranslationKey) => string;
}

const WorkerI18nContext = createContext<WorkerI18nContextValue | null>(null);

export function WorkerI18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>('en');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('sb_lang') as LangCode | null;
    if (stored && LANGS.some((l) => l.code === stored)) {
      setLangState(stored);
    }
  }, []);

  const setLang = (code: LangCode) => {
    setLangState(code);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sb_lang', code);
    }
  };

  const t = (key: TranslationKey): string => TRANSLATIONS[lang][key] ?? TRANSLATIONS.en[key] ?? key;

  return (
    <WorkerI18nContext.Provider value={{ lang, setLang, t }}>{children}</WorkerI18nContext.Provider>
  );
}

export function useWorkerI18n(): WorkerI18nContextValue {
  const ctx = useContext(WorkerI18nContext);
  if (!ctx) throw new Error('useWorkerI18n must be used within WorkerI18nProvider');
  return ctx;
}
