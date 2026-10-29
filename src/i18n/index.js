import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { I18nManager, Platform } from 'react-native';
import { db } from '../db/db';
import ar from './ar';
import en from './en';

const DICTS = { en, ar };
export const LANGUAGES = [
  { value: 'en', label: 'English', native: 'English', rtl: false },
  { value: 'ar', label: 'Arabic', native: 'العربية', rtl: true },
];

const I18nContext = createContext({ lang: 'en', isRTL: false, t: (k, f) => f ?? k, setLanguage: async () => {} });

function applyDirection(rtl) {
  if (Platform.OS === 'web') {
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
    return false;
  }
  // Native layout direction only flips after an app restart.
  const changed = I18nManager.isRTL !== rtl;
  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);
  return changed;
}

export function I18nProvider({ children }) {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    db.getMeta('lang').then((saved) => {
      if (saved && DICTS[saved]) {
        setLang(saved);
        applyDirection(LANGUAGES.find((l) => l.value === saved).rtl);
      }
    });
  }, []);

  // Returns true when the app must be restarted for the direction change to show (native only).
  const setLanguage = useCallback(async (next) => {
    await db.setMeta('lang', next);
    setLang(next);
    return applyDirection(LANGUAGES.find((l) => l.value === next).rtl);
  }, []);

  // t('home.greeting', 'Good morning', { name }) — falls back to English, then to the provided fallback.
  const t = useCallback((key, fallback, vars) => {
    let s = DICTS[lang][key] ?? en[key] ?? fallback ?? key;
    if (vars) Object.entries(vars).forEach(([k, v]) => { s = s.replaceAll(`{${k}}`, String(v)); });
    return s;
  }, [lang]);

  const value = useMemo(() => ({ lang, isRTL: lang === 'ar', t, setLanguage }), [lang, t, setLanguage]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
