import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    SCORE_CACHE_VERSION,
    clearScoreCache,
    getScoreCache,
    setScoreCache,
    type CachedScore,
    type CachedScoreInput,
} from '../../src/utils/scoreCache.ts';

const economy: CachedScoreInput = {
    correct_count: 42,
    incorrect_count: 5,
    total_xp: 1320,
    level: 6,
    current_streak: 3,
    best_streak: 7,
};

/** A pre-Sprint-4 localStorage entry: legacy `points`, no version marker. */
const legacyEntry = {
    correct_count: 10,
    incorrect_count: 5,
    points: 100,
    updatedAt: 1_700_000_000_000,
};

describe('scoreCache', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('cache version', () => {
        it('is versioned so stale entries are rejected deliberately', () => {
            expect(SCORE_CACHE_VERSION).toBe(2);
        });

        it('stamps every written entry with the current version', () => {
            setScoreCache('user-123', economy);

            const stored = localStorage.getItem(`score_cache_user-123`);
            expect(stored).not.toBeNull();
            const parsed: CachedScore = JSON.parse(stored!);
            expect(parsed.version).toBe(SCORE_CACHE_VERSION);
        });

        it('drops a legacy points-shaped entry and removes it from storage', () => {
            const userId = 'user-legacy';
            localStorage.setItem(`score_cache_${userId}`, JSON.stringify(legacyEntry));

            expect(getScoreCache(userId)).toBeNull();
            expect(localStorage.getItem(`score_cache_${userId}`)).toBeNull();
        });

        it('drops an entry from a newer/other version and removes it from storage', () => {
            const userId = 'user-other-version';
            localStorage.setItem(
                `score_cache_${userId}`,
                JSON.stringify({ ...economy, version: SCORE_CACHE_VERSION + 1, updatedAt: 1 })
            );

            expect(getScoreCache(userId)).toBeNull();
            expect(localStorage.getItem(`score_cache_${userId}`)).toBeNull();
        });
    });

    describe('setScoreCache', () => {
        it('writes the economy shape with an updatedAt timestamp', () => {
            const userId = 'user-123';

            setScoreCache(userId, economy);

            const stored = localStorage.getItem(`score_cache_${userId}`);
            expect(stored).not.toBeNull();

            const parsed: CachedScore = JSON.parse(stored!);
            expect(parsed.correct_count).toBe(42);
            expect(parsed.incorrect_count).toBe(5);
            expect(parsed.total_xp).toBe(1320);
            expect(parsed.level).toBe(6);
            expect(parsed.current_streak).toBe(3);
            expect(parsed.best_streak).toBe(7);
            expect(parsed.updatedAt).toBeTypeOf('number');
            expect(parsed.updatedAt).toBeGreaterThan(0);
        });

        it('never writes the legacy points field', () => {
            setScoreCache('user-123', economy);
            const parsed = JSON.parse(localStorage.getItem('score_cache_user-123')!) as Record<string, unknown>;
            expect(parsed).not.toHaveProperty('points');
        });

        it('overwrites the existing cache for the same user', () => {
            const userId = 'user-456';

            setScoreCache(userId, economy);
            setScoreCache(userId, { ...economy, total_xp: 2080, level: 7, current_streak: 0 });

            const cached = getScoreCache(userId);
            expect(cached).not.toBeNull();
            expect(cached!.total_xp).toBe(2080);
            expect(cached!.level).toBe(7);
            expect(cached!.current_streak).toBe(0);
            expect(cached!.best_streak).toBe(7);
        });

        it('stores separate entries for different users', () => {
            setScoreCache('user-A', economy);
            setScoreCache('user-B', { ...economy, total_xp: 0, level: 1 });

            expect(getScoreCache('user-A')!.total_xp).toBe(1320);
            expect(getScoreCache('user-B')!.total_xp).toBe(0);
        });

        it('does not throw when localStorage is unavailable', () => {
            const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
                throw new Error('QuotaExceededError');
            });

            expect(() => setScoreCache('user-x', economy)).not.toThrow();

            setItemSpy.mockRestore();
        });
    });

    describe('getScoreCache', () => {
        it('returns null when no cache exists for the user', () => {
            expect(getScoreCache('nonexistent')).toBeNull();
        });

        it('round-trips after setScoreCache', () => {
            const userId = 'user-789';
            setScoreCache(userId, economy);

            const cached = getScoreCache(userId);
            expect(cached).not.toBeNull();
            expect(cached).toEqual({ ...economy, version: SCORE_CACHE_VERSION, updatedAt: cached!.updatedAt });
        });

        it('returns null for corrupt JSON data', () => {
            const userId = 'user-corrupt';
            localStorage.setItem(`score_cache_${userId}`, 'not-json{{{');

            expect(getScoreCache(userId)).toBeNull();
        });

        it('returns null when data is missing required fields', () => {
            const userId = 'user-incomplete';
            localStorage.setItem(
                `score_cache_${userId}`,
                JSON.stringify({ correct_count: 10, version: SCORE_CACHE_VERSION, updatedAt: 1 })
            );

            expect(getScoreCache(userId)).toBeNull();
        });

        it('returns null when a required economy field is absent', () => {
            const userId = 'user-no-level';
            const missingLevel: Partial<CachedScoreInput> = { ...economy };
            delete missingLevel.level;
            localStorage.setItem(
                `score_cache_${userId}`,
                JSON.stringify({ ...missingLevel, version: SCORE_CACHE_VERSION, updatedAt: 1 })
            );

            expect(getScoreCache(userId)).toBeNull();
        });

        it('returns null when data has wrong types', () => {
            const userId = 'user-wrong-types';
            localStorage.setItem(
                `score_cache_${userId}`,
                JSON.stringify({ ...economy, level: 'six', version: SCORE_CACHE_VERSION, updatedAt: 1 })
            );

            expect(getScoreCache(userId)).toBeNull();
        });

        it('returns null when the version marker is not a number', () => {
            const userId = 'user-string-version';
            localStorage.setItem(
                `score_cache_${userId}`,
                JSON.stringify({ ...economy, version: 'two', updatedAt: 1 })
            );

            expect(getScoreCache(userId)).toBeNull();
        });

        it('returns null for a non-object payload', () => {
            const userId = 'user-array';
            localStorage.setItem(`score_cache_${userId}`, JSON.stringify([economy]));

            expect(getScoreCache(userId)).toBeNull();
        });
    });

    describe('clearScoreCache', () => {
        it('removes the cached entry for a specific user', () => {
            const userId = 'user-to-clear';
            setScoreCache(userId, economy);

            clearScoreCache(userId);

            expect(getScoreCache(userId)).toBeNull();
        });

        it('does not affect other users cache', () => {
            setScoreCache('user-A', economy);
            setScoreCache('user-B', { ...economy, total_xp: 252, level: 3 });

            clearScoreCache('user-A');

            expect(getScoreCache('user-A')).toBeNull();
            expect(getScoreCache('user-B')).not.toBeNull();
            expect(getScoreCache('user-B')!.total_xp).toBe(252);
        });

        it('does not throw when the cache does not exist', () => {
            expect(() => clearScoreCache('nonexistent-user')).not.toThrow();
        });
    });
});
