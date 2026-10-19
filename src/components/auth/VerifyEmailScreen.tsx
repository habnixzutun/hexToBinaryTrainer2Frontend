/**
 * Verify Email Screen: Shown after successful registration.
 *
 * Features:
 * - Displays "Check your email" message
 * - Shows email address for clarity
 * - Link to go back to login
 * - Future: Resend verification email button
 */

import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useI18n } from '../../i18n/useI18n';

// ==================== Types ====================

interface VerifyEmailScreenProps {
    email: string;
    onBackToLogin: () => void;
}

// ==================== Component ====================

export default function VerifyEmailScreen({ email, onBackToLogin }: VerifyEmailScreenProps): JSX.Element {
    const { t } = useI18n();

    return (
        <div className="text-center space-y-6">
            {/* Success Icon */}
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

            {/* Heading */}
            <div>
                <h2 className="text-lg font-bold text-on-surface mb-2">
                    {t.authCheckEmail}
                </h2>
                <p className="text-sm text-on-surface-faint leading-relaxed">
                    {t.authVerificationSent}
                </p>
                <p className="text-sm font-semibold text-on-surface mt-1">
                    {email}
                </p>
            </div>

            {/* Instructions */}
            <div className="bg-surface-alt border border-outline rounded-md p-4 text-left space-y-2">
                <p className="text-xs text-on-surface-faint leading-relaxed">
                    <strong className="text-on-surface">{t.authNextSteps}</strong>
                </p>
                <ol className="text-xs text-on-surface-faint space-y-1.5 list-decimal list-inside">
                    <li>{t.authStep1}</li>
                    <li>{t.authStep2}</li>
                    <li>{t.authStep3}</li>
                </ol>
                <p className="text-xs text-on-surface-faint mt-2">
                    <Mail className="w-3 h-3 inline-block mr-1" aria-hidden="true" />
                    {t.authCheckSpam}
                </p>
            </div>

            {/* Back to Login Button */}
            <motion.button
                onClick={onBackToLogin}
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
