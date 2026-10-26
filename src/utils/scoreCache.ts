/**
 * Score Cache: LocalStorage-backed cache for user game stats.
 *
 * Caches correct_count, incorrect_count, and points per user in localStorage
 * for fast UI rendering. The backend remains the single source of truth —
 * the cache is synced after every successful API call.
 *
 * Design decisions:
 * - Keyed by user_id to avoid stale data across accounts
 * - Written after every refreshUser / login / game-submit
 * - Cleared on logout
 * - Never read as authority — only for optimistic rendering / fallback
 */

const STORAGE_KEY_PREFIX = 'score_cache_';

export interface CachedScore {
    correct_count: number;
    incorrect_count: number;
    points: number;
    updatedAt: number;
}

/**
 * Build the localStorage key for a given user.
 */
function storageKey(userId: string): string {
    return `${STORAGE_KEY_PREFIX}${userId}`;
}

/**
 * Read cached score for a user from localStorage.
 *
 * @returns Cached score or null if not present / corrupt
 */
export function getScoreCache(userId: string): CachedScore | null {
    try {
        const raw = localStorage.getItem(storageKey(userId));
        if (raw === null) return null;
        const parsed: unknown = JSON.parse(raw);
        if (!isCachedScore(parsed)) return null;
        return parsed;
    } catch {
        return null;
    }
}

/**
 * Write score data to the cache for a given user.
 */
export function setScoreCache(
    userId: string,
    data: Omit<CachedScore, 'updatedAt'>
): void {
    try {
        const entry: CachedScore = {
            ...data,
            updatedAt: Date.now(),
        };
        localStorage.setItem(storageKey(userId), JSON.stringify(entry));
    } catch {
        // localStorage full or unavailable — cache is best-effort, don't throw
    }
}

/**
 * Clear cached score for a specific user.
 */
export function clearScoreCache(userId: string): void {
    try {
        localStorage.removeItem(storageKey(userId));
    } catch {
        // Ignore — nothing to clear
    }
}

/**
 * Type guard for cached score entries.
 */
function isCachedScore(value: unknown): value is CachedScore {
    return (
        typeof value === 'object' &&
        value !== null &&
        'correct_count' in value &&
        'incorrect_count' in value &&
        'points' in value &&
        'updatedAt' in value &&
        typeof (value as CachedScore).correct_count === 'number' &&
        typeof (value as CachedScore).incorrect_count === 'number' &&
        typeof (value as CachedScore).points === 'number' &&
        typeof (value as CachedScore).updatedAt === 'number'
    );
}
