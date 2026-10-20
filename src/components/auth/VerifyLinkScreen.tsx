import { type ReactElement } from 'react';
/**
 * Verify Link Screen: Result of processing a ?token= verification link
 * from the user's email (backend sends {FRONTEND_URL}/verify-email?token=...).
 *
 * States:
 * - verifying: spinner while POST /api/auth/verify-email is in flight
 * - success: account activated, user can proceed to login
 * - error: shows the backend error detail (expired/invalid token, ...)
 */

import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { useI18n } from '../../i18n/useI18n.ts';

// ==================== Types ====================

export type VerifyLinkStatus = 'verifying' | 'success' | 'error';

interface VerifyLinkScreenProps {
    status: VerifyLinkStatus;
    errorMessage: string;
    onBackToLogin: () => void;
}

// ==================== Component ====================

export default function VerifyLinkScreen({
    status,
    errorMessage,
    onBackToLogin,
}: VerifyLinkScreenProps): ReactElement {
    const { t } = useI18n();

    return (
        <div className="text-center space-y-6" role="status">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="flex justify-center"
            >
                {status === 'verifying' && (
                    <Loader2 className="w-10 h-10 text-accent animate-spin" aria-hidden="true" />
                )}
                {status === 'success' && (
                    <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-accent" aria-hidden="true" />
                    </div>
                )}
                {status === 'error' && (
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-red-500" aria-hidden="true" />
                    </div>
                )}
            </motion.div>

            <div>
                <h2 id="welcome-heading" className="text-lg font-bold text-on-surface mb-2">
                    {status === 'verifying' && t.authLinkVerifying}
                    {status === 'success' && t.authLinkVerifiedTitle}
                    {status === 'error' && t.authLinkFailedTitle}
                </h2>
                {status === 'success' && (
                    <p className="text-sm text-on-surface-faint leading-relaxed">
                        {t.authLinkVerifiedSubtitle}
                    </p>
                )}
                {status === 'error' && errorMessage && (
                    <p className="text-sm text-red-500 leading-relaxed">{errorMessage}</p>
                )}
            </div>

            {status !== 'verifying' && (
                <motion.button
                    onClick={onBackToLogin}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 bg-surface-alt hover:bg-surface-raised border border-outline text-on-surface font-semibold py-2 rounded-md text-sm transition-all"
                >
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    <span>{t.authBackToLogin}</span>
                </motion.button>
            )}
        </div>
    );
}
