/**
 * Welcome Screen: Authentication gate with login/register/verify flows.
 *
 * Features:
 * - Toggle between Login and Register forms
 * - Shows VerifyEmailScreen after successful registration
 * - Theme + Language toggles preserved
 * - Error handling and loading states
 */

import { useEffect, useRef, useState, type ReactElement } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Globe, Sun, Moon, ArrowLeft, UserRound } from 'lucide-react';
import { useI18n } from '../i18n/useI18n.ts';
import { type Locale } from '../i18n/translations.ts';
import { useTheme } from '../theme/useTheme.ts';
import { verifyEmail } from '../services/authApi.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import LoginForm from './auth/LoginForm.tsx';
import RegisterForm from './auth/RegisterForm.tsx';
import VerifyEmailScreen from './auth/VerifyEmailScreen.tsx';
import VerifyLinkScreen, { type VerifyLinkStatus } from './auth/VerifyLinkScreen.tsx';
import ForgotPasswordForm from './auth/ForgotPasswordForm.tsx';
import ResetPasswordForm from './auth/ResetPasswordForm.tsx';

// ==================== Types ====================

type AuthView = 'login' | 'register' | 'verify-email' | 'forgot-password' | 'reset-password';
type LinkProcessState = VerifyLinkStatus | 'idle';

/**
 * Extract the verification token from the URL if this is a verify-email link
 * ({FRONTEND_URL}/verify-email?token=...) sent by the backend.
 */
function readVerifyTokenFromUrl(): string | null {
    const path = window.location.pathname.replace(/\/$/, '');
    if (!path.endsWith('/verify-email')) {
        return null;
    }
    // Normalize empty ?token= to null so both call sites (lazy init + effect)
    // treat a missing and an empty token identically.
    const token = new URLSearchParams(window.location.search).get('token');
    return token ? token : null;
}

/**
 * Extract the reset-password token from the URL if this is a reset-password link
 * ({FRONTEND_URL}/reset-password?token=...) sent by the backend.
 */
function readResetTokenFromUrl(): string | null {
    const path = window.location.pathname.replace(/\/$/, '');
    if (!path.endsWith('/reset-password')) {
        return null;
    }
    const token = new URLSearchParams(window.location.search).get('token');
    return token ? token : null;
}

// ==================== Component ====================

export default function WelcomeScreen(): ReactElement {
    const { startGuest, welcomeView, clearWelcomeView } = useAuth();
    // Lazy init: a reset-password link wins; otherwise open the view requested
    // by the AuthContext (e.g. 'register' after a guest clicked "Create account")
    const [view, setView] = useState<AuthView>(() => {
        if (readResetTokenFromUrl() !== null) return 'reset-password';
        return welcomeView;
    });
    const [registeredEmail, setRegisteredEmail] = useState<string>('');
    const [resetToken, setResetToken] = useState<string | null>(() => readResetTokenFromUrl());
    // Lazy init: landing on a verify-email link starts in 'verifying' without
    // a synchronous setState inside the effect (react-hooks/set-state-in-effect).
    const [linkStatus, setLinkStatus] = useState<LinkProcessState>(() =>
        readVerifyTokenFromUrl() !== null ? 'verifying' : 'idle'
    );
    const [linkError, setLinkError] = useState<string>('');
    const verifySubmittedRef = useRef(false);
    const { t, locale, setLocale } = useI18n();
    const { theme, toggleTheme } = useTheme();

    // The requested start view is a one-time hint: consume it once read, so
    // the next visit to the WelcomeScreen starts with login again.
    useEffect(() => {
        if (welcomeView !== 'login') {
            clearWelcomeView();
        }
    }, [welcomeView, clearWelcomeView]);

    /**
     * Submit the verification token from the URL exactly once.
     *
     * The one-time token is single-use, so the effect must be idempotent even
     * under React StrictMode's double invocation: an explicit ref guard plus
     * immediate URL cleaning (a reload never re-submits the token).
     */
    useEffect(() => {
        const token = readVerifyTokenFromUrl();
        if (token === null || verifySubmittedRef.current) {
            return;
        }
        verifySubmittedRef.current = true;
        window.history.replaceState({}, '', import.meta.env.BASE_URL);
        verifyEmail(token)
            .then(() => setLinkStatus('success'))
            .catch((err: unknown) => {
                setLinkError(err instanceof Error ? err.message : '');
                setLinkStatus('error');
            });
    }, []);

    /**
     * Strip the reset-password token from the URL on mount so a page reload
     * (e.g. after a failed login attempt) cannot re-read it from the URL and
     * bounce the user back to the reset-password view.
     *
     * The token is already captured in component state via lazy init; the URL
     * is only cleaned, not re-submitted here.
     */
    useEffect(() => {
        if (readResetTokenFromUrl() === null) {
            return;
        }
        window.history.replaceState({}, '', import.meta.env.BASE_URL);
    }, []);

    const toggleLocale = (): void => {
        const next: Locale = locale === 'de' ? 'en' : 'de';
        setLocale(next);
    };

    const handleRegisterSuccess = (email: string): void => {
        setRegisteredEmail(email);
        setView('verify-email');
    };

    const handleBackToLogin = (): void => {
        setView('login');
        setRegisteredEmail('');
        setLinkStatus('idle');
        setLinkError('');
        setResetToken(null);
        // Strip any lingering token from the URL so a reload cannot bounce
        // the user back to the reset-password or verify-email view.
        window.history.replaceState({}, '', import.meta.env.BASE_URL);
    };

    const handleForgotPassword = (): void => {
        setView('forgot-password');
    };

    const handleResetPasswordSuccess = (): void => {
        // After successful reset, go back to login
        handleBackToLogin();
    };

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-4">
            {/* Top-right controls: theme toggle + language toggle */}
            <div className="fixed top-4 right-4 flex items-center gap-1.5" role="toolbar" aria-label="Settings">
                <motion.button
                    onClick={toggleTheme}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center justify-center w-11 h-11 border border-outline hover:border-on-surface-subtle rounded text-on-surface-faint hover:text-on-surface-dim transition-colors"
                    aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                >
                    {theme === 'dark'
                        ? <Sun strokeWidth={1.5} size={13} aria-hidden="true" />
                        : <Moon strokeWidth={1.5} size={13} aria-hidden="true" />
                    }
                </motion.button>
                <motion.button
                    onClick={toggleLocale}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-1.5 px-2.5 min-h-[44px] border border-outline hover:border-on-surface-subtle rounded text-[10px] font-semibold text-on-surface-faint hover:text-on-surface-dim transition-colors"
                    aria-label={locale === 'de' ? 'Switch to English' : 'Auf Deutsch wechseln'}
                >
                    <Globe strokeWidth={1.5} size={11} aria-hidden="true" />
                    <span>{locale === 'de' ? 'EN' : 'DE'}</span>
                </motion.button>
            </div>

            <main className="w-full max-w-sm" aria-labelledby="welcome-heading">
                {/* Logo */}
                <div className="flex items-center gap-2 mb-4">
                    <Terminal strokeWidth={1.5} size={16} className="text-accent" aria-hidden="true" />
                    <span className="text-xs font-bold tracking-wider text-on-surface-faint uppercase">IT Trainer</span>
                </div>

                {linkStatus === 'idle' ? (
                    <>
                        {/* Title */}
                        <div className="mb-8">
                            <h1 id="welcome-heading" className="text-2xl font-bold tracking-tight text-on-surface mb-2">
                                {view === 'login' && t.authWelcomeBack}
                                {view === 'register' && t.authCreateAccount}
                                {view === 'verify-email' && t.authVerifyEmail}
                                {view === 'forgot-password' && t.authForgotPasswordTitle}
                                {view === 'reset-password' && t.authResetPasswordTitle}
                            </h1>
                            <p className="text-sm text-on-surface-faint leading-relaxed">
                                {view === 'login' && t.authLoginSubtitle}
                                {view === 'register' && t.authRegisterSubtitle}
                                {view === 'verify-email' && t.authVerifySubtitle}
                                {view === 'forgot-password' && t.authForgotPasswordSubtitle}
                                {view === 'reset-password' && t.authResetPasswordSubtitle}
                            </p>
                        </div>

                        {/* Auth Forms */}
                        <motion.div
                            key={view}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {view === 'login' && (
                                <>
                                    <LoginForm
                                        onSwitchToRegister={() => setView('register')}
                                        onForgotPassword={handleForgotPassword}
                                    />
                                    {/* Guest mode: try the app without an account */}
                                    <div className="mt-6 pt-6 border-t border-outline-faint space-y-2">
                                        <motion.button
                                            type="button"
                                            onClick={startGuest}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            aria-describedby="guest-mode-hint"
                                            className="w-full flex items-center justify-center gap-2 bg-surface-alt hover:bg-surface-raised border border-outline text-on-surface font-semibold py-2 rounded-md text-sm transition-all"
                                        >
                                            <UserRound className="w-4 h-4" aria-hidden="true" />
                                            <span>{t.guestModeButton}</span>
                                        </motion.button>
                                        <p id="guest-mode-hint" className="text-xs text-on-surface-faint text-center leading-relaxed">
                                            {t.guestModeHint}
                                        </p>
                                    </div>
                                </>
                            )}
                            {view === 'register' && (
                                <RegisterForm
                                    onSwitchToLogin={() => setView('login')}
                                    onRegisterSuccess={handleRegisterSuccess}
                                />
                            )}
                            {view === 'verify-email' && (
                                <VerifyEmailScreen
                                    email={registeredEmail}
                                    onBackToLogin={handleBackToLogin}
                                />
                            )}
                            {view === 'forgot-password' && (
                                <ForgotPasswordForm
                                    onSwitchToLogin={() => setView('login')}
                                />
                            )}
                            {view === 'reset-password' && resetToken && (
                                <ResetPasswordForm
                                    token={resetToken}
                                    onSwitchToLogin={handleResetPasswordSuccess}
                                />
                            )}
                            {view === 'reset-password' && !resetToken && (
                                <div className="text-center space-y-4">
                                    <p className="text-sm text-error-text">{t.authResetPasswordTokenMissing}</p>
                                    <motion.button
                                        onClick={handleBackToLogin}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full flex items-center justify-center gap-2 bg-surface-alt hover:bg-surface-raised border border-outline text-on-surface font-semibold py-2 rounded-md text-sm transition-all"
                                    >
                                        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                                        <span>{t.authBackToLogin}</span>
                                    </motion.button>
                                </div>
                            )}
                        </motion.div>
                    </>
                ) : (
                    <VerifyLinkScreen
                        status={linkStatus}
                        errorMessage={linkError}
                        onBackToLogin={handleBackToLogin}
                    />
                )}
            </main>
        </div>
    );
}
