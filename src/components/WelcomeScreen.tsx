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

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-4">
            {/* Top-right controls: theme toggle + language toggle */}
            <div className="fixed top-4 right-4 flex items-center gap-1.5">
                <motion.button
                    onClick={toggleTheme}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center justify-center w-8 h-8 border border-outline hover:border-on-surface-subtle rounded text-on-surface-faint hover:text-on-surface-dim transition-colors"
                    title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                >
                    {theme === 'dark'
                        ? <Sun strokeWidth={1.5} size={13} />
                        : <Moon strokeWidth={1.5} size={13} />
                    }
                </motion.button>
                <motion.button
                    onClick={toggleLocale}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-1.5 px-2.5 h-8 border border-outline hover:border-on-surface-subtle rounded text-[10px] font-semibold text-on-surface-faint hover:text-on-surface-dim transition-colors"
                >
                    <Globe strokeWidth={1.5} size={11} />
                    {locale === 'de' ? 'EN' : 'DE'}
                </motion.button>
            </div>

            <main className="w-full max-w-xs">
                <div className="flex items-center gap-2 mb-8">
                    <Terminal strokeWidth={1.5} size={16} className="text-accent" />
                    <span className="text-xs font-bold tracking-wider text-on-surface-faint uppercase">IT Trainer</span>
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-on-surface mb-2">{t.welcomeTitle}</h1>
                <p className="text-sm text-on-surface-faint mb-8 leading-relaxed">{t.welcomeSubtitle}</p>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="border-b border-outline focus-within:border-on-surface-subtle transition-colors">
                        <input
                            id="game-input-field"
                            name="binary-input-unique"
                            type="text"
                            autoComplete="one-time-code"
                            autoFocus
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder={t.usernamePlaceholder}
                            className="w-full bg-transparent py-2 text-sm text-on-surface placeholder-on-surface-subtle focus:outline-none"
                        />
                    </div>
                    <motion.button
                        type="submit"
                        disabled={name.trim().length < 2}
                        whileHover={{ scale: name.trim().length >= 2 ? 1.02 : 1 }}
                        whileTap={{ scale: name.trim().length >= 2 ? 0.98 : 1 }}
                        className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-bright disabled:bg-surface-raised disabled:text-on-surface-subtle text-white font-semibold py-2 rounded text-sm transition-all mt-4"
                    >
                        {t.startButton}
                        <ArrowRight strokeWidth={2} size={13} />
                    </motion.button>
                </form>
            </main>
        </div>
    );
}
