/**
 * API Service: HTTP client with automatic authentication.
 *
 * Features:
 * - Automatic Bearer token injection for protected endpoints
 * - Automatic token refresh on 401 responses
 * - Request retry after successful refresh
 * - Credentials: 'include' for httponly refresh token cookies
 */

import { getAccessToken, clearAccessToken } from '../utils/tokenManager';
import { refreshAccessToken } from './authApi';

const BASE_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// ==================== Types ====================

export interface LeaderboardEntry {
    user_id: string;
    username: string;
    correct_count: number;
    incorrect_count: number;
    points: number;
}

export interface LeaderboardResponse {
    entries: LeaderboardEntry[];
}

export interface GameSubmitResponse {
    message: string;
    user_id: string;
    correct_count: number;
    incorrect_count: number;
    points: number;
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
     * Submit a correct answer.
     *
     * @param bits - Number of bits in the question
     * @returns Updated user stats
     */
    async submitCorrect(bits: number): Promise<GameSubmitResponse> {
        const response = await authenticatedFetch(`${BASE_URL}/api/game/correct`, {
            method: 'POST',
            body: JSON.stringify({ bits }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to submit correct answer' }));
            throw new Error(error.detail || 'Failed to submit correct answer');
        }

        return await response.json();
    },

    /**
     * Submit an incorrect answer.
     *
     * @param bits - Number of bits in the question
     * @returns Updated user stats
     */
    async submitIncorrect(bits: number): Promise<GameSubmitResponse> {
        const response = await authenticatedFetch(`${BASE_URL}/api/game/incorrect`, {
            method: 'POST',
            body: JSON.stringify({ bits }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to submit incorrect answer' }));
            throw new Error(error.detail || 'Failed to submit incorrect answer');
        }

        return await response.json();
    },

    /**
     * Get leaderboard (top 50 users by points).
     *
     * @returns Leaderboard entries
     */
    async getLeaderboard(): Promise<LeaderboardEntry[]> {
        const response = await fetch(`${BASE_URL}/api/game/leaderboard`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch leaderboard');
        }

        const data: LeaderboardResponse = await response.json();
        return data.entries;
    },
};
