import { motion } from 'framer-motion';
import { Terminal, Hash, Binary, LogOut, Globe, Trophy, Sun, Moon } from 'lucide-react';
import { useI18n } from '../i18n/useI18n.ts';
import { type Locale } from '../i18n/translations.ts';
import { useTheme } from '../theme/useTheme.ts';
import { type UserType } from '../services/api.ts';
import { type ActiveApp } from '../App.tsx';

interface Props {
    activeApp: ActiveApp;
    setActiveApp: (app: ActiveApp) => void;
    user: UserType;
    onLogout: () => void;
}

export default function Sidebar({ activeApp, setActiveApp, user, onLogout }: Props) {
    const { t, locale, setLocale } = useI18n();
    const { theme, toggleTheme } = useTheme();

    const toggleLocale = (): void => {
        const next: Locale = locale === 'de' ? 'en' : 'de';
        setLocale(next);
    };

    const navItems = [
        { id: 'hex' as const, label: t.navHexBin, icon: Hash },
        { id: 'unicode' as const, label: t.navUnicode, icon: Binary },
        { id: 'leaderboard' as const, label: t.leaderboardTitle, icon: Trophy },
    ];

    return (
        <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-outline-faint bg-surface">
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 h-16 border-b border-outline-faint">
                <Terminal strokeWidth={1.5} size={18} className="text-accent shrink-0" />
                <span className="text-base font-bold tracking-wider text-on-surface-dim uppercase">
                    IT Trainer
                </span>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4">
                <p className="px-2 mb-2 text-xs font-semibold uppercase tracking-widest text-on-surface-faint">
                    Modus
                </p>
                {navItems.map(({ id, label, icon: Icon }) => (
                    <motion.button
                        key={id}
                        onClick={() => setActiveApp(id)}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-base font-medium transition-colors mb-1 ${
                            activeApp === id
                                ? 'bg-surface-raised text-on-surface'
                                : 'text-on-surface-faint hover:text-on-surface-dim hover:bg-surface-alt'
                        }`}
                    >
                        <Icon strokeWidth={1.5} size={17} className={activeApp === id ? 'text-accent' : ''} />
                        {label}
                    </motion.button>
                ))}
            </nav>

            {/* User section */}
            <div className="border-t border-outline-faint px-5 py-4 space-y-4">
                {/* User info */}
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                    <span className="text-base text-on-surface-dim font-medium truncate">{user.name}</span>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-1 text-center">
                    <div>
                        <div className="text-lg font-bold text-accent">{user.correct}</div>
                        <div className="text-xs text-on-surface-faint uppercase tracking-wide">OK</div>
                    </div>
                    <div>
                        <div className="text-lg font-bold text-error-text">{user.incorrect}</div>
                        <div className="text-xs text-on-surface-faint uppercase tracking-wide">ERR</div>
                    </div>
                    <div>
                        <div className="text-lg font-bold text-amber-500">{user.points}</div>
                        <div className="text-xs text-on-surface-faint uppercase tracking-wide">PTS</div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                    <motion.button
                        onClick={toggleTheme}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1.5 px-2.5 py-2 rounded text-sm text-on-surface-faint hover:text-on-surface-dim transition-colors"
                        title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    >
                        {theme === 'dark'
                            ? <Sun strokeWidth={1.5} size={15} />
                            : <Moon strokeWidth={1.5} size={15} />
                        }
                    </motion.button>
                    <motion.button
                        onClick={toggleLocale}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1.5 px-2.5 py-2 rounded text-sm font-semibold text-on-surface-faint hover:text-on-surface-dim transition-colors"
                    >
                        <Globe strokeWidth={1.5} size={15} />
                        {locale === 'de' ? 'EN' : 'DE'}
                    </motion.button>
                    <motion.button
                        onClick={onLogout}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1.5 px-2.5 py-2 rounded text-sm text-on-surface-faint hover:text-error-text transition-colors ml-auto"
                        title={t.logoutTitle}
                    >
                        <LogOut strokeWidth={1.5} size={15} />
                    </motion.button>
                </div>
            </div>
        </aside>
    );
}
