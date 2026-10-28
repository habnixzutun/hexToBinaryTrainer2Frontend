/**
 * API Service: HTTP client with automatic authentication.
 *
 * Features:
 * - Automatic Bearer token injection for protected endpoints
 * - Automatic token refresh on 401 responses
 * - Request retry after successful refresh
 * - Credentials: 'include' for httponly refresh token cookies
 * - Structured ApiError on non-2xx (status, detail, Retry-After, locked level)
 *
 * Sprint 4 (US-38): the answer submit path is unified. The client sends ONLY
 * what it knows — mode, bit_width, is_correct — and the server computes every
 * economy figure. Client-computed points/streak/level never leave the browser.
 */

import { getAccessToken, clearAccessToken } from '../utils/tokenManager.ts';
import { refreshAccessToken } from './authApi.ts';
import { buildApiError } from './apiError.ts';
import type { GameMode } from '../constants/gameModes.ts';

const BASE_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// ==================== Types ====================

/** Frozen Sprint 4 leaderboard shape (OQ-9): XP economy, no legacy `points`. */
export interface LeaderboardEntry {
    user_id: string;
    username: string;
    total_xp: number;
    level: number;
    correct_count: number;
    incorrect_count: number;
}

export interface LeaderboardResponse {
    entries: LeaderboardEntry[];
}

/** One entry of `newly_unlocked`: a tier this level opened. */
export interface UnlockEntry {
    mode: GameMode;
    bit_width: number;
    min_level: number;
}

/**
 * Normative 200 response of POST /api/game/answer (US-33 golden fixture).
 *
 * `xp_delta` is 0 on a floor-blocked penalty (OQ-4) — that is a real event
 * (the streak still resets), so callers must not read 0 as "nothing happened".
 */
export interface GameAnswerResponse {
    xp_delta: number;
    total_xp: number;
    level: number;
    xp_in_level: number;
    xp_required_for_next_level: number;
    current_streak: number;
    best_streak: number;
    correct_count: number;
    incorrect_count: number;
    readonly newly_unlocked: readonly UnlockEntry[];
}

// ==================== HTTP Client ====================

/**
 * Authenticated fetch wrapper.
 *
 * Automatically adds Bearer token and handles 401 refresh.
 *
 * @param url - API endpoint URL
 * @param options - Fetch options
 * @returns Response object
 */
async function authenticatedFetch(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const token = getAccessToken();

    // Add Authorization header if token exists
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };

    const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Include refresh token cookie
    });

    // Handle 401 Unauthorized - attempt token refresh
    if (response.status === 401) {
        try {
            const refreshResult = await refreshAccessToken();

            // Retry original request with new token
            const retryHeaders: HeadersInit = {
                ...headers,
                'Authorization': `Bearer ${refreshResult.access_token}`,
            };

            return await fetch(url, {
                ...options,
                headers: retryHeaders,
                credentials: 'include',
            });
        } catch {
            // Refresh failed - clear token and redirect to login
            clearAccessToken();
            throw new Error('Session expired. Please login again.');
        }
    }

    return response;
}

// ==================== Game API ====================

export const gameApi = {
    /**
     * Submit an answer and return the server-computed economy state.
     *
     * The ONLY submit path since US-38: mode + bit width + correctness travel
     * to the server, everything else (XP, streak, level, unlocks) travels back.
     *
     * @param mode - Backend mode, not the UI direction
     * @param bitWidth - Question width in BITS in every mode (OQ-7)
     * @param isCorrect - Whether the player's answer matched
     * @throws ApiError with status 401/403/404/422/429 and the parsed detail
     */
    async submitAnswer(mode: GameMode, bitWidth: number, isCorrect: boolean): Promise<GameAnswerResponse> {
        const response = await authenticatedFetch(`${BASE_URL}/api/game/answer`, {
            method: 'POST',
            body: JSON.stringify({ mode, bit_width: bitWidth, is_correct: isCorrect }),
        });

        if (!response.ok) {
            throw await buildApiError(response, 'Failed to submit answer');
        }

        // Contract is frozen in the sprint plan; the HUD clamps every derived
        // figure and scoreCache validates strictly, so a cast is the accepted
        // boundary here (deep schema validation is tracked for US-39).
        return (await response.json()) as GameAnswerResponse;
    },

    /**
     * Get the leaderboard (top 50 by total XP).
     *
     * Public endpoint (OQ-9): no Authorization header, no refresh cookie —
     * sending credentials here would leak the session to a public read.
     */
    async getLeaderboard(): Promise<LeaderboardEntry[]> {
        const response = await fetch(`${BASE_URL}/api/game/leaderboard`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch leaderboard');
        }

        const data = (await response.json()) as LeaderboardResponse;
        return data.entries;
    },
};
