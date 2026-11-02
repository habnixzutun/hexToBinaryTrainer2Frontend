/**
 * DeleteAccountConfirmScreen: handles the link from the deletion email.
 *
 * Reads the token from props (extracted from ?token= in the URL by App.tsx),
 * asks for the password, and calls POST /api/users/me/delete/confirm.
 * On success it clears local auth state and shows a farewell message.
 */

import { useState, type ReactElement } from 'react';
import { Terminal } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useI18n } from '../../i18n/useI18n.ts';
import { confirmAccountDeletion } from '../../services/deviceApi.ts';
import { AccountApiError } from '../../services/accountApi.ts';
import PasswordInput from '../auth/PasswordInput.tsx';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface Props {
    token: string;
    onDone: () => void;
}

type Step = 'form' | 'done' | 'invalid';

export default function DeleteAccountConfirmScreen({ token, onDone }: Props): ReactElement {
    const { t } = useI18n();
    const { endSessionAfterPasswordChange } = useAuth();
    const [step, setStep] = useState<Step>('form');
    const [apiError, setApiError] = useState<string | null>(null);

    const schema = z.object({
        password: z.string().min(1, t.authPasswordRequired),
    });
    type FormData = z.infer<typeof schema>;

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData): Promise<void> => {
        setApiError(null);
        try {
            await confirmAccountDeletion(token, data.password);
            await endSessionAfterPasswordChange();
            setStep('done');
            window.history.replaceState({}, '', import.meta.env.BASE_URL);
        } catch (err) {
            if (err instanceof AccountApiError) {
                if (err.status === 401 || err.status === 400) {
                    setApiError(t.accountDeleteWrongPassword);
                    return;
                }
                if (err.status === 404 || err.status === 410 || err.status === 422) {
                    window.history.replaceState({}, '', import.meta.env.BASE_URL);
                    setStep('invalid');
                    return;
                }
            }
            setApiError(t.accountGenericError);
        }
    };

    const Layout = ({ children }: { children: ReactElement }): ReactElement => (
        <div className="flex items-center justify-center min-h-screen bg-surface p-4">
            <main className="w-full max-w-sm" aria-labelledby="delete-heading">
                <div className="flex items-center gap-2 mb-6">
                    <Terminal strokeWidth={1.5} size={16} className="text-accent" aria-hidden="true" />
                    <span className="text-xs font-bold tracking-wider text-on-surface-faint uppercase">IT Trainer</span>
                </div>
                {children}
            </main>
        </div>
    );

    if (step === 'invalid') {
        return (
            <Layout>
                <div className="space-y-3">
                    <h1 id="delete-heading" className="text-lg font-bold text-on-surface">{t.accountDeleteLinkInvalidTitle}</h1>
                    <p className="text-sm text-on-surface-faint">{t.accountDeleteLinkInvalidText}</p>
                    <button type="button" onClick={onDone} className="text-sm text-accent hover:underline">
                        {t.authBackToLogin}
                    </button>
                </div>
            </Layout>
        );
    }

    if (step === 'done') {
        return (
            <Layout>
                <div className="space-y-3">
                    <h1 id="delete-heading" className="text-lg font-bold text-on-surface">{t.accountDeleteDoneTitle}</h1>
                    <p className="text-sm text-on-surface-faint">{t.accountDeleteDoneText}</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-5">
                <div className="space-y-1">
                    <h1 id="delete-heading" className="text-lg font-bold text-on-surface">{t.accountDeleteConfirmTitle}</h1>
                    <p className="text-sm text-on-surface-faint">{t.accountDeleteConfirmSubtitle}</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
                    <PasswordInput
                        id="delete-confirm-password"
                        name="password"
                        placeholder={t.authPassword}
                        autoComplete="current-password"
                        register={register}
                        error={errors.password}
                        isSubmitting={isSubmitting}
                    />

                    {apiError && <p role="alert" className="text-xs text-error-text">{apiError}</p>}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 min-h-[44px] bg-error-text text-white font-semibold rounded-md text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                        {isSubmitting ? t.accountSaving : t.accountDeleteConfirmSubmit}
                    </button>
                </form>
            </div>
        </Layout>
    );
}
