/**
 * AccountSettingsModal: floating dialog for username, email and password.
 *
 * Rendered through a portal into <body>, so it floats above the whole page no
 * matter where it is mounted, and the page behind it is blurred. Closes via the
 * X button, Escape or a click on the blurred backdrop.
 *
 * Accessibility: role="dialog" + aria-modal, labelled by its heading, focus moves
 * into the dialog on open and Tab is kept inside until it closes.
 */

import { useEffect, useRef, type KeyboardEvent, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useI18n } from '../../i18n/useI18n.ts';
import UsernameSection from './UsernameSection.tsx';
import EmailSection from './EmailSection.tsx';
import PasswordSection from './PasswordSection.tsx';

interface Props {
    onClose: () => void;
}

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

export default function AccountSettingsModal({ onClose }: Props): ReactElement {
    const { t } = useI18n();
    const dialogRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

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
                className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-outline-faint bg-surface-raised shadow-2xl"
            >
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-outline-faint">
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

                <div className="px-6 py-5 space-y-6 divide-y divide-outline-faint [&>section:not(:first-child)]:pt-6">
                    <UsernameSection />
                    <EmailSection />
                    <PasswordSection />
                </div>
            </motion.div>
        </div>,
        document.body,
    );
}
