/**
 * UsernameSection: change the username.
 *
 * The backend allows one change per 7 days. `user.next_username_change_at`
 * (from GET /api/user/me) tells us up front whether that lock is active, so the
 * field is disabled with a "possible again on ..." hint instead of the user
 * running into a 429. After a successful change `refreshUser()` reloads /me,
 * which both updates the name everywhere and starts the new lock.
 */

import { useState, type ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useI18n } from '../../i18n/useI18n.ts';
import { changeUsername } from '../../services/accountApi.ts';
import { usernameSchema } from '../../utils/accountRules.ts';
import { INPUT_CLASS, SUBMIT_CLASS, formatDateTime, mapAccountError } from './accountForm.ts';

export default function UsernameSection(): ReactElement {
    const { user, refreshUser } = useAuth();
    const { t, locale } = useI18n();
    const [status, setStatus] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

    const lockedUntil = user?.next_username_change_at ?? null;
    const isLocked = lockedUntil !== null;

    const schema = z.object({
        username: usernameSchema(t).refine(name => name !== user?.username, t.accountUsernameSame),
    });
    type FormData = z.infer<typeof schema>;

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData): Promise<void> => {
        setStatus(null);
        try {
            await changeUsername(data.username);
            await refreshUser();
            reset();
            setStatus({ kind: 'success', text: t.accountUsernameSaved });
        } catch (err) {
            setStatus({
                kind: 'error',
                text: mapAccountError(err, t, locale, {
                    conflict: t.accountUsernameTaken,
                    cooldown: t.accountUsernameLockedUntil,
                }),
            });
            // A 429 means our cached lock was stale (e.g. changed on another device).
            await refreshUser();
        }
    };

    return (
        <section aria-labelledby="account-username-heading" className="space-y-3">
            <h3 id="account-username-heading" className="text-sm font-semibold text-on-surface">
                {t.accountUsernameSection}
            </h3>
            <p className="text-xs text-on-surface-faint">
                {t.accountUsernameHint}
                {' '}<span className="text-on-surface-dim">{user?.username}</span>
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
                <div>
                    <label htmlFor="account-username" className="sr-only">{t.accountUsernameNew}</label>
                    <input
                        id="account-username"
                        type="text"
                        autoComplete="username"
                        placeholder={t.accountUsernameNew}
                        {...register('username')}
                        disabled={isLocked || isSubmitting}
                        aria-invalid={errors.username ? 'true' : 'false'}
                        aria-describedby={errors.username ? 'account-username-error' : undefined}
                        className={INPUT_CLASS}
                    />
                    {errors.username && (
                        <p id="account-username-error" className="mt-1 text-xs text-error-text" role="alert">
                            {errors.username.message}
                        </p>
                    )}
                </div>

                {isLocked && (
                    <p className="flex items-start gap-2 text-xs text-on-surface-faint">
                        <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                        <span>{t.accountUsernameLockedUntil(formatDateTime(lockedUntil, locale))}</span>
                    </p>
                )}

                {status && (
                    <p
                        role={status.kind === 'error' ? 'alert' : 'status'}
                        className={`text-xs ${status.kind === 'error' ? 'text-error-text' : 'text-accent'}`}
                    >
                        {status.text}
                    </p>
                )}

                <button type="submit" disabled={isLocked || isSubmitting} className={SUBMIT_CLASS}>
                    {isSubmitting ? t.accountSaving : t.accountUsernameSave}
                </button>
            </form>
        </section>
    );
}
