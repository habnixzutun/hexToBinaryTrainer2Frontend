/**
 * HeaderToolbar: settings in the top-right corner (desktop, lg and up).
 *
 * Order left to right: theme, language, account menu, logout. Users expect
 * settings in the top-right corner, so they live here instead of the bottom
 * of the sidebar. Below lg the MobileSettingsMenu takes over.
 */

import { useCallback, useRef, useState, type ReactElement } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Globe, UserRound, LogOut } from 'lucide-react';
import { useI18n } from '../../i18n/useI18n.ts';
import { type Locale } from '../../i18n/translations.ts';
import { useTheme } from '../../theme/useTheme.ts';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useDismissable } from '../../hooks/useDismissable.ts';
import AccountPanel from './AccountPanel.tsx';

interface Props {
    onLogout: () => void;
}

const ICON_BUTTON =
    'flex items-center justify-center gap-1.5 min-w-[44px] min-h-[44px] px-2.5 rounded text-sm text-on-surface-faint hover:text-on-surface-dim transition-colors';

export default function HeaderToolbar({ onLogout }: Props): ReactElement {
    const { t, locale, setLocale } = useI18n();
    const { theme, toggleTheme } = useTheme();
    const { isGuest } = useAuth();
    const [isAccountOpen, setIsAccountOpen] = useState(false);
    const accountTriggerRef = useRef<HTMLButtonElement>(null);
    const closeAccount = useCallback(() => setIsAccountOpen(false), []);
    const accountRef = useDismissable<HTMLDivElement>(isAccountOpen, closeAccount, accountTriggerRef);

    const toggleLocale = (): void => {
        const next: Locale = locale === 'de' ? 'en' : 'de';
        setLocale(next);
    };

    const exitTitle = isGuest ? t.guestExitTitle : t.logoutTitle;

    return (
        <div
            className="hidden lg:flex items-center justify-end gap-1.5 h-16 px-4 border-b border-outline-faint shrink-0"
            role="toolbar"
            aria-label={t.settingsTitle}
        >
            <motion.button
                onClick={toggleTheme}
                whileTap={{ scale: 0.95 }}
                className={ICON_BUTTON}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                title={theme === 'dark' ? t.themeLight : t.themeDark}
            >
                {theme === 'dark'
                    ? <Sun strokeWidth={1.5} size={16} aria-hidden="true" />
                    : <Moon strokeWidth={1.5} size={16} aria-hidden="true" />
                }
            </motion.button>

            <motion.button
                onClick={toggleLocale}
                whileTap={{ scale: 0.95 }}
                className={`${ICON_BUTTON} font-semibold`}
                aria-label={locale === 'de' ? 'Switch to English' : 'Auf Deutsch wechseln'}
            >
                <Globe strokeWidth={1.5} size={16} aria-hidden="true" />
                {locale === 'de' ? 'EN' : 'DE'}
            </motion.button>

            <div ref={accountRef} className="relative">
                <motion.button
                    ref={accountTriggerRef}
                    onClick={() => setIsAccountOpen(open => !open)}
                    whileTap={{ scale: 0.95 }}
                    className={ICON_BUTTON}
                    aria-label={t.accountTitle}
                    title={t.accountTitle}
                    aria-expanded={isAccountOpen}
                    aria-controls="account-menu"
                >
                    <UserRound strokeWidth={1.5} size={18} aria-hidden="true" />
                </motion.button>

                {isAccountOpen && (
                    <div
                        id="account-menu"
                        className="absolute right-0 top-full mt-2 w-64 z-50 rounded-lg border border-outline-faint bg-surface-raised shadow-lg"
                    >
                        <AccountPanel />
                    </div>
                )}
            </div>

            <motion.button
                onClick={onLogout}
                whileTap={{ scale: 0.95 }}
                className={`${ICON_BUTTON} hover:text-error-text`}
                aria-label={exitTitle}
                title={exitTitle}
            >
                <LogOut strokeWidth={1.5} size={16} aria-hidden="true" />
            </motion.button>
        </div>
    );
}
