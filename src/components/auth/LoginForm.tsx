/**
 * Login Form: Email + Password authentication form.
 *
 * Features:
 * - Zod validation for email format
 * - Loading state during submission
 * - Error message display
 * - Link to register form
 */

import { useState, type ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Mail, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useI18n } from '../../i18n/useI18n.ts';
import PasswordInput from './PasswordInput.tsx';

// ==================== Types ====================

interface LoginFormProps {
    onSwitchToRegister: () => void;
    onForgotPassword: () => void;
}

// ==================== Component ====================

export default function LoginForm({ onSwitchToRegister, onForgotPassword }: LoginFormProps): ReactElement {
    const { login, error: authError, clearError } = useAuth();
    const { t } = useI18n();
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Validation Schema (with translations)
    const loginSchema = z.object({
        email: z.string()
            .min(1, t.authEmailRequired)
            .email(t.authEmailInvalid),
        password: z.string()
            .min(1, t.authPasswordRequired),
    });

    type LoginFormData = z.infer<typeof loginSchema>;

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData): Promise<void> => {
        setSubmitError(null);
        clearError();

        try {
            await login(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Login failed';
            setSubmitError(message);
        }
    };

    const displayError = submitError || authError;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" aria-label={t.authLogin}>
            {/* Email Input */}
            <div>
                <label htmlFor="login-email" className="sr-only">
                    {t.authEmail}
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-on-surface-subtle" aria-hidden="true" />
                    </div>
                    <input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        autoFocus
                        {...register('email')}
                        placeholder={t.authEmail}
                        aria-required="true"
                        aria-invalid={errors.email ? 'true' : 'false'}
                        aria-describedby={errors.email ? 'login-email-error' : undefined}
                        disabled={isSubmitting}
                        className="w-full pl-10 pr-3 py-2 bg-surface-alt border border-outline rounded-md text-sm text-on-surface placeholder-on-surface-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 transition-colors"
                    />
                </div>
                {errors.email && (
                    <p id="login-email-error" className="mt-1 text-xs text-error-text" role="alert">
                        {errors.email.message}
                    </p>
                )}
            </div>

            {/* Password Input */}
            <PasswordInput
                id="login-password"
                name="password"
                placeholder={t.authPassword}
                autoComplete="current-password"
                register={register}
                error={errors.password}
                isSubmitting={isSubmitting}
                autoFocus={false}
            />

            {/* Error Message */}
            {displayError && (
                <div className="p-3 bg-error-bg border border-error-border rounded-md" role="alert">
                    <p className="text-xs text-error-text">{displayError}</p>
                </div>
            )}

            {/* Submit Button */}
            <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover disabled:bg-surface-raised disabled:text-on-surface-subtle text-on-surface font-semibold py-2 rounded-md text-sm transition-all"
            >
                {isSubmitting ? (
                    <>
                        <span>{t.authLoggingIn}</span>
                    </>
                ) : (
                    <>
                        <LogIn className="w-4 h-4" aria-hidden="true" />
                        <span>{t.authLogin}</span>
                    </>
                )}
            </motion.button>

            {/* Forgot Password */}
            <div className="text-right">
                <button
                    type="button"
                    onClick={onForgotPassword}
                    disabled={isSubmitting}
                    className="text-xs text-accent hover:text-accent-hover transition-colors disabled:opacity-50"
                >
                    {t.authForgotPassword}
                </button>
            </div>

            {/* Switch to Register */}
            <div className="text-center">
                <button
                    type="button"
                    onClick={onSwitchToRegister}
                    disabled={isSubmitting}
                    className="text-xs text-on-surface-faint hover:text-on-surface-dim transition-colors disabled:opacity-50"
                >
                    {t.authNoAccount} <span className="text-accent">{t.authRegister}</span>
                </button>
            </div>
        </form>
    );
}
