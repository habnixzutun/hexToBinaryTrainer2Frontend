/**
 * PasswordSection: change the password.
 *
 * Same strength rules and live checklist as the registration form (shared via
 * utils/accountRules). On success the backend has revoked every session, so we
 * do not keep the user "logged in" on a dead session: `endSessionAfterPasswordChange`
 * clears the cookie and local state and the login screen explains why.
 */

import { useState, type ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useI18n } from '../../i18n/useI18n.ts';
import { changePassword } from '../../services/accountApi.ts';
import { passwordChecks, passwordSchema } from '../../utils/accountRules.ts';
import PasswordInput from '../auth/PasswordInput.tsx';
import { SUBMIT_CLASS, mapAccountError } from './accountForm.ts';

export default function PasswordSection(): ReactElement {
    const { endSessionAfterPasswordChange } = useAuth();
    const { t, locale } = useI18n();
    const [error, setError] = useState<string | null>(null);

    const schema = z.object({
        oldPassword: z.string().min(1, t.authPasswordRequired),
        newPassword: passwordSchema(t),
        confirmPassword: z.string(),
    }).refine(data => data.newPassword === data.confirmPassword, {
        message: t.authPasswordsDontMatch,
        path: ['confirmPassword'],
    });
    type FormData = z.infer<typeof schema>;

    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const newPassword = watch('newPassword', '');

    const onSubmit = async (data: FormData): Promise<void> => {
        setError(null);
        try {
            await changePassword(data.oldPassword, data.newPassword);
        } catch (err) {
            setError(mapAccountError(err, t, locale, {
                unauthorized: t.accountPasswordWrongOld,
                badRequest: detail =>
                    detail.includes('different') ? t.accountPasswordSame : t.accountPasswordWeak,
            }));
            return;
        }
        await endSessionAfterPasswordChange();
    };

    return (
        <section aria-labelledby="account-password-heading" className="space-y-3">
            <h3 id="account-password-heading" className="text-sm font-semibold text-on-surface">
                {t.accountPasswordSection}
            </h3>
            <p className="text-xs text-on-surface-faint">{t.accountPasswordHint}</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
                <PasswordInput
                    id="account-old-password"
                    name="oldPassword"
                    placeholder={t.accountPasswordOld}
                    autoComplete="current-password"
                    register={register}
                    error={errors.oldPassword}
                    isSubmitting={isSubmitting}
                />
                <PasswordInput
                    id="account-new-password"
                    name="newPassword"
                    placeholder={t.accountPasswordNew}
                    autoComplete="new-password"
                    register={register}
                    error={errors.newPassword}
                    isSubmitting={isSubmitting}
                    ariaDescribedBy="account-password-requirements"
                />

                {newPassword && (
                    <div id="account-password-requirements" className="space-y-1">
                        {passwordChecks(t, newPassword).map(check => (
                            <div key={check.label} className="flex items-center gap-2 text-xs">
                                <div className={`w-1.5 h-1.5 rounded-full ${check.met ? 'bg-accent' : 'bg-on-surface-subtle'}`} />
                                <span className={check.met ? 'text-accent' : 'text-on-surface-faint'}>
                                    {check.label}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                <PasswordInput
                    id="account-confirm-password"
                    name="confirmPassword"
                    placeholder={t.accountPasswordNewConfirm}
                    autoComplete="new-password"
                    register={register}
                    error={errors.confirmPassword}
                    isSubmitting={isSubmitting}
                />

                {error && (
                    <p role="alert" className="text-xs text-error-text">{error}</p>
                )}

                <button type="submit" disabled={isSubmitting} className={SUBMIT_CLASS}>
                    {isSubmitting ? t.accountSaving : t.accountPasswordSave}
                </button>
            </form>
        </section>
    );
}
