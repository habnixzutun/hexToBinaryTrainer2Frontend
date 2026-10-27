import { useState } from 'react';
import { translations, type Locale } from './translations.ts';
import { I18nContext } from './i18nContext.ts';
import { persistItem } from '../utils/persistence.ts';

interface Props {
    children: React.ReactNode;
}

export function I18nProvider({ children }: Props) {
    const [locale, setLocale] = useState<Locale>(() => {
        const saved = localStorage.getItem('locale');
        return saved === 'en' ? 'en' : 'de';
    });

    const handleSetLocale = (next: Locale): void => {
        persistItem('locale', next);
        setLocale(next);
    };

    return (
        <I18nContext.Provider value={{ locale, t: translations[locale], setLocale: handleSetLocale }}>
            {children}
        </I18nContext.Provider>
    );
}
