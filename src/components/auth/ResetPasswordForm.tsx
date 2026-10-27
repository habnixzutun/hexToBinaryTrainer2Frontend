/**
 * Reset Password Form: New password input using token from email link.
 *
 * Features:
 * - Token from URL query parameter
 * - Zod validation with password strength check (same rules as backend)
 * - Password requirements display (8+ chars, uppercase, lowercase, digit, special)
 * - Confirm password validation
 * - Loading state during submission
 * - Success/Error messages
 * - Redirect to login after success
 */

import { useState, type ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { ArrowLeft, KeyRound, CheckCircle } from 'lucide-react';
import { useI18n } from '../../i18n/useI18n.ts';
import { resetPassword } from '../../services/authApi.ts';
import PasswordInput from './PasswordInput.tsx';

// ==================== Types ====================

interface ResetPasswordFormProps {
    token: string;
    onSwitchToLogin: () => void;
}

// ==================== Component ====================

export default function ResetPasswordForm({ token, onSwitchToLogin }: ResetPasswordFormProps): ReactElement {
    const { t } = useI18n();
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const resetSchema = z.object({
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

    type ResetPasswordData = z.infer<typeof resetSchema>;

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<ResetPasswordData>({
        resolver: zodResolver(resetSchema),
    });

    const password = watch('password', '');

    const onSubmit = async (data: ResetPasswordData): Promise<void> => {
        setSubmitError(null);

        try {
            await resetPassword({
                token,
                new_password: data.password,
            });
            setIsSuccess(true);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Password reset failed';
            setSubmitError(message);
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
                        {t.authResetPasswordSuccess}
                    </p>
                </div>

                <motion.button
                    onClick={onSwitchToLogin}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-on-surface font-semibold py-2 rounded-md text-sm transition-all"
                >
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    <span>{t.authBackToLogin}</span>
                </motion.button>
            </div>
        );
    }

    const passwordChecks = [
        { label: t.authPasswordReqLength, met: password.length >= 8 },
        { label: t.authPasswordReqUppercase, met: /[A-Z]/.test(password) },
        { label: t.authPasswordReqLowercase, met: /[a-z]/.test(password) },
        { label: t.authPasswordReqDigit, met: /[0-9]/.test(password) },
        { label: t.authPasswordReqSpecial, met: /[^A-Za-z0-9]/.test(password) },
    ];

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" aria-label={t.authResetPasswordTitle}>
            {/* New Password Input */}
            <PasswordInput
                id="reset-password"
                name="password"
                placeholder={t.authNewPassword}
                autoComplete="new-password"
                register={register}
                error={errors.password}
                isSubmitting={isSubmitting}
                ariaDescribedBy="password-requirements"
                autoFocus
            />

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
            <PasswordInput
                id="reset-confirm-password"
                name="confirmPassword"
                placeholder={t.authConfirmNewPassword}
                autoComplete="new-password"
                register={register}
                error={errors.confirmPassword}
                isSubmitting={isSubmitting}
            />

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
                    <span>{t.authResetPasswordResetting}</span>
                ) : (
                    <>
                        <KeyRound className="w-4 h-4" aria-hidden="true" />
                        <span>{t.authResetPasswordSubmit}</span>
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
