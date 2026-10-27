/**
 * Forgot Password Form: Email input to request a password reset link.
 *
 * Features:
 * - Zod validation for email format
 * - Generic success message (no email enumeration)
 * - Loading state during submission
 * - Error message display
 * - Links to login and (after submit) back to login
 */

import { useState, type ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { useI18n } from '../../i18n/useI18n.ts';
import { requestPasswordReset } from '../../services/authApi.ts';

// ==================== Types ====================

interface ForgotPasswordFormProps {
    onSwitchToLogin: () => void;
}

// ==================== Component ====================

export default function ForgotPasswordForm({ onSwitchToLogin }: ForgotPasswordFormProps): ReactElement {
    const { t } = useI18n();
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const forgotSchema = z.object({
        email: z.string()
            .min(1, t.authEmailRequired)
            .email(t.authEmailInvalid),
    });

    type ForgotPasswordData = z.infer<typeof forgotSchema>;

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ForgotPasswordData>({
        resolver: zodResolver(forgotSchema),
    });

    const onSubmit = async (data: ForgotPasswordData): Promise<void> => {
        setSubmitError(null);

        try {
            await requestPasswordReset({ email: data.email });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Password reset request failed';
            setSubmitError(message);
        } finally {
            // Always show success to prevent email enumeration
            setIsSuccess(true);
        }
    };

    if (isSuccess) {
        return (
            <div className="text-center space-y-6">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                    className="flex justify-center"
                >
                    <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-accent" aria-hidden="true" />
                    </div>
                </motion.div>

                <div>
                    <p className="text-sm text-on-surface leading-relaxed">
                        {t.authForgotPasswordSuccess}
                    </p>
                    <p className="text-xs text-on-surface-faint mt-2">
                        {t.authForgotPasswordCheckEmail}
                    </p>
                </div>

                <motion.button
                    onClick={onSwitchToLogin}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 bg-surface-alt hover:bg-surface-raised border border-outline text-on-surface font-semibold py-2 rounded-md text-sm transition-all"
                >
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    <span>{t.authBackToLogin}</span>
                </motion.button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" aria-label={t.authForgotPasswordTitle}>
            {/* Email Input */}
            <div>
                <label htmlFor="forgot-email" className="sr-only">
                    {t.authEmail}
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-on-surface-subtle" aria-hidden="true" />
                    </div>
                    <input
                        id="forgot-email"
                        type="email"
                        autoComplete="email"
                        autoFocus
                        {...register('email')}
                        placeholder={t.authEmail}
                        aria-required="true"
                        aria-invalid={errors.email ? 'true' : 'false'}
                        aria-describedby={errors.email ? 'forgot-email-error' : undefined}
                        disabled={isSubmitting}
                        className="w-full pl-10 pr-3 py-2 bg-surface-alt border border-outline rounded-md text-sm text-on-surface placeholder-on-surface-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 transition-colors"
                    />
                </div>
                {errors.email && (
                    <p id="forgot-email-error" className="mt-1 text-xs text-error-text" role="alert">
                        {errors.email.message}
                    </p>
                )}
            </div>

            {/* Error Message */}
            {submitError && (
                <div className="p-3 bg-error-bg border border-error-border rounded-md" role="alert">
                    <p className="text-xs text-error-text">{submitError}</p>
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
                    <span>{t.authForgotPasswordSending}</span>
                ) : (
                    <>
                        <Send className="w-4 h-4" aria-hidden="true" />
                        <span>{t.authForgotPasswordSubmit}</span>
                    </>
                )}
            </motion.button>

            {/* Back to Login */}
            <div className="text-center">
                <button
                    type="button"
                    onClick={onSwitchToLogin}
                    disabled={isSubmitting}
                    className="text-xs text-on-surface-faint hover:text-on-surface-dim transition-colors disabled:opacity-50"
                >
                    <span className="text-accent">{t.authBackToLogin}</span>
                </button>
            </div>
        </form>
    );
}
