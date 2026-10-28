/**
 * Score Cache: LocalStorage-backed cache for the user's XP economy.
 *
 * Caches the six economy figures per user in localStorage for fast UI
 * rendering. The backend remains the single source of truth — the cache is
 * synced after every successful API call.
 *
 * Design decisions:
 * - Keyed by user_id to avoid stale data across accounts
 * - Written after every refreshUser / login / game-submit
 * - Cleared on logout
 * - Never read as authority — only for optimistic rendering / fallback
 * - Versioned (US-38): a stale or unknown schema version is REJECTED and
 *   removed deliberately instead of being guessed at, so the pre-Sprint-4
 *   `points` shape can never resurface as an XP number
 */

const STORAGE_KEY_PREFIX = 'score_cache_';

/** Bump when the persisted shape changes; older entries are dropped on read. */
export const SCORE_CACHE_VERSION = 2;

/** The economy fields as written by the caller (no bookkeeping fields). */
export interface CachedScoreInput {
    correct_count: number;
    incorrect_count: number;
    total_xp: number;
    level: number;
    current_streak: number;
    best_streak: number;
}

export interface CachedScore extends CachedScoreInput {
    version: number;
    updatedAt: number;
}

const ECONOMY_FIELDS: readonly (keyof CachedScoreInput)[] = [
    'correct_count',
    'incorrect_count',
    'total_xp',
    'level',
    'current_streak',
    'best_streak',
];

/**
 * Build the localStorage key for a given user.
 */
function storageKey(userId: string): string {
    return `${STORAGE_KEY_PREFIX}${userId}`;
}

/**
 * Read cached score for a user from localStorage.
 *
 * @returns Cached score or null if absent / corrupt / from another schema version
 */
export function getScoreCache(userId: string): CachedScore | null {
    try {
        const raw = localStorage.getItem(storageKey(userId));
        if (raw === null) return null;
        const parsed: unknown = JSON.parse(raw);
        if (!isCachedScore(parsed)) {
            // Deliberate rejection: a stale entry must not survive as a ghost.
            clearScoreCache(userId);
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

/**
 * Write score data to the cache for a given user.
 */
export function setScoreCache(userId: string, data: CachedScoreInput): void {
    try {
        const entry: CachedScore = {
            ...data,
            version: SCORE_CACHE_VERSION,
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
 * Type guard for cached score entries: exact version, every economy field
 * present and finite. Anything else is treated as missing.
 */
function isCachedScore(value: unknown): value is CachedScore {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;

    const entry = value as Record<string, unknown>;
    if (entry.version !== SCORE_CACHE_VERSION) return false;
    if (typeof entry.updatedAt !== 'number') return false;

    return ECONOMY_FIELDS.every((field) => {
        const figure: unknown = entry[field];
        return typeof figure === 'number' && Number.isFinite(figure);
    });
}
