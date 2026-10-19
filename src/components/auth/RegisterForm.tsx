/**
 * Register Form: Email + Username + Password registration form.
 *
 * Features:
 * - Zod validation with password strength check
 * - Password requirements display (8+ chars, uppercase, lowercase, digit, special)
 * - Confirm password validation
 * - Loading state during submission
 * - Error message display
 * - Link to login form
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Mail, User, Lock, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../i18n/useI18n';

// ==================== Types ====================

interface RegisterFormProps {
    onSwitchToLogin: () => void;
    onRegisterSuccess: (email: string) => void;
}

// ==================== Component ====================

export default function RegisterForm({ onSwitchToLogin, onRegisterSuccess }: RegisterFormProps): JSX.Element {
    const { register: authRegister, error: authError, clearError } = useAuth();
    const { t } = useI18n();
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Validation Schema (with translations)
    const registerSchema = z.object({
        email: z.string()
            .min(1, t.authEmailRequired)
            .email(t.authEmailInvalid),
        username: z.string()
            .min(3, t.authUsernameMin)
            .max(50, t.authUsernameMax)
            .regex(/^[a-zA-Z0-9_-]+$/, t.authUsernameInvalid),
        password: z.string()
            .min(8, t.authPasswordMin)
            .max(128, t.authPasswordMax)
            .regex(/[A-Z]/, t.authPasswordUppercase)
            .regex(/[a-z]/, t.authPasswordLowercase)
            .regex(/[0-9]/, t.authPasswordDigit)
            .regex(/[^A-Za-z0-9]/, t.authPasswordSpecial),
        confirmPassword: z.string(),
    }).refine((data) => data.password === data.confirmPassword, {
        message: t.authPasswordsDontMatch,
        path: ['confirmPassword'],
    });

    type RegisterFormData = z.infer<typeof registerSchema>;

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const password = watch('password', '');

    const onSubmit = async (data: RegisterFormData): Promise<void> => {
        setSubmitError(null);
        clearError();

        try {
            await authRegister({
                email: data.email,
                username: data.username,
                password: data.password,
            });
            // Registration successful - show verification screen
            onRegisterSuccess(data.email);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Registration failed';
            setSubmitError(message);
        }
    };

    const displayError = submitError || authError;

    // Password strength indicator
    const passwordChecks = [
        { label: t.authPasswordReqLength, met: password.length >= 8 },
        { label: t.authPasswordReqUppercase, met: /[A-Z]/.test(password) },
        { label: t.authPasswordReqLowercase, met: /[a-z]/.test(password) },
        { label: t.authPasswordReqDigit, met: /[0-9]/.test(password) },
        { label: t.authPasswordReqSpecial, met: /[^A-Za-z0-9]/.test(password) },
    ];

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" aria-label={t.authRegisterButton}>
            {/* Email Input */}
            <div>
                <label htmlFor="register-email" className="sr-only">
                    {t.authEmail}
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-on-surface-subtle" aria-hidden="true" />
                    </div>
                    <input
                        id="register-email"
                        type="email"
                        autoComplete="email"
                        autoFocus
                        {...register('email')}
                        placeholder={t.authEmail}
                        aria-required="true"
                        aria-invalid={errors.email ? 'true' : 'false'}
                        aria-describedby={errors.email ? 'register-email-error' : undefined}
                        disabled={isSubmitting}
                        className="w-full pl-10 pr-3 py-2 bg-surface-alt border border-outline rounded-md text-sm text-on-surface placeholder-on-surface-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 transition-colors"
                    />
                </div>
                {errors.email && (
                    <p id="register-email-error" className="mt-1 text-xs text-error-text" role="alert">
                        {errors.email.message}
                    </p>
                )}
            </div>

            {/* Username Input */}
            <div>
                <label htmlFor="register-username" className="sr-only">
                    {t.authUsername}
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-on-surface-subtle" aria-hidden="true" />
                    </div>
                    <input
                        id="register-username"
                        type="text"
                        autoComplete="username"
                        {...register('username')}
                        placeholder={t.authUsername}
                        aria-required="true"
                        aria-invalid={errors.username ? 'true' : 'false'}
                        aria-describedby={errors.username ? 'register-username-error' : undefined}
                        disabled={isSubmitting}
                        className="w-full pl-10 pr-3 py-2 bg-surface-alt border border-outline rounded-md text-sm text-on-surface placeholder-on-surface-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 transition-colors"
                    />
                </div>
                {errors.username && (
                    <p id="register-username-error" className="mt-1 text-xs text-error-text" role="alert">
                        {errors.username.message}
                    </p>
                )}
            </div>

            {/* Password Input */}
            <div>
                <label htmlFor="register-password" className="sr-only">
                    {t.authPassword}
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-on-surface-subtle" aria-hidden="true" />
                    </div>
                    <input
                        id="register-password"
                        type="password"
                        autoComplete="new-password"
                        {...register('password')}
                        placeholder={t.authPassword}
                        aria-required="true"
                        aria-invalid={errors.password ? 'true' : 'false'}
                        aria-describedby="password-requirements"
                        disabled={isSubmitting}
                        className="w-full pl-10 pr-3 py-2 bg-surface-alt border border-outline rounded-md text-sm text-on-surface placeholder-on-surface-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 transition-colors"
                    />
                </div>
                {errors.password && (
                    <p id="register-password-error" className="mt-1 text-xs text-error-text" role="alert">
                        {errors.password.message}
                    </p>
                )}
            </div>

            {/* Password Requirements */}
            {password && (
                <div id="password-requirements" className="space-y-1">
                    {passwordChecks.map((check, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                            <div className={`w-1.5 h-1.5 rounded-full ${check.met ? 'bg-accent' : 'bg-on-surface-subtle'}`} />
                            <span className={check.met ? 'text-accent' : 'text-on-surface-faint'}>
                                {check.label}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Confirm Password Input */}
            <div>
                <label htmlFor="register-confirm-password" className="sr-only">
                    {t.authConfirmPassword}
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-on-surface-subtle" aria-hidden="true" />
                    </div>
                    <input
                        id="register-confirm-password"
                        type="password"
                        autoComplete="new-password"
                        {...register('confirmPassword')}
                        placeholder={t.authConfirmPassword}
                        aria-required="true"
                        aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                        aria-describedby={errors.confirmPassword ? 'register-confirm-password-error' : undefined}
                        disabled={isSubmitting}
                        className="w-full pl-10 pr-3 py-2 bg-surface-alt border border-outline rounded-md text-sm text-on-surface placeholder-on-surface-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 transition-colors"
                    />
                </div>
                {errors.confirmPassword && (
                    <p id="register-confirm-password-error" className="mt-1 text-xs text-error-text" role="alert">
                        {errors.confirmPassword.message}
                    </p>
                )}
            </div>

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
                        <span>{t.authRegistering}</span>
                    </>
                ) : (
                    <>
                        <UserPlus className="w-4 h-4" aria-hidden="true" />
                        <span>{t.authRegisterButton}</span>
                    </>
                )}
            </motion.button>

            {/* Switch to Login */}
            <div className="text-center">
                <button
                    type="button"
                    onClick={onSwitchToLogin}
                    disabled={isSubmitting}
                    className="text-xs text-on-surface-faint hover:text-on-surface-dim transition-colors disabled:opacity-50"
                >
                    {t.authHasAccount} <span className="text-accent">{t.authLoginLink}</span>
                </button>
            </div>
        </form>
    );
}
