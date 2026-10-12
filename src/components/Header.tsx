import { motion } from 'framer-motion';
import { Terminal, LogOut, Globe } from 'lucide-react';
import { useI18n } from '../i18n/useI18n.ts';
import { type Locale } from '../i18n/translations.ts';

interface HeaderProps {
    activeApp: 'hex' | 'unicode';
    setActiveApp: (app: 'hex' | 'unicode') => void;
    username: string;
    onLogout: () => void;
}

export default function Header({ activeApp, setActiveApp, username, onLogout }: HeaderProps) {
    const { t, locale, setLocale } = useI18n();

    const toggleLocale = (): void => {
        const next: Locale = locale === 'de' ? 'en' : 'de';
        setLocale(next);
    };

    return (
        <nav className="bg-zinc-950/90 backdrop-blur-md sticky top-0 z-50 border-b border-zinc-900">
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">

                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <Terminal strokeWidth={1.5} size={16} className="text-emerald-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold tracking-tight text-white leading-none">
                            IT <span className="text-zinc-600">{t.appTitleAccent}</span>
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold">
                                {username}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                        {(['hex', 'unicode'] as const).map((app) => (
                            <motion.button
                                key={app}
                                onClick={() => setActiveApp(app)}
                                whileTap={{ scale: 0.97 }}
                                className={`relative px-4 py-1.5 rounded-md font-semibold text-xs transition-colors ${
                                    activeApp === app
                                        ? 'text-zinc-950'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                            >
                                {activeApp === app && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-emerald-400 rounded-md"
                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                                    />
                                )}
                                <span className="relative z-10">
                                    {app === 'hex' ? t.navHexBin : t.navUnicode}
                                </span>
                            </motion.button>
                        ))}
                    </div>

                    <motion.button
                        onClick={toggleLocale}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1 w-auto px-2.5 h-8 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors text-xs font-semibold text-zinc-400 hover:text-zinc-200"
                        title={locale === 'de' ? 'Switch to English' : 'Auf Deutsch wechseln'}
                    >
                        <Globe strokeWidth={1.5} size={13} />
                        {locale === 'de' ? 'EN' : 'DE'}
                    </motion.button>

                    <motion.button
                        onClick={onLogout}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-red-900/60 hover:bg-red-950/30 transition-colors group"
                        title={t.logoutTitle}
                    >
                        <LogOut strokeWidth={1.5} size={14} className="text-zinc-500 group-hover:text-red-400 transition-colors" />
                    </motion.button>
                </div>
            </div>
        </nav>
    );
}
