import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Hash, Binary, LogOut, Globe, Trophy, Sun, Moon, ChevronDown } from 'lucide-react';
import { useI18n } from '../i18n/useI18n.ts';
import { type Locale } from '../i18n/translations.ts';
import { useTheme } from '../theme/useTheme.ts';
import { type UserType } from '../services/api.ts';
import { type ActiveApp, type HexBinMode } from '../App.tsx';
import BitByteSelector from './BitByteSelector.tsx';

const HEX_BIN_MODES: HexBinMode[] = ['HexToBin', 'HexToDec', 'BinToHex', 'BinToDec', 'DecToHex', 'DecToBin'];
const BIT_OPTIONS = [4, 8, 16, 32];
const BYTE_OPTIONS = [1, 2, 3, 4];

interface Props {
    activeApp: ActiveApp;
    setActiveApp: (app: ActiveApp) => void;
    user: UserType;
    onLogout: () => void;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
    hideLeaderboardNav: boolean;
    activeHexMode?: HexBinMode;
    onHexModeChange?: (mode: HexBinMode) => void;
    isMobile: boolean;
    bits?: number;
    onBitsChange?: (bits: number) => void;
    bytes?: number;
    onBytesChange?: (bytes: number) => void;
}

export default function Sidebar({
    activeApp,
    setActiveApp,
    user,
    onLogout,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    hideLeaderboardNav,
    activeHexMode,
    onHexModeChange,
    isMobile,
    bits,
    onBitsChange,
    bytes,
    onBytesChange,
}: Props) {
    const { t, locale, setLocale } = useI18n();
    const { theme, toggleTheme } = useTheme();
    const [isHexExpanded, setIsHexExpanded] = useState(true);

    const toggleLocale = (): void => {
        const next: Locale = locale === 'de' ? 'en' : 'de';
        setLocale(next);
    };

    const navItems = [
        { id: 'hex' as const, label: t.navHexBin, icon: Hash, ariaLabel: 'Hex/Binary trainer' },
        { id: 'unicode' as const, label: t.navUnicode, icon: Binary, ariaLabel: 'Unicode trainer' },
        ...(hideLeaderboardNav
            ? []
            : [{ id: 'leaderboard' as const, label: t.leaderboardTitle, icon: Trophy, ariaLabel: 'Leaderboard' }]
        ),
    ];

    const handleNavClick = (id: ActiveApp) => {
        setActiveApp(id);
        setIsMobileMenuOpen(false);
    };

    const handleHexModeChange = (mode: HexBinMode): void => {
        if (onHexModeChange) {
            onHexModeChange(mode);
        }
    };

    return (
        <>
            {/* Mobile overlay */}
            <motion.div
                initial={false}
                animate={{ opacity: isMobileMenuOpen ? 1 : 0 }}
                className="lg:hidden fixed inset-0 bg-black/50 z-40 pointer-events-none"
                style={{ pointerEvents: isMobileMenuOpen ? 'auto' : 'none' }}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-hidden="true"
            />

            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-40
                    w-64 flex flex-col border-r border-outline-faint bg-surface
                    transform transition-transform duration-300 ease-in-out
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${isMobile ? 'pt-14' : ''}
                `}
                aria-label="Main navigation"
            >
                {/* Logo — only visible on lg+ (on mobile it's in the global header) */}
                <div className="lg:flex hidden items-center gap-3 px-5 h-16 border-b border-outline-faint">
                    <Terminal strokeWidth={1.5} size={18} className="text-accent shrink-0" aria-hidden="true" />
                    <span className="text-base font-bold tracking-wider text-on-surface-dim uppercase">
                        IT Trainer
                    </span>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 overflow-y-auto" aria-label="Application modes">
                    <p className="px-2 mb-2 text-xs font-semibold uppercase tracking-widest text-on-surface-faint" id="nav-heading">
                        {t.modus}
                    </p>
                    <ul className="space-y-1" role="list" aria-labelledby="nav-heading">
                        {navItems.map(({ id, label, icon: Icon, ariaLabel }) => (
                            <li key={id}>
                                {id === 'hex' ? (
                                    <div>
                                        <motion.button
                                            onClick={() => {
                                                setActiveApp(id);
                                                setIsHexExpanded(prev => !prev);
                                            }}
                                            whileTap={{ scale: 0.98 }}
                                            aria-label={ariaLabel}
                                            aria-expanded={isHexExpanded}
                                            aria-current={activeApp === id ? 'page' : undefined}
                                            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-md text-base font-medium transition-colors ${
                                                activeApp === id
                                                    ? 'bg-surface-raised text-on-surface'
                                                    : 'text-on-surface-faint hover:text-on-surface-dim hover:bg-surface-alt'
                                            }`}
                                        >
                                            <span className="flex items-center gap-3">
                                                <Icon strokeWidth={1.5} size={17} className={activeApp === id ? 'text-accent' : ''} aria-hidden="true" />
                                                {label}
                                            </span>
                                            <ChevronDown
                                                strokeWidth={2}
                                                size={14}
                                                className={`transition-transform ${isHexExpanded ? 'rotate-180' : ''}`}
                                                aria-hidden="true"
                                            />
                                        </motion.button>
                                        <AnimatePresence initial={false}>
                                            {isHexExpanded && activeApp === 'hex' && onHexModeChange && (
                                                <motion.ul
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden ml-4 mt-1 space-y-0.5"
                                                    role="list"
                                                    aria-label={t.hexBinModes}
                                                >
                                                    {HEX_BIN_MODES.map((m) => (
                                                        <li key={m}>
                                                            <motion.button
                                                                onClick={() => {
                                                                    handleHexModeChange(m);
                                                                    if (isMobile) setIsMobileMenuOpen(false);
                                                                }}
                                                                whileTap={{ scale: 0.98 }}
                                                                aria-label={`Mode: ${m}`}
                                                                aria-current={activeHexMode === m ? 'true' : undefined}
                                                                className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                                                    activeHexMode === m
                                                                        ? 'bg-surface-raised text-on-surface'
                                                                        : 'text-on-surface-faint hover:text-on-surface-dim hover:bg-surface-alt'
                                                                }`}
                                                            >
                                                                <span className="pl-0.5">
                                                                    {t[`mode${m}` as keyof typeof t] as string}
                                                                </span>
                                                            </motion.button>
                                                        </li>
                                                    ))}
                                                </motion.ul>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    <motion.button
                                        onClick={() => handleNavClick(id)}
                                        whileTap={{ scale: 0.98 }}
                                        aria-label={ariaLabel}
                                        aria-current={activeApp === id ? 'page' : undefined}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-base font-medium transition-colors ${
                                            activeApp === id
                                                ? 'bg-surface-raised text-on-surface'
                                                : 'text-on-surface-faint hover:text-on-surface-dim hover:bg-surface-alt'
                                        }`}
                                    >
                                        <Icon strokeWidth={1.5} size={17} className={activeApp === id ? 'text-accent' : ''} aria-hidden="true" />
                                        {label}
                                    </motion.button>
                                )}
                            </li>
                        ))}
                    </ul>

                    {/* Unified Bit/Byte selector — mobile only */}
                    {isMobile && (
                        (activeApp === 'hex' && bits !== undefined && onBitsChange) ||
                        (activeApp === 'unicode' && bytes !== undefined && onBytesChange)
                    ) && (
                        <div className="mt-4">
                            {activeApp === 'hex' ? (
                                <BitByteSelector
                                    options={BIT_OPTIONS}
                                    value={bits!}
                                    onChange={onBitsChange!}
                                    label={t.bits}
                                    singularLabel=""
                                />
                            ) : (
                                <BitByteSelector
                                    options={BYTE_OPTIONS}
                                    value={bytes!}
                                    onChange={onBytesChange!}
                                    label={t.bytes}
                                    singularLabel={t.byte}
                                />
                            )}
                        </div>
                    )}
                </nav>

                {/* User section */}
                <div className="border-t border-outline-faint px-5 py-4 space-y-4">
                    {/* User info */}
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-accent shrink-0" role="status" aria-label="Online" />
                        <span className="text-base text-on-surface-dim font-medium truncate">{user.name}</span>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-1 text-center" aria-label="Your statistics">
                        <div>
                            <div className="text-lg font-bold text-accent">{user.correct}</div>
                            <div className="text-xs text-on-surface-faint uppercase tracking-wide" aria-label="Correct answers">OK</div>
                        </div>
                        <div>
                            <div className="text-lg font-bold text-error-text">{user.incorrect}</div>
                            <div className="text-xs text-on-surface-faint uppercase tracking-wide" aria-label="Wrong answers">ERR</div>
                        </div>
                        <div>
                            <div className="text-lg font-bold text-points">{user.points}</div>
                            <div className="text-xs text-on-surface-faint uppercase tracking-wide" aria-label="Points">PTS</div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                        <motion.button
                            onClick={toggleTheme}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-1.5 px-2.5 min-h-[44px] rounded text-sm text-on-surface-faint hover:text-on-surface-dim transition-colors"
                            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        >
                            {theme === 'dark'
                                ? <Sun strokeWidth={1.5} size={15} aria-hidden="true" />
                                : <Moon strokeWidth={1.5} size={15} aria-hidden="true" />
                            }
                        </motion.button>
                        <motion.button
                            onClick={toggleLocale}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-1.5 px-2.5 min-h-[44px] rounded text-sm font-semibold text-on-surface-faint hover:text-on-surface-dim transition-colors"
                            aria-label={locale === 'de' ? 'Switch to English' : 'Auf Deutsch wechseln'}
                        >
                            <Globe strokeWidth={1.5} size={15} aria-hidden="true" />
                            {locale === 'de' ? 'EN' : 'DE'}
                        </motion.button>
                        <motion.button
                            onClick={onLogout}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-1.5 px-2.5 min-h-[44px] rounded text-sm text-on-surface-faint hover:text-error-text transition-colors ml-auto"
                            aria-label={t.logoutTitle}
                            title={t.logoutTitle}
                        >
                            <LogOut strokeWidth={1.5} size={15} aria-hidden="true" />
                        </motion.button>
                    </div>
                </div>
            </aside>
        </>
    );
}
