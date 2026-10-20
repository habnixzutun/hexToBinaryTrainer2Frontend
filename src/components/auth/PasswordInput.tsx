/**
 * PasswordInput: Password field with visibility toggle (eye icon).
 *
 * Features:
 * - Toggles between password and text type
 * - Accessible toggle button with aria-label
 * - Supports react-hook-form register
 * - Error message display
 */

import { useState, type ReactElement } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { type UseFormRegister, type FieldValues, type FieldError, type Path } from 'react-hook-form';
import { useI18n } from '../../i18n/useI18n.ts';

// ==================== Types ====================

interface PasswordInputProps<T extends FieldValues> {
    id: string;
    name: Path<T>;
    placeholder?: string;
    autoComplete?: string;
    register: UseFormRegister<T>;
    error?: FieldError | undefined;
    isSubmitting: boolean;
    autoFocus?: boolean;
    ariaDescribedBy?: string;
}

// ==================== Component ====================

export default function PasswordInput<T extends FieldValues>({
    id,
    name,
    placeholder,
    autoComplete = 'current-password',
    register,
    error,
    isSubmitting,
    autoFocus = false,
    ariaDescribedBy,
}: PasswordInputProps<T>): ReactElement {
    const [visible, setVisible] = useState(false);
    const { t } = useI18n();

    return (
        <div>
            <label htmlFor={id} className="sr-only">
                {placeholder ?? t.authPassword}
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-on-surface-subtle" aria-hidden="true" />
                </div>
                <input
                    id={id}
                    type={visible ? 'text' : 'password'}
                    autoComplete={autoComplete}
                    autoFocus={autoFocus}
                    {...register(name)}
                    placeholder={placeholder ?? t.authPassword}
                    aria-required="true"
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? `${id}-error` : ariaDescribedBy}
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-10 py-2 bg-surface-alt border border-outline rounded-md text-sm text-on-surface placeholder-on-surface-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 transition-colors"
                />
                <button
                    type="button"
                    onClick={() => setVisible(!visible)}
                    disabled={isSubmitting}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-subtle hover:text-on-surface-dim disabled:opacity-50 transition-colors"
                    aria-label={visible ? t.authHidePassword : t.authShowPassword}
                    tabIndex={-1}
                >
                    {visible
                        ? <EyeOff className="h-4 w-4" aria-hidden="true" />
                        : <Eye className="h-4 w-4" aria-hidden="true" />
                    }
                </button>
            </div>
            {error && (
                <p id={`${id}-error`} className="mt-1 text-xs text-error-text" role="alert">
                    {error.message}
                </p>
            )}
        </div>
    );
}
