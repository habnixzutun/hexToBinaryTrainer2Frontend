/**
 * Validation rules shared by the registration form and the account settings.
 *
 * One definition, two consumers: a password that is accepted at sign-up must be
 * accepted when changing it later, and vice versa. The backend enforces the same
 * strength rules again (`validate_password_strength`), so these only give the
 * user fast feedback — they are not the security boundary.
 */

import { z } from 'zod';
import type { Translations } from '../i18n/translations.ts';

export function emailSchema(t: Translations) {
    return z.string()
        .min(1, t.authEmailRequired)
        .email(t.authEmailInvalid);
}

export function usernameSchema(t: Translations) {
    return z.string()
        .min(3, t.authUsernameMin)
        .max(50, t.authUsernameMax)
        .regex(/^[a-zA-Z0-9_-]+$/, t.authUsernameInvalid);
}

export function passwordSchema(t: Translations) {
    return z.string()
        .min(8, t.authPasswordMin)
        .max(128, t.authPasswordMax)
        .regex(/[A-Z]/, t.authPasswordUppercase)
        .regex(/[a-z]/, t.authPasswordLowercase)
        .regex(/[0-9]/, t.authPasswordDigit)
        .regex(/[^A-Za-z0-9]/, t.authPasswordSpecial);
}

export interface PasswordCheck {
    label: string;
    met: boolean;
}

/** The live checklist shown under a "new password" field. */
export function passwordChecks(t: Translations, password: string): PasswordCheck[] {
    return [
        { label: t.authPasswordReqLength, met: password.length >= 8 },
        { label: t.authPasswordReqUppercase, met: /[A-Z]/.test(password) },
        { label: t.authPasswordReqLowercase, met: /[a-z]/.test(password) },
        { label: t.authPasswordReqDigit, met: /[0-9]/.test(password) },
        { label: t.authPasswordReqSpecial, met: /[^A-Za-z0-9]/.test(password) },
    ];
}
