/**
 * EmailChangeLinkScreen: result page for the link in the "confirm your new
 * email" mail ({FRONTEND_URL}/verify-email-change?token=...).
 *
 * Lives at app level, not inside the WelcomeScreen, because the user who asked
 * for the change is usually still signed in, and then no WelcomeScreen is
 * rendered at all. It works signed in and signed out:
 * - signed in:  "Continue to the app" reloads /me so the new address shows up
 * - signed out: "Back to login" (the new address is now the login address)
 */

import { useEffect, useRef, useState, type ReactElement } from 'react';
import TerminalIcon from '../icons/TerminalIcon';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useI18n } from '../../i18n/useI18n.ts';
import { verifyEmailChange } from '../../services/accountApi.ts';
import VerifyLinkScreen, { type VerifyLinkStatus } from '../auth/VerifyLinkScreen.tsx';

interface Props {
    token: string;
    onDone: () => void;
}

export default function EmailChangeLinkScreen({ token, onDone }: Props): ReactElement {
    const { user, refreshUser } = useAuth();
    const { t } = useI18n();
    const [status, setStatus] = useState<VerifyLinkStatus>('verifying');
    const submittedRef = useRef(false);

    /**
     * Submit the single-use token exactly once. The ref guard survives React
     * StrictMode's double effect run; the URL is cleaned right away so a reload
     * cannot replay the token.
     */
    useEffect(() => {
        if (submittedRef.current) return;
        submittedRef.current = true;
        window.history.replaceState({}, '', import.meta.env.BASE_URL);
        verifyEmailChange(token)
            .then(() => setStatus('success'))
            .catch(() => setStatus('error'));
    }, [token]);

    const handleContinue = (): void => {
        // Signed in on this device: pick up the new address before showing the app.
        if (user) void refreshUser();
        onDone();
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-surface p-4">
            <main className="w-full max-w-sm" aria-labelledby="welcome-heading">
                <div className="flex items-center gap-2 mb-6">
                    <TerminalIcon size={16} className="text-accent" aria-hidden="true" />
                    <span className="text-xs font-bold tracking-wider text-on-surface-faint uppercase">IT Trainer</span>
                </div>
                <VerifyLinkScreen
                    status={status}
                    errorMessage={t.accountEmailLinkInvalid}
                    onBackToLogin={handleContinue}
                    successSubtitle={t.accountEmailChangedSubtitle}
                    buttonLabel={user ? t.accountContinue : t.authBackToLogin}
                />
            </main>
        </div>
    );
}
