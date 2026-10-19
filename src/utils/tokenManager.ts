/**
 * Token Manager: Handles access token storage and refresh logic.
 *
 * Access tokens are stored in memory (not localStorage) for security.
 * Refresh tokens are handled by backend via httponly cookies.
 */

let accessToken: string | null = null;

/**
 * Set the access token in memory.
 */
export function setAccessToken(token: string): void {
    accessToken = token;
}

/**
 * Get the access token from memory.
 */
export function getAccessToken(): string | null {
    return accessToken;
}

/**
 * Clear the access token from memory.
 */
export function clearAccessToken(): void {
    accessToken = null;
}

/**
 * Check if access token exists.
 */
export function hasAccessToken(): boolean {
    return accessToken !== null;
}
