'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import translations from '@/lib/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('ar');

  useEffect(() => {
    const saved = localStorage.getItem('lang');
    if (saved === 'en' || saved === 'ar') setLang(saved);
  }, []);

  const toggleLang = () => {
    const next = lang === 'ar' ? 'en' : 'ar';
    setLang(next);
    localStorage.setItem('lang', next);
  };

  const t = translations[lang];
  const isRTL = lang === 'ar';

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t, isRTL }}>
      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        lang={lang}
      >
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
