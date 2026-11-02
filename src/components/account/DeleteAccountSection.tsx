/**
 * DeleteAccountSection: GDPR account deletion with two-step confirmation.
 *
 * Step 1 — "Delete account" button → confirms intent with a warning box.
 * Step 2 — Sends DELETE request email → success message.
 *
 * The actual deletion happens on the confirm-link screen (DeleteAccountConfirmScreen).
 */

import { useState, type ReactElement } from 'react';
import { TriangleAlert } from 'lucide-react';
import { useI18n } from '../../i18n/useI18n.ts';
import { requestAccountDeletion } from '../../services/deviceApi.ts';

type Step = 'idle' | 'confirm' | 'sent';

export default function DeleteAccountSection(): ReactElement {
    const { t } = useI18n();
    const [step, setStep] = useState<Step>('idle');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRequest = async (): Promise<void> => {
        setSubmitting(true);
        setError(null);
        try {
            await requestAccountDeletion();
            setStep('sent');
        } catch {
            setError(t.accountGenericError);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section aria-labelledby="account-delete-heading" className="space-y-3">
            <h3 id="account-delete-heading" className="text-sm font-semibold text-on-surface">
                {t.accountDeleteSection}
            </h3>

            {step === 'idle' && (
                <>
                    <p className="text-xs text-on-surface-faint">{t.accountDeleteHint}</p>
                    <button
                        type="button"
                        onClick={() => setStep('confirm')}
                        className="px-3 py-2 text-xs font-medium rounded-md border border-error-text/40 text-error-text hover:bg-error-muted transition-colors"
                    >
                        {t.accountDeleteButton}
                    </button>
                </>
            )}

            {step === 'confirm' && (
                <div className="space-y-3 rounded-lg border border-error-text/30 bg-error-muted p-4">
                    <div className="flex gap-2 items-start">
                        <TriangleAlert size={16} className="shrink-0 text-error-text mt-0.5" aria-hidden="true" />
                        <p className="text-xs text-on-surface">{t.accountDeleteConfirmText}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={() => void handleRequest()}
                            className="px-3 py-2 text-xs font-semibold rounded-md bg-error-text text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                        >
                            {submitting ? t.accountSaving : t.accountDeleteConfirmButton}
                        </button>
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={() => { setStep('idle'); setError(null); }}
                            className="px-3 py-2 text-xs rounded-md text-on-surface-faint hover:text-on-surface hover:bg-surface-alt transition-colors"
                        >
                            {t.accountDeleteCancel}
                        </button>
                    </div>
                    {error && <p role="alert" className="text-xs text-error-text">{error}</p>}
                </div>
            )}

            {step === 'sent' && (
                <div className="rounded-lg border border-outline-faint bg-surface-alt p-4">
                    <p className="text-xs text-on-surface">{t.accountDeleteEmailSent}</p>
                </div>
            )}
        </section>
    );
}
