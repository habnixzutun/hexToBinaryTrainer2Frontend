/**
 * Welcome Screen: Authentication gate with login/register/verify flows.
 *
 * Features:
 * - Toggle between Login and Register forms
 * - Shows VerifyEmailScreen after successful registration
 * - Theme + Language toggles preserved
 * - Error handling and loading states
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Globe, Sun, Moon } from 'lucide-react';
import { useI18n } from '../i18n/useI18n.ts';
import { type Locale } from '../i18n/translations.ts';
import { useTheme } from '../theme/useTheme.ts';
import LoginForm from './auth/LoginForm.tsx';
import RegisterForm from './auth/RegisterForm.tsx';
import VerifyEmailScreen from './auth/VerifyEmailScreen.tsx';

// ==================== Types ====================

type AuthView = 'login' | 'register' | 'verify-email';

// ==================== Component ====================

export default function WelcomeScreen(): JSX.Element {
    const [view, setView] = useState<AuthView>('login');
    const [registeredEmail, setRegisteredEmail] = useState<string>('');
    const { t, locale, setLocale } = useI18n();
    const { theme, toggleTheme } = useTheme();

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
                {/* Logo + Title */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Terminal strokeWidth={1.5} size={16} className="text-accent" aria-hidden="true" />
                        <span className="text-xs font-bold tracking-wider text-on-surface-faint uppercase">IT Trainer</span>
                    </div>

                    <h1 id="welcome-heading" className="text-2xl font-bold tracking-tight text-on-surface mb-2">
                        {view === 'login' && t.authWelcomeBack}
                        {view === 'register' && t.authCreateAccount}
                        {view === 'verify-email' && t.authVerifyEmail}
                    </h1>
                    <p className="text-sm text-on-surface-faint leading-relaxed">
                        {view === 'login' && t.authLoginSubtitle}
                        {view === 'register' && t.authRegisterSubtitle}
                        {view === 'verify-email' && t.authVerifySubtitle}
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
                        <LoginForm onSwitchToRegister={() => setView('register')} />
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
                </motion.div>
            </main>
        </div>
    );
}
