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
import { useI18n } from '../i18n/useI18n';

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
 * Silently fails if storage is unavailable — banner will reappear next visit.
 */
function recordConsent(): void {
    try {
        localStorage.setItem(COOKIE_CONSENT_KEY, COOKIE_CONSENT_VALUE);
    } catch {
        // ignore — banner will reappear next visit
    }
}

/**
 * CookieBanner component.
 *
 * Renders a fixed bottom banner with info text and accept button.
 * Automatically focuses the accept button for keyboard accessibility.
 * Dismissed by clicking the button; consent is persisted.
 */
export function CookieBanner(): ReactElement | null {
    const [hasAccepted, setHasAccepted] = useState<boolean>(hasConsent);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const { t } = useI18n();

    // Auto-focus the accept button on mount for keyboard users
    useEffect(() => {
        if (!hasAccepted) {
            buttonRef.current?.focus();
        }
    }, [hasAccepted]);

    const handleAccept = (): void => {
        recordConsent();
        setHasAccepted(true);
    };

    if (hasAccepted) {
        return null;
    }

    return (
        <motion.div
            role="dialog"
            aria-label="Cookie notice"
            aria-live="polite"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
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
