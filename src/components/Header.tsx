import { motion } from 'framer-motion';
import { Terminal, LogOut, Globe, Sun, Moon } from 'lucide-react';
import { useI18n } from '../i18n/useI18n.ts';
import { useTheme } from '../theme/useTheme.ts';
import { type Locale } from '../i18n/translations.ts';

interface HeaderProps {
    activeApp: 'hex' | 'unicode';
    setActiveApp: (app: 'hex' | 'unicode') => void;
    username: string;
    onLogout: () => void;
}

export default function Header({ activeApp, setActiveApp, username, onLogout }: HeaderProps) {
    const { t, locale, setLocale } = useI18n();
    const { theme, toggleTheme } = useTheme();

    const toggleLocale = (): void => {
        const next: Locale = locale === 'de' ? 'en' : 'de';
        setLocale(next);
    };

    return (
        <header className="bg-surface/90 backdrop-blur-md sticky top-0 z-30 border-b border-outline" role="banner">
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
                {/* Logo and user info */}
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-muted border border-accent/20 shrink-0">
                        <Terminal strokeWidth={1.5} size={16} className="text-accent" aria-hidden="true" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold tracking-tight text-on-surface leading-none truncate">
                            IT <span className="text-on-surface-subtle">{t.appTitleAccent}</span>
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" aria-hidden="true" />
                            <span className="text-[9px] text-on-surface-faint uppercase tracking-widest font-semibold truncate">
                                {username}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions - responsive layout */}
                <div className="flex items-center gap-2">
                    {/* Tab switcher - hide on very small screens */}
                    <nav className="hidden sm:flex bg-surface-raised p-0.5 rounded-lg border border-outline" aria-label="Trainer modes">
                        {(['hex', 'unicode'] as const).map((app) => (
                            <motion.button
                                key={app}
                                onClick={() => setActiveApp(app)}
                                whileTap={{ scale: 0.97 }}
                                aria-label={app === 'hex' ? 'Hex/Binary trainer' : 'Unicode trainer'}
                                aria-current={activeApp === app ? 'page' : undefined}
                                className={`relative px-4 py-1.5 rounded-md font-semibold text-xs transition-colors ${
                                    activeApp === app
                                        ? 'text-on-surface'
                                        : 'text-on-surface-faint hover:text-on-surface-dim'
                                }`}
                            >
                                {activeApp === app && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-accent rounded-md"
                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                                    />
                                )}
                                <span className="relative z-10">
                                    {app === 'hex' ? t.navHexBin : t.navUnicode}
                                </span>
                            </motion.button>
                        ))}
                    </nav>

                    {/* Theme toggle */}
                    <motion.button
                        onClick={toggleTheme}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-raised border border-outline hover:border-on-surface-subtle transition-colors text-on-surface-faint hover:text-on-surface-dim"
                        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                        title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    >
                        {theme === 'dark'
                            ? <Sun strokeWidth={1.5} size={13} aria-hidden="true" />
                            : <Moon strokeWidth={1.5} size={13} aria-hidden="true" />
                        }
                    </motion.button>

                    {/* Language toggle */}
                    <motion.button
                        onClick={toggleLocale}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1 w-auto px-2.5 h-9 rounded-lg bg-surface-raised border border-outline hover:border-on-surface-subtle transition-colors text-xs font-semibold text-on-surface-faint hover:text-on-surface-dim"
                        aria-label={locale === 'de' ? 'Switch to English' : 'Auf Deutsch wechseln'}
                        title={locale === 'de' ? 'Switch to English' : 'Auf Deutsch wechseln'}
                    >
                        <Globe strokeWidth={1.5} size={13} aria-hidden="true" />
                        <span>{locale === 'de' ? 'EN' : 'DE'}</span>
                    </motion.button>

                    {/* Logout */}
                    <motion.button
                        onClick={onLogout}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-raised border border-outline hover:border-red-500/60 hover:bg-error-muted transition-colors group"
                        aria-label={t.logoutTitle}
                        title={t.logoutTitle}
                    >
                        <LogOut strokeWidth={1.5} size={14} className="text-on-surface-faint group-hover:text-error-text transition-colors" aria-hidden="true" />
                    </motion.button>
                </div>
            </div>
        </header>
    );
}
