import { createContext } from 'react';
import { type Locale, type Translations } from './translations.ts';

export interface I18nContextValue {
    locale: Locale;
    t: Translations;
    setLocale: (locale: Locale) => void;
}

export const I18nContext = createContext<I18nContextValue | null>(null);
