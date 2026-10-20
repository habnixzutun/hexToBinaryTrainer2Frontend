/**
 * Auth API Service: Handles all authentication-related API calls.
 *
 * Endpoints:
 * - POST /api/auth/register - Register new user
 * - POST /api/auth/login - Login with email + password
 * - POST /api/auth/verify-email - Verify email with token
 * - POST /api/auth/refresh - Refresh access token (cookie-based)
 * - POST /api/auth/logout - Logout and revoke refresh token
 * - GET /api/user/me - Get current user info + stats
 */

import { getAccessToken, setAccessToken, clearAccessToken } from '../utils/tokenManager';

const BASE_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// ==================== Request/Response Types ====================

export interface RegisterRequest {
    email: string;
    username: string;
    password: string;
}

export interface RegisterResponse {
    message: string;
    user_id: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
}

export interface VerifyEmailRequest {
    token: string;
}

export interface VerifyEmailResponse {
    message: string;
}

export interface RefreshResponse {
    access_token: string;
    token_type: string;
}

export interface LogoutResponse {
    message: string;
}

export interface UserMeResponse {
    id: string;
    username: string;
    email: string;
    correct_count: number;
    incorrect_count: number;
    points: number;
}

// ==================== API Functions ====================

/**
 * Register a new user.
 *
 * @param data - Registration data (email, username, password)
 * @returns User ID and success message
 * @throws Error if registration fails (email/username taken, weak password, etc.)
 */
export async function register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Registration failed' }));
        throw new Error(error.detail?.message || error.detail || 'Registration failed');
    }

    return await response.json();
}

/**
 * Login with email and password.
 *
 * Sets access token in memory and refresh token as httponly cookie (handled by backend).
 *
 * @param data - Login credentials (email, password)
 * @returns Access token
 * @throws Error if login fails (invalid credentials, unverified account, etc.)
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include refresh token cookie
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Login failed' }));
        throw new Error(error.detail || 'Login failed');
    }

    const result: LoginResponse = await response.json();

    // Store access token in memory
    setAccessToken(result.access_token);

    return result;
}

/**
 * Verify email with token from verification email.
 *
 * @param token - Verification token from email link
 * @returns Success message
 * @throws Error if verification fails (expired/invalid token)
 */
export async function verifyEmail(token: string): Promise<VerifyEmailResponse> {
    const response = await fetch(`${BASE_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Email verification failed' }));
        throw new Error(error.detail || 'Email verification failed');
    }

    return await response.json();
}

/**
 * Refresh access token using refresh token cookie.
 *
 * Called automatically by HTTP interceptor when access token expires.
 *
 * @returns New access token
 * @throws Error if refresh fails (invalid/revoked refresh token)
 */
export async function refreshAccessToken(): Promise<RefreshResponse> {
    const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Send refresh token cookie
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Token refresh failed' }));
        throw new Error(error.detail || 'Token refresh failed');
    }

    const result: RefreshResponse = await response.json();

    // Update access token in memory
    setAccessToken(result.access_token);

    return result;
}

/**
 * Logout and revoke refresh token.
 *
 * Clears access token from memory and backend deletes refresh token cookie.
 *
 * @returns Success message
 */
export async function logout(): Promise<LogoutResponse> {
    const response = await fetch(`${BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Send refresh token cookie
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Logout failed' }));
        throw new Error(error.detail || 'Logout failed');
    }

    // Clear access token from memory
    clearAccessToken();

    return await response.json();
}

function fetchCurrentUser(token: string): Promise<Response> {
    return fetch(`${BASE_URL}/api/user/me`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
    });
}

/**
 * Get current authenticated user info with statistics.
 *
 * On 401 (e.g. expired access token) refreshes the token once and retries.
 *
 * @returns User info + game stats
 * @throws Error if not authenticated or user not found
 */
export async function getCurrentUser(): Promise<UserMeResponse> {
    const token = getAccessToken();

    if (!token) {
        throw new Error('No access token available');
    }

    let response = await fetchCurrentUser(token);

    if (response.status === 401) {
        const refreshResult = await refreshAccessToken();
        response = await fetchCurrentUser(refreshResult.access_token);
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Failed to fetch user data' }));
        throw new Error(error.detail || 'Failed to fetch user data');
    }

    return await response.json();
}
