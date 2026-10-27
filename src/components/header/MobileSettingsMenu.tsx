/**
 * MobileSettingsMenu: settings dropdown for small screens (below lg).
 *
 * A gear button in the mobile header opens a list with the account section
 * at the top, then language, theme and logout — each with icon and text,
 * because there is no room for a row of bare icons.
 *
 * Simple disclosure pattern (button + aria-expanded) instead of a full ARIA
 * menu: closes on outside click, Escape, or after picking an entry.
 */

import { useCallback, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { Settings, Sun, Moon, Globe, LogOut } from 'lucide-react';
import { useI18n } from '../../i18n/useI18n.ts';
import { type Locale } from '../../i18n/translations.ts';
import { useTheme } from '../../theme/useTheme.ts';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useDismissable } from '../../hooks/useDismissable.ts';
import AccountPanel from './AccountPanel.tsx';

interface Props {
    onLogout: () => void;
}

interface ItemProps {
    icon: ReactNode;
    label: string;
    onSelect: () => void;
    danger?: boolean;
}

function MenuItem({ icon, label, onSelect, danger = false }: ItemProps): ReactElement {
    return (
        <li>
            <button
                type="button"
                onClick={onSelect}
                className={`w-full flex items-center gap-3 px-4 min-h-[44px] text-sm text-left transition-colors hover:bg-surface-alt ${
                    danger ? 'text-error-text' : 'text-on-surface-dim'
                }`}
            >
                {icon}
                <span>{label}</span>
            </button>
        </li>
    );
}

export default function MobileSettingsMenu({ onLogout }: Props): ReactElement {
    const { t, locale, setLocale } = useI18n();
    const { theme, toggleTheme } = useTheme();
    const { isGuest } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const close = useCallback(() => setIsOpen(false), []);
    const containerRef = useDismissable<HTMLDivElement>(isOpen, close, triggerRef);

    /** Run the action and close the menu. */
    const select = (action: () => void) => (): void => {
        action();
        close();
    };

    const toggleLocale = (): void => {
        const next: Locale = locale === 'de' ? 'en' : 'de';
        setLocale(next);
    };

    return (
        <div ref={containerRef} className="relative ml-auto">
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setIsOpen(open => !open)}
                className="w-11 h-11 flex items-center justify-center rounded-lg text-on-surface-faint hover:text-on-surface-dim transition-colors"
                aria-label={t.settingsTitle}
                aria-expanded={isOpen}
                aria-controls="mobile-settings-menu"
            >
                <Settings size={20} aria-hidden="true" />
            </button>

            {isOpen && (
                <div
                    id="mobile-settings-menu"
                    className="absolute right-0 top-full mt-2 w-64 z-50 rounded-lg border border-outline-faint bg-surface-raised shadow-lg overflow-hidden"
                >
                    <AccountPanel />
                    <ul className="border-t border-outline-faint py-1">
                        <MenuItem
                            icon={<Globe size={16} aria-hidden="true" />}
                            label={t.languageSwitch}
                            onSelect={select(toggleLocale)}
                        />
                        <MenuItem
                            icon={theme === 'dark'
                                ? <Sun size={16} aria-hidden="true" />
                                : <Moon size={16} aria-hidden="true" />}
                            label={theme === 'dark' ? t.themeLight : t.themeDark}
                            onSelect={select(toggleTheme)}
                        />
                        <MenuItem
                            icon={<LogOut size={16} aria-hidden="true" />}
                            label={isGuest ? t.guestExitTitle : t.logoutTitle}
                            onSelect={select(onLogout)}
                            danger
                        />
                    </ul>
                </div>
            )}
        </div>
    );
}
