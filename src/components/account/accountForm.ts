/**
 * Shared bits of the three account-settings sections: the input styling and the
 * mapping from a backend error to a translated message.
 */

import { AccountApiError } from '../../services/accountApi.ts';
import type { Translations } from '../../i18n/translations.ts';

export const INPUT_CLASS =
    'w-full px-3 py-2 bg-surface-alt border border-outline rounded-md text-sm text-on-surface placeholder-on-surface-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 transition-colors';

export const SUBMIT_CLASS =
    'w-full flex items-center justify-center gap-2 min-h-[44px] bg-accent hover:bg-accent-hover disabled:bg-surface-raised disabled:text-on-surface-subtle text-on-surface font-semibold rounded-md text-sm transition-colors';

/** Locale-aware "Nov 5, 2026, 14:30" for the cooldown message. */
export function formatDateTime(iso: string, locale: string): string {
    return new Date(iso).toLocaleString(locale === 'de' ? 'de-DE' : 'en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

/** Per-endpoint translations of the status codes the backend answers with. */
export interface ErrorCopy {
    /** 409 Conflict. */
    conflict?: string;
    /** 401 Unauthorized (on change-password: the old password is wrong). */
    unauthorized?: string;
    /** 400 Bad Request (on change-password: weak or unchanged password). */
    badRequest?: (detail: string) => string;
    /** 429 with the end of the cooldown. */
    cooldown?: (date: string) => string;
}

export function mapAccountError(
    err: unknown,
    t: Translations,
    locale: string,
    copy: ErrorCopy,
): string {
    if (!(err instanceof AccountApiError)) return t.accountGenericError;

    if (err.status === 409 && copy.conflict) return copy.conflict;
    if (err.status === 401 && copy.unauthorized) return copy.unauthorized;
    if (err.status === 400 && copy.badRequest) return copy.badRequest(err.message);
    if (err.status === 429 && copy.cooldown && err.nextChangeAt) {
        return copy.cooldown(formatDateTime(err.nextChangeAt, locale));
    }
    return t.accountGenericError;
}
