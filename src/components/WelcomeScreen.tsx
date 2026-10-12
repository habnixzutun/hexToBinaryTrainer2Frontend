import { useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, ArrowRight, Globe } from 'lucide-react';
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
        if (name.trim().length >= 2) onJoin(name.trim());
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <motion.button
                onClick={toggleLocale}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="fixed top-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 border border-neutral-800 hover:border-neutral-700 rounded text-[10px] font-semibold text-neutral-400 hover:text-neutral-200 transition-colors"
            >
                <Globe strokeWidth={1.5} size={11} />
                {locale === 'de' ? 'EN' : 'DE'}
            </motion.button>

            <main className="w-full max-w-xs">
                <div className="flex items-center gap-2 mb-8">
                    <Terminal strokeWidth={1.5} size={16} className="text-emerald-500" />
                    <span className="text-xs font-bold tracking-wider text-neutral-400 uppercase">IT Trainer</span>
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-white mb-2">{t.welcomeTitle}</h1>
                <p className="text-sm text-neutral-400 mb-8 leading-relaxed">{t.welcomeSubtitle}</p>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="border-b border-neutral-800 focus-within:border-neutral-600 transition-colors">
                        <input
                            id="game-input-field"
                            name="binary-input-unique"
                            type="text"
                            autoComplete="one-time-code"
                            autoFocus
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder={t.usernamePlaceholder}
                            className="w-full bg-transparent py-2 text-sm text-white placeholder-neutral-700 focus:outline-none"
                        />
                    </div>
                    <motion.button
                        type="submit"
                        disabled={name.trim().length < 2}
                        whileHover={{ scale: name.trim().length >= 2 ? 1.02 : 1 }}
                        whileTap={{ scale: name.trim().length >= 2 ? 0.98 : 1 }}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-900 disabled:text-neutral-700 text-black font-semibold py-2 rounded text-sm transition-all mt-4"
                    >
                        {t.startButton}
                        <ArrowRight strokeWidth={2} size={13} />
                    </motion.button>
                </form>
            </main>
        </div>
    );
}
