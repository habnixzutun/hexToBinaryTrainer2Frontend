const LINK_PATH = '/delete-account';

/** The token from a delete-account confirmation link, or null for any other URL. */
export function readAccountDeletionTokenFromUrl(): string | null {
    const path = window.location.pathname.replace(/\/$/, '');
    if (!path.endsWith(LINK_PATH)) return null;
    const token = new URLSearchParams(window.location.search).get('token');
    return token ? token : null;
}
