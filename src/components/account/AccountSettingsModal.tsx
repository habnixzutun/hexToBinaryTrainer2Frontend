/**
 * AccountSettingsModal: floating dialog for username, email and password.
 *
 * Layout: sidebar + content (master-detail).
 *  - Desktop (lg+): vertical tab sidebar on the left, active section on the right.
 *  - Mobile: a dropdown menu replaces the sidebar; the selected section fills the dialog.
 *
 * Rendered through a portal into <body>, so it floats above the whole page no
 * matter where it is mounted, and the page behind it is blurred. Closes via the
 * X button, Escape or a click on the blurred backdrop.
 *
 * Accessibility: role="dialog" + aria-modal, labelled by its heading, focus moves
 * into the dialog on open and Tab is kept inside until it closes.
 *
 * Width constants are defined at the top — change them here to resize the modal.
 */

import { useState, useCallback, useEffect, useRef, type KeyboardEvent, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserRound, ChevronDown } from 'lucide-react';
import { useI18n } from '../../i18n/useI18n.ts';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useDismissable } from '../../hooks/useDismissable.ts';
import UsernameSection from './UsernameSection.tsx';
import EmailSection from './EmailSection.tsx';
import PasswordSection from './PasswordSection.tsx';
import DevicesSection from './DevicesSection.tsx';
import DeleteAccountSection from './DeleteAccountSection.tsx';

/* ─── Layout constants — change these to resize the modal ───────────────── */
const MODAL_MAX_WIDTH = 'max-w-[850px]';         // total dialog width on desktop
const SIDEBAR_WIDTH = 'lg:w-[220px]';            // sidebar width on desktop
const CONTENT_MIN_HEIGHT = 'lg:min-h-[420px]';   // prevents layout jump when switching tabs
/* ────────────────────────────────────────────────────────────────────────── */

type TabId = 'username' | 'email' | 'password' | 'devices' | 'delete';

interface Props {
    onClose: () => void;
}

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

const TAB_IDS: readonly TabId[] = ['username', 'email', 'password', 'devices', 'delete'];

export default function AccountSettingsModal({ onClose }: Props): ReactElement {
    const { t } = useI18n();
    const { user } = useAuth();
    const dialogRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    const [activeTab, setActiveTab] = useState<TabId>('username');

    // Mobile dropdown state
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuTriggerRef = useRef<HTMLButtonElement>(null);
    const closeMenu = useCallback(() => setIsMenuOpen(false), []);
    const menuRef = useDismissable<HTMLDivElement>(isMenuOpen, closeMenu, menuTriggerRef);

    const tabLabels: Record<TabId, string> = {
        username: t.accountUsernameSection,
        email: t.accountEmailSection,
        password: t.accountPasswordSection,
        devices: t.accountDevicesSection,
        delete: t.accountDeleteSection,
    };

    useEffect(() => {
        const previouslyFocused = document.activeElement as HTMLElement | null;
        closeButtonRef.current?.focus();

        // The page behind the dialog must not scroll while it is open.
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
            previouslyFocused?.focus?.();
        };
    }, []);

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
        if (event.key === 'Escape') {
            onClose();
            return;
        }
        if (event.key !== 'Tab' || !dialogRef.current) return;

        // Focus trap: wrap around at the first/last focusable element.
        const items = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
        const first = items[0];
        const last = items[items.length - 1];
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };

    const handleTabClick = (tabId: TabId): void => {
        setActiveTab(tabId);
        closeMenu();
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            // mousedown (not click): selecting text inside an input and releasing
            // the mouse over the backdrop must not throw the user's input away.
            onMouseDown={event => {
                if (event.target === event.currentTarget) onClose();
            }}
            onKeyDown={handleKeyDown}
        >
            <motion.div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="account-settings-heading"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15 }}
                className={`relative w-full ${MODAL_MAX_WIDTH} max-h-[85vh] rounded-xl border border-outline-faint bg-surface-raised shadow-2xl flex flex-col`}
            >
                {/* ─── Header ─────────────────────────────────────────── */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-outline-faint shrink-0">
                    <h2 id="account-settings-heading" className="text-lg font-bold text-on-surface">
                        {t.accountSettings}
                    </h2>
                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={onClose}
                        className="w-9 h-9 -mr-2 flex items-center justify-center rounded-md text-on-surface-faint hover:text-on-surface hover:bg-surface-alt transition-colors"
                        aria-label={t.accountClose}
                        title={t.accountClose}
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                {/* ─── Body: sidebar + content ────────────────────────── */}
                <div className="flex flex-col lg:flex-row min-h-0 flex-1">

                    {/* ─── Sidebar (desktop) / Dropdown (mobile) ─────── */}
                    <aside className={`${SIDEBAR_WIDTH} shrink-0 border-b lg:border-b-0 lg:border-r border-outline-faint flex flex-col`}>

                        {/* User info header */}
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-outline-faint">
                            <UserRound size={20} className="text-accent shrink-0" aria-hidden="true" />
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-on-surface truncate">
                                    {user?.username ?? ''}
                                </p>
                                <p className="text-xs text-on-surface-faint truncate">
                                    {user?.email ?? ''}
                                </p>
                            </div>
                        </div>

                        {/* Desktop: vertical tab list */}
                        <nav className="hidden lg:flex flex-col p-2 gap-0.5 flex-1" aria-label="Kontoeinstellungen Bereiche">
                            {TAB_IDS.map(tabId => (
                                <button
                                    key={tabId}
                                    type="button"
                                    onClick={() => setActiveTab(tabId)}
                                    aria-current={activeTab === tabId ? 'page' : undefined}
                                    className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                                        activeTab === tabId
                                            ? 'bg-surface-raised text-on-surface'
                                            : 'text-on-surface-faint hover:text-on-surface-dim hover:bg-surface-alt'
                                    }`}
                                >
                                    {tabLabels[tabId]}
                                </button>
                            ))}
                        </nav>

                        {/* Mobile: dropdown menu */}
                        <div ref={menuRef} className="lg:hidden relative px-3 py-3">
                            <button
                                ref={menuTriggerRef}
                                type="button"
                                onClick={() => setIsMenuOpen(open => !open)}
                                aria-expanded={isMenuOpen}
                                aria-controls="account-tab-menu"
                                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md text-sm font-medium bg-surface-raised text-on-surface hover:bg-surface-alt transition-colors"
                            >
                                <span>{tabLabels[activeTab]}</span>
                                <ChevronDown
                                    size={14}
                                    className={`transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
                                    aria-hidden="true"
                                />
                            </button>

                            <AnimatePresence>
                                {isMenuOpen && (
                                    <motion.ul
                                        id="account-tab-menu"
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -4 }}
                                        transition={{ duration: 0.12 }}
                                        className="absolute left-3 right-3 top-full mt-1 z-10 rounded-lg border border-outline-faint bg-surface-raised shadow-lg overflow-hidden"
                                        role="listbox"
                                        aria-label="Bereich auswählen"
                                    >
                                        {TAB_IDS.map(tabId => (
                                            <li key={tabId} role="option" aria-selected={activeTab === tabId}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleTabClick(tabId)}
                                                    className={`w-full text-left px-3 py-2.5 text-sm font-medium transition-colors ${
                                                        activeTab === tabId
                                                            ? 'bg-surface-alt text-on-surface'
                                                            : 'text-on-surface-faint hover:text-on-surface-dim hover:bg-surface-alt'
                                                    }`}
                                                >
                                                    {tabLabels[tabId]}
                                                </button>
                                            </li>
                                        ))}
                                    </motion.ul>
                                )}
                            </AnimatePresence>
                        </div>
                    </aside>

                    {/* ─── Content area ───────────────────────────────── */}
                    <div className={`flex-1 overflow-y-auto px-6 py-5 min-h-0 pb-10 ${CONTENT_MIN_HEIGHT}`}>
                        <div className={activeTab !== 'username' ? 'hidden' : ''}>
                            <UsernameSection />
                        </div>
                        <div className={activeTab !== 'email' ? 'hidden' : ''}>
                            <EmailSection />
                        </div>
                        <div className={activeTab !== 'password' ? 'hidden' : ''}>
                            <PasswordSection />
                        </div>
                        <div className={activeTab !== 'devices' ? 'hidden' : ''}>
                            <DevicesSection onSelfRevoke={onClose} />
                        </div>
                        <div className={activeTab !== 'delete' ? 'hidden' : ''}>
                            <DeleteAccountSection />
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body,
    );
}
