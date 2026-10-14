import { motion } from 'framer-motion';
import { Terminal, Hash, Binary, LogOut, Globe, Trophy } from 'lucide-react';
import { useI18n } from '../i18n/useI18n.ts';
import { type Locale } from '../i18n/translations.ts';
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
        <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-neutral-800/60 bg-black">
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 h-16 border-b border-neutral-800/60">
                <Terminal strokeWidth={1.5} size={18} className="text-emerald-500 shrink-0" />
                <span className="text-base font-bold tracking-wider text-neutral-300 uppercase">
                    IT Trainer
                </span>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4">
                <p className="px-2 mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-500">
                    Modus
                </p>
                {navItems.map(({ id, label, icon: Icon }) => (
                    <motion.button
                        key={id}
                        onClick={() => setActiveApp(id)}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-base font-medium transition-colors mb-1 ${
                            activeApp === id
                                ? 'bg-neutral-800 text-white'
                                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                        }`}
                    >
                        <Icon strokeWidth={1.5} size={17} className={activeApp === id ? 'text-emerald-500' : ''} />
                        {label}
                    </motion.button>
                ))}
            </nav>

            {/* User section */}
            <div className="border-t border-neutral-800/60 px-5 py-4 space-y-4">
                {/* User info */}
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-base text-neutral-300 font-medium truncate">{user.name}</span>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-1 text-center">
                    <div>
                        <div className="text-lg font-bold text-emerald-500">{user.correct}</div>
                        <div className="text-xs text-neutral-500 uppercase tracking-wide">OK</div>
                    </div>
                    <div>
                        <div className="text-lg font-bold text-red-500">{user.incorrect}</div>
                        <div className="text-xs text-neutral-500 uppercase tracking-wide">ERR</div>
                    </div>
                    <div>
                        <div className="text-lg font-bold text-amber-400">{user.points}</div>
                        <div className="text-xs text-neutral-500 uppercase tracking-wide">PTS</div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                    <motion.button
                        onClick={toggleLocale}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1.5 px-2.5 py-2 rounded text-sm font-semibold text-neutral-400 hover:text-neutral-200 transition-colors"
                    >
                        <Globe strokeWidth={1.5} size={15} />
                        {locale === 'de' ? 'EN' : 'DE'}
                    </motion.button>
                    <motion.button
                        onClick={onLogout}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1.5 px-2.5 py-2 rounded text-sm text-neutral-400 hover:text-red-400 transition-colors ml-auto"
                        title={t.logoutTitle}
                    >
                        <LogOut strokeWidth={1.5} size={15} />
                    </motion.button>
                </div>
            </div>
        </aside>
    );
}
