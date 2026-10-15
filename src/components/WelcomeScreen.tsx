import { useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, ArrowRight, Globe, Sun, Moon } from 'lucide-react';
import { useI18n } from '../i18n/useI18n.ts';
import { type Locale } from '../i18n/translations.ts';
import { useTheme } from '../theme/useTheme.ts';

interface Props {
    onJoin: (name: string) => void;
}

export default function WelcomeScreen({ onJoin }: Props) {
    const [name, setName] = useState('');
    const { t, locale, setLocale } = useI18n();
    const { theme, toggleTheme } = useTheme();

    const toggleLocale = (): void => {
        const next: Locale = locale === 'de' ? 'en' : 'de';
        setLocale(next);
    };

    const handleSubmit = (e: React.FormEvent): void => {
        e.preventDefault();
        if (name.trim().length >= 2) onJoin(name.trim());
    };

    const isNameValid = name.trim().length >= 2;

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-4">
            {/* Top-right controls: theme toggle + language toggle */}
            <div className="fixed top-4 right-4 flex items-center gap-1.5" role="toolbar" aria-label="Settings">
                <motion.button
                    onClick={toggleTheme}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center justify-center w-9 h-9 border border-outline hover:border-on-surface-subtle rounded text-on-surface-faint hover:text-on-surface-dim transition-colors"
                    aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                >
                    {theme === 'dark'
                        ? <Sun strokeWidth={1.5} size={13} aria-hidden="true" />
                        : <Moon strokeWidth={1.5} size={13} aria-hidden="true" />
                    }
                </motion.button>
                <motion.button
                    onClick={toggleLocale}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-1.5 px-2.5 h-9 border border-outline hover:border-on-surface-subtle rounded text-[10px] font-semibold text-on-surface-faint hover:text-on-surface-dim transition-colors"
                    aria-label={locale === 'de' ? 'Switch to English' : 'Auf Deutsch wechseln'}
                >
                    <Globe strokeWidth={1.5} size={11} aria-hidden="true" />
                    <span>{locale === 'de' ? 'EN' : 'DE'}</span>
                </motion.button>
            </div>

            <main className="w-full max-w-xs" aria-labelledby="welcome-heading">
                <div className="flex items-center gap-2 mb-8">
                    <Terminal strokeWidth={1.5} size={16} className="text-accent" aria-hidden="true" />
                    <span className="text-xs font-bold tracking-wider text-on-surface-faint uppercase">IT Trainer</span>
                </div>

                <h1 id="welcome-heading" className="text-2xl font-bold tracking-tight text-on-surface mb-2">
                    {t.welcomeTitle}
                </h1>
                <p className="text-sm text-on-surface-faint mb-8 leading-relaxed">
                    {t.welcomeSubtitle}
                </p>

                <form onSubmit={handleSubmit} className="space-y-3" aria-label="Login form">
                    <div className="border-b border-outline focus-within:border-accent transition-colors">
                        <label htmlFor="username-input" className="sr-only">
                            Username
                        </label>
                        <input
                            id="username-input"
                            type="text"
                            autoComplete="username"
                            autoFocus
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder={t.usernamePlaceholder}
                            aria-required="true"
                            aria-invalid={!isNameValid && name.length > 0}
                            aria-describedby="username-help"
                            className="w-full bg-transparent py-2 text-sm text-on-surface placeholder-on-surface-subtle focus:outline-none"
                        />
                        <span id="username-help" className="sr-only">
                            Enter your username (minimum 2 characters)
                        </span>
                    </div>
                    {!isNameValid && name.length > 0 && (
                        <p className="text-xs text-error-text" role="alert">
                            {locale === 'de' ? 'Mindestens 2 Zeichen erforderlich' : 'Minimum 2 characters required'}
                        </p>
                    )}
                    <motion.button
                        type="submit"
                        disabled={!isNameValid}
                        whileHover={{ scale: isNameValid ? 1.02 : 1 }}
                        whileTap={{ scale: isNameValid ? 0.98 : 1 }}
                        aria-label={t.startButton}
                        className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-bright disabled:bg-surface-raised disabled:text-on-surface-subtle text-white font-semibold py-2 rounded text-sm transition-all mt-4"
                    >
                        <span>{t.startButton}</span>
                        <ArrowRight strokeWidth={2} size={13} aria-hidden="true" />
                    </motion.button>
                </form>
            </main>
        </div>
    );
}
