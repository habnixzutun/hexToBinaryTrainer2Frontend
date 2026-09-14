import { useState } from 'react';
import { useI18n } from '../i18n/useI18n.ts';
import { type Locale } from '../i18n/translations.ts';

interface Props {
    onJoin: (name: string) => void;
}

export default function WelcomeScreen({ onJoin }: Props) {
    const [name, setName] = useState('');
    const { t, locale, setLocale } = useI18n();

    const toggleLocale = (): void => {
        const next: Locale = locale === 'de' ? 'en' : 'de';
        setLocale(next);
    };

    const handleSubmit = (e: React.FormEvent): void => {
        e.preventDefault();
        if (name.trim().length >= 2) {
            onJoin(name.trim());
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <button
                onClick={toggleLocale}
                className="fixed top-4 right-4 flex items-center justify-center w-9 h-9 rounded-xl bg-slate-700/50 border border-slate-600 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all duration-300 text-xs font-bold text-slate-400 hover:text-indigo-400"
                title={locale === 'de' ? 'Switch to English' : 'Auf Deutsch wechseln'}
            >
                {locale === 'de' ? 'EN' : 'DE'}
            </button>

            <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
                <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">
                    {t.welcomeTitle}
                </h1>
                <p className="text-slate-400 mb-8">{t.welcomeSubtitle}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        id="game-input-field"
                        name="binary-input-unique"
                        type="text"
                        autoComplete="one-time-code"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t.usernamePlaceholder}
                        className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-6 py-4 text-white text-xl focus:outline-none focus:border-blue-500 transition-colors text-center"
                    />
                    <button
                        type="submit"
                        disabled={name.trim().length < 2}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-bold py-4 rounded-xl text-xl transition-all active:scale-95 shadow-lg shadow-blue-900/20"
                    >
                        {t.startButton}
                    </button>
                </form>
            </div>
        </div>
    );
}
