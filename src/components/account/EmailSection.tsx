/**
 * EmailSection: request an email change.
 *
 * Nothing changes on submit. The backend mails a confirmation link to the NEW
 * address; only opening that link (see EmailChangeLinkScreen) switches the
 * account over. That proves the user controls the new address and keeps a typo
 * from locking them out. Until then the old address stays valid.
 */

import { useState, type ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useI18n } from '../../i18n/useI18n.ts';
import { requestEmailChange } from '../../services/accountApi.ts';
import { emailSchema } from '../../utils/accountRules.ts';
import { INPUT_CLASS, SUBMIT_CLASS, mapAccountError } from './accountForm.ts';

export default function EmailSection(): ReactElement {
    const { user } = useAuth();
    const { t, locale } = useI18n();
    const [status, setStatus] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

    const schema = z.object({
        email: emailSchema(t).refine(
            mail => mail.toLowerCase() !== user?.email.toLowerCase(),
            t.accountEmailSame,
        ),
    });
    type FormData = z.infer<typeof schema>;

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData): Promise<void> => {
        setStatus(null);
        try {
            await requestEmailChange(data.email);
            reset();
            setStatus({ kind: 'success', text: t.accountEmailSent(data.email) });
        } catch (err) {
            setStatus({
                kind: 'error',
                text: mapAccountError(err, t, locale, { conflict: t.accountEmailTaken }),
            });
        }
    };

    return (
        <section aria-labelledby="account-email-heading" className="space-y-3">
            <h3 id="account-email-heading" className="text-sm font-semibold text-on-surface">
                {t.accountEmailSection}
            </h3>
            <p className="text-xs text-on-surface-dim break-all">{user?.email}</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
                <div>
                    <label htmlFor="account-email" className="sr-only">{t.accountEmailNew}</label>
                    <input
                        id="account-email"
                        type="email"
                        autoComplete="email"
                        placeholder={t.accountEmailNew}
                        {...register('email')}
                        disabled={isSubmitting}
                        aria-invalid={errors.email ? 'true' : 'false'}
                        aria-describedby={errors.email ? 'account-email-error' : undefined}
                        className={INPUT_CLASS}
                    />
                    {errors.email && (
                        <p id="account-email-error" className="mt-1 text-xs text-error-text" role="alert">
                            {errors.email.message}
                        </p>
                    )}
                </div>

                {status && (
                    <p
                        role={status.kind === 'error' ? 'alert' : 'status'}
                        className={`text-xs ${status.kind === 'error' ? 'text-error-text' : 'text-accent'}`}
                    >
                        {status.text}
                    </p>
                )}

                <button type="submit" disabled={isSubmitting} className={SUBMIT_CLASS}>
                    {isSubmitting ? t.accountSaving : t.accountEmailSave}
                </button>
            </form>
        </section>
    );
}
