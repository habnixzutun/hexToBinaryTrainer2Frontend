/**
 * Detect the "confirm your new email" link
 * ({FRONTEND_URL}/verify-email-change?token=...) sent by the backend.
 */

const LINK_PATH = '/verify-email-change';

/** The token from a verify-email-change link, or null for any other URL. */
export function readEmailChangeTokenFromUrl(): string | null {
    const path = window.location.pathname.replace(/\/$/, '');
    if (!path.endsWith(LINK_PATH)) return null;
    const token = new URLSearchParams(window.location.search).get('token');
    return token ? token : null;
}
