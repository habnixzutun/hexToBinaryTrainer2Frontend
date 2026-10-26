import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getScoreCache, setScoreCache, clearScoreCache, type CachedScore } from '../../src/utils/scoreCache';

describe('scoreCache', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('setScoreCache', () => {
        it('writes score data to localStorage with updatedAt timestamp', () => {
            const userId = 'user-123';
            const data = {
                correct_count: 10,
                incorrect_count: 5,
                points: 100,
            };

            setScoreCache(userId, data);

            const stored = localStorage.getItem(`score_cache_${userId}`);
            expect(stored).not.toBeNull();

            const parsed: CachedScore = JSON.parse(stored!);
            expect(parsed.correct_count).toBe(10);
            expect(parsed.incorrect_count).toBe(5);
            expect(parsed.points).toBe(100);
            expect(parsed.updatedAt).toBeTypeOf('number');
            expect(parsed.updatedAt).toBeGreaterThan(0);
        });

        it('overwrites existing cache for the same user', () => {
            const userId = 'user-456';

            setScoreCache(userId, { correct_count: 10, incorrect_count: 5, points: 100 });
            setScoreCache(userId, { correct_count: 20, incorrect_count: 10, points: 200 });

            const cached = getScoreCache(userId);
            expect(cached).not.toBeNull();
            expect(cached!.correct_count).toBe(20);
            expect(cached!.incorrect_count).toBe(10);
            expect(cached!.points).toBe(200);
        });

        it('stores separate entries for different users', () => {
            setScoreCache('user-A', { correct_count: 10, incorrect_count: 5, points: 100 });
            setScoreCache('user-B', { correct_count: 20, incorrect_count: 10, points: 200 });

            const cacheA = getScoreCache('user-A');
            const cacheB = getScoreCache('user-B');

            expect(cacheA!.correct_count).toBe(10);
            expect(cacheB!.correct_count).toBe(20);
        });

        it('does not throw when localStorage is unavailable', () => {
            const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
                throw new Error('QuotaExceededError');
            });

            expect(() => {
                setScoreCache('user-x', { correct_count: 1, incorrect_count: 0, points: 10 });
            }).not.toThrow();

            setItemSpy.mockRestore();
        });
    });

    describe('getScoreCache', () => {
        it('returns null when no cache exists for the user', () => {
            const result = getScoreCache('nonexistent');
            expect(result).toBeNull();
        });

        it('returns cached score after setScoreCache', () => {
            const userId = 'user-789';
            setScoreCache(userId, { correct_count: 42, incorrect_count: 8, points: 500 });

            const cached = getScoreCache(userId);
            expect(cached).not.toBeNull();
            expect(cached!.correct_count).toBe(42);
            expect(cached!.incorrect_count).toBe(8);
            expect(cached!.points).toBe(500);
            expect(cached!.updatedAt).toBeTypeOf('number');
        });

        it('returns null for corrupt JSON data', () => {
            const userId = 'user-corrupt';
            localStorage.setItem(`score_cache_${userId}`, 'not-json{{{');

            const result = getScoreCache(userId);
            expect(result).toBeNull();
        });

        it('returns null when data is missing required fields', () => {
            const userId = 'user-incomplete';
            localStorage.setItem(
                `score_cache_${userId}`,
                JSON.stringify({ correct_count: 10 })
            );

            const result = getScoreCache(userId);
            expect(result).toBeNull();
        });

        it('returns null when data has wrong types', () => {
            const userId = 'user-wrong-types';
            localStorage.setItem(
                `score_cache_${userId}`,
                JSON.stringify({
                    correct_count: 'not-a-number',
                    incorrect_count: 5,
                    points: 100,
                    updatedAt: 123,
                })
            );

            const result = getScoreCache(userId);
            expect(result).toBeNull();
        });
    });

    describe('clearScoreCache', () => {
        it('removes cached score for a specific user', () => {
            const userId = 'user-to-clear';
            setScoreCache(userId, { correct_count: 10, incorrect_count: 5, points: 100 });

            clearScoreCache(userId);

            const result = getScoreCache(userId);
            expect(result).toBeNull();
        });

        it('does not affect other users\' cache', () => {
            setScoreCache('user-A', { correct_count: 10, incorrect_count: 5, points: 100 });
            setScoreCache('user-B', { correct_count: 20, incorrect_count: 10, points: 200 });

            clearScoreCache('user-A');

            expect(getScoreCache('user-A')).toBeNull();
            expect(getScoreCache('user-B')).not.toBeNull();
            expect(getScoreCache('user-B')!.correct_count).toBe(20);
        });

        it('does not throw when cache does not exist', () => {
            expect(() => {
                clearScoreCache('nonexistent-user');
            }).not.toThrow();
        });
    });
});
