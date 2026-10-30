/**
 * CookieBanner: Simple blocking info banner for cookie consent.
 *
 * Displays a fixed banner at the bottom of the viewport informing users
 * that the app uses essential HTTP-only cookies for authentication.
 * Banner is dismissed by clicking "Verstanden"/"Got it" and the decision
 * is persisted in localStorage.
 *
 * No tracking or marketing cookies are used — only essential auth cookies.
 */

import { type ReactElement, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '../i18n/useI18n.ts';
import { persistItem } from '../utils/persistence.ts';

export const COOKIE_CONSENT_KEY = 'cookieConsent';
const COOKIE_CONSENT_VALUE = 'accepted';

/**
 * Check if user has already accepted cookies.
 *
 * Returns true if consent is recorded, false if not or if localStorage
 * is unavailable (in which case we show the banner to be safe).
 */
function hasConsent(): boolean {
    try {
        return localStorage.getItem(COOKIE_CONSENT_KEY) === COOKIE_CONSENT_VALUE;
    } catch {
        // localStorage unavailable (private browsing, disabled, etc.)
        return false;
    }
}

/**
 * Record cookie consent in localStorage.
 *
 * Skipped in guest mode and when storage is unavailable — the banner will
 * reappear next visit.
 */
function recordConsent(): void {
    persistItem(COOKIE_CONSENT_KEY, COOKIE_CONSENT_VALUE);
}

/** Exit animation duration in ms — must match the transition duration on motion.div. */
const EXIT_ANIMATION_DURATION_MS = 300;

/**
 * CookieBanner component.
 *
 * Renders a fixed bottom banner with info text and accept button.
 * Automatically focuses the accept button for keyboard accessibility.
 * Dismissed by clicking the button — slides smoothly off-screen before unmounting.
 * Consent is persisted in localStorage so the banner does not reappear.
 */
export function CookieBanner(): ReactElement | null {
    const alreadyAccepted = hasConsent();
    const [isVisible, setIsVisible] = useState<boolean>(!alreadyAccepted);
    const [isFullyDismissed, setIsFullyDismissed] = useState<boolean>(alreadyAccepted);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const { t } = useI18n();

    // Auto-focus the accept button on mount for keyboard users
    useEffect(() => {
        if (isVisible) {
            buttonRef.current?.focus();
        }
    }, [isVisible]);

    const handleAccept = (): void => {
        recordConsent();
        setIsVisible(false);
        // Unmount after the exit animation finishes
        window.setTimeout(() => setIsFullyDismissed(true), EXIT_ANIMATION_DURATION_MS);
    };

    if (isFullyDismissed) {
        return null;
    }

    return (
        <motion.div
            role="dialog"
            aria-label="Cookie notice"
            aria-live="polite"
            initial={{ y: '100%' }}
            animate={{ y: isVisible ? 0 : '100%' }}
            transition={{ duration: EXIT_ANIMATION_DURATION_MS / 1000, ease: 'easeOut' }}
            className="fixed bottom-0 left-0 right-0 z-50 border-t border-outline-faint bg-surface-raised p-4 shadow-lg"
        >
            <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <p className="text-center text-sm text-on-surface-dim sm:text-left">
                    {t.cookieBannerMessage}
                </p>
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={handleAccept}
                    className="shrink-0 rounded-lg bg-accent px-5 py-2 font-semibold text-on-accent transition-colors hover:bg-accent-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                    {t.cookieBannerAccept}
                </button>
            </div>
        </motion.div>
    );
}
