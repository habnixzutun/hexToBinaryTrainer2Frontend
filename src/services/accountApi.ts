/**
 * Account API Service: changing username, email and password.
 *
 * Endpoints:
 * - PATCH /api/user/username            - change username (7-day cooldown)
 * - PATCH /api/user/email               - request an email change (sends a mail
 *                                          to the NEW address; nothing changes yet)
 * - POST  /api/auth/verify-email-change - confirm the change with the mail token
 * - POST  /api/user/change-password     - change password (revokes ALL sessions)
 *
 * The first, second and last need the access token, so they go through
 * `authenticatedFetch` (adds the Bearer header, refreshes once on 401). The
 * verify call is public: the signed token in the mail is the credential.
 */

import { authenticatedFetch } from './api.ts';

const BASE_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

/**
 * Error with the HTTP status attached, so the UI can pick a translated message
 * per case (409 = taken, 429 = cooldown, 401 = wrong password) instead of
 * showing the backend's English text.
 */
export class AccountApiError extends Error {
    readonly status: number;
    /** ISO timestamp from a 429 on the username endpoint. */
    readonly nextChangeAt: string | undefined;

    constructor(status: number, message: string, nextChangeAt?: string) {
        super(message);
        this.name = 'AccountApiError';
        this.status = status;
        this.nextChangeAt = nextChangeAt;
    }
}

/** FastAPI's `detail` is a string, an object (429) or a list (422). */
async function toApiError(response: Response, fallback: string): Promise<AccountApiError> {
    const body = await response.json().catch(() => null) as { detail?: unknown } | null;
    const detail = body?.detail;

    if (typeof detail === 'string') {
        return new AccountApiError(response.status, detail);
    }
    if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
        const { message, next_change_at } = detail as { message?: string; next_change_at?: string };
        return new AccountApiError(response.status, message ?? fallback, next_change_at);
    }
    return new AccountApiError(response.status, fallback);
}

async function send(
    path: string,
    method: 'PATCH' | 'POST',
    body: unknown,
    fallback: string,
): Promise<void> {
    const response = await authenticatedFetch(`${BASE_URL}${path}`, {
        method,
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        throw await toApiError(response, fallback);
    }
}

export function changeUsername(newUsername: string): Promise<void> {
    return send('/api/user/username', 'PATCH', { new_username: newUsername }, 'Username change failed');
}

export function requestEmailChange(newEmail: string): Promise<void> {
    return send('/api/user/email', 'PATCH', { new_email: newEmail }, 'Email change request failed');
}

export function changePassword(oldPassword: string, newPassword: string): Promise<void> {
    return send(
        '/api/user/change-password',
        'POST',
        { old_password: oldPassword, new_password: newPassword },
        'Password change failed',
    );
}

/** Confirm a pending email change with the token from the mail link. */
export async function verifyEmailChange(token: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/api/auth/verify-email-change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
    });
    if (!response.ok) {
        throw await toApiError(response, 'Email change verification failed');
    }
}
