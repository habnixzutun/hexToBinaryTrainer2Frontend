/**
 * Persistence switch: the single place that decides whether the app may
 * write to localStorage.
 *
 * Guest mode turns persistence off, so a guest session leaves nothing behind
 * in the browser. Reading stays allowed — values saved before the guest
 * session started (e.g. theme, language) are still applied.
 */

let persistenceEnabled = true;

/**
 * Enable or disable writes to localStorage.
 */
export function setPersistenceEnabled(enabled: boolean): void {
    persistenceEnabled = enabled;
}

/**
 * Check whether writes to localStorage are currently allowed.
 */
export function isPersistenceEnabled(): boolean {
    return persistenceEnabled;
}

/**
 * Write a value to localStorage — skipped while persistence is disabled.
 *
 * Silently ignores storage errors (private browsing, quota exceeded).
 */
export function persistItem(key: string, value: string): void {
    if (!persistenceEnabled) return;
    try {
        localStorage.setItem(key, value);
    } catch {
        // localStorage unavailable — persistence is best-effort
    }
}
