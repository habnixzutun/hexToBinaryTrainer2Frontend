/**
 * Auth Context: Global authentication state management.
 *
 * Provides:
 * - User state (authenticated user info + stats)
 * - Guest mode (try the app without an account, nothing is persisted)
 * - Auth methods (login, register, logout, refreshUser)
 * - Loading and error states
 * - Automatic user restoration on app startup
 */

import { createContext, useContext, useState, useEffect, type ReactNode, type ReactElement } from 'react';
import {
    login as apiLogin,
    register as apiRegister,
    logout as apiLogout,
    getCurrentUser,
    refreshAccessToken,
    type UserMeResponse,
    type LoginRequest,
    type RegisterRequest
} from '../services/authApi';
import { getAccessToken, clearAccessToken } from '../utils/tokenManager';
import { setScoreCache, clearScoreCache, type CachedScore } from '../utils/scoreCache';
import type { GameSubmitResponse } from '../services/api';
import { setPersistenceEnabled } from '../utils/persistence.ts';

// ==================== Types ====================

/**
 * Answer counters for a guest. Kept in memory only — gone after a reload.
 *
 * No points: the scoring rule lives in the backend and is not duplicated here.
 */
export interface GuestStats {
    correct_count: number;
    incorrect_count: number;
}

/**
 * Who is using the app right now.
 *
 * A union instead of `user` + `isGuest` flags: the impossible combination
 * "guest and logged in at the same time" cannot be represented.
 */
type Session =
    | { kind: 'anonymous' }
    | { kind: 'guest'; stats: GuestStats }
    | { kind: 'user'; user: UserMeResponse };

const ANONYMOUS: Session = { kind: 'anonymous' };

/**
 * View the WelcomeScreen should open with. Set when a guest clicks
 * "Create account", read once by the WelcomeScreen, then reset to 'login'.
 */
export type WelcomeView = 'login' | 'register';

interface AuthContextType {
    user: UserMeResponse | null;
    isGuest: boolean;
    guestStats: GuestStats | null;
    loading: boolean;
    error: string | null;
    login: (data: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    applyGameResult: (result: GameSubmitResponse) => void;
    startGuest: () => void;
    leaveGuest: (nextView?: WelcomeView) => void;
    recordGuestAnswer: (isCorrect: boolean) => void;
    welcomeView: WelcomeView;
    clearWelcomeView: () => void;
    clearError: () => void;
}

// ==================== Context ====================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ==================== Provider ====================

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): ReactElement {
    const [session, setSession] = useState<Session>(ANONYMOUS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [welcomeView, setWelcomeView] = useState<WelcomeView>('login');

    const user = session.kind === 'user' ? session.user : null;
    const isGuest = session.kind === 'guest';
    const guestStats = session.kind === 'guest' ? session.stats : null;

    const setUser = (userData: UserMeResponse | null): void => {
        setSession(userData ? { kind: 'user', user: userData } : ANONYMOUS);
    };

    /**
     * Sync user stats to localStorage cache.
     *
     * Backend remains single source of truth — cache is for fast UI rendering.
     */
    const syncScoreCache = (userData: UserMeResponse): void => {
        setScoreCache(userData.id, {
            correct_count: userData.correct_count,
            incorrect_count: userData.incorrect_count,
            points: userData.points,
        });
    };

    /**
     * Restore user session on app startup.
     *
     * The access token lives only in memory and is lost on reload, but the
     * httponly refresh cookie survives - exchange it for a new access token,
     * then fetch user data.
     * If there is no valid refresh cookie, user remains null (unauthenticated).
     */
    useEffect(() => {
        const restoreSession = async (): Promise<void> => {
            try {
                if (!getAccessToken()) {
                    await refreshAccessToken();
                }
                const userData = await getCurrentUser();
                setUser(userData);
                syncScoreCache(userData);
            } catch {
                // No valid session - not an error, just show the login screen
                clearAccessToken();
            } finally {
                setLoading(false);
            }
        };

        void restoreSession();
    }, []);

    /**
     * Login with email and password.
     *
     * On success, fetches user data, sets authenticated state, and syncs score cache.
     */
    const login = async (data: LoginRequest): Promise<void> => {
        setError(null);
        setLoading(true);

        try {
            await apiLogin(data);
            const userData = await getCurrentUser();
            setUser(userData);
            syncScoreCache(userData);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Login failed';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Register a new user.
     *
     * Does NOT automatically login - user must verify email first.
     */
    const register = async (data: RegisterRequest): Promise<void> => {
        setError(null);
        // NOTE: Do NOT toggle the global `loading` state here. AuthGate renders a
        // spinner instead of WelcomeScreen while loading, which would unmount the
        // form and reset its local view state — the verify-email screen would
        // never be shown. RegisterForm tracks submission via isSubmitting.

        try {
            await apiRegister(data);
            // Registration successful, but user needs to verify email
            // Don't set user yet - they're not authenticated
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Registration failed';
            setError(message);
            throw err;
        }
    };

    /**
     * Logout and clear authentication state.
     *
     * Clears user state and removes score cache for this user.
     * For a guest it simply ends guest mode — there is no server session.
     */
    const logout = async (): Promise<void> => {
        setError(null);

        if (session.kind === 'guest') {
            leaveGuest('login');
            return;
        }

        try {
            const userId = user?.id;
            await apiLogout();
            setUser(null);
            if (userId) {
                clearScoreCache(userId);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Logout failed';
            setError(message);
        }
    };

    /**
     * Refresh user data from backend.
     *
     * Called after game actions to update stats. Syncs score cache on success.
     */
    const refreshUser = async (): Promise<void> => {
        // A guest has no account on the server — nothing to refresh
        if (session.kind !== 'user') return;

        try {
            const userData = await getCurrentUser();
            setUser(userData);
            syncScoreCache(userData);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to refresh user data';
            setError(message);
        }
    };

    /**
     * Apply game result from submitCorrect/submitIncorrect.
     *
     * Updates user state and syncs score cache without an extra API call.
     * Backend remains single source of truth — this is an optimistic update
     * based on the API response.
     */
    const applyGameResult = (result: GameSubmitResponse): void => {
        setSession(prev => {
            if (prev.kind !== 'user') return prev;
            const updated: UserMeResponse = {
                ...prev.user,
                correct_count: result.correct_count,
                incorrect_count: result.incorrect_count,
                points: result.points,
            };
            syncScoreCache(updated);
            return { kind: 'user', user: updated };
        });
    };

    /**
     * Start guest mode: use the app without an account.
     *
     * Turns off all localStorage writes so the guest session leaves nothing
     * behind. Results are never sent to the backend.
     */
    const startGuest = (): void => {
        setError(null);
        setPersistenceEnabled(false);
        setSession({ kind: 'guest', stats: { correct_count: 0, incorrect_count: 0 } });
    };

    /**
     * End guest mode and return to the WelcomeScreen.
     *
     * @param nextView - view the WelcomeScreen opens with ('register' for
     *                   "Create account", 'login' otherwise)
     */
    const leaveGuest = (nextView: WelcomeView = 'login'): void => {
        setPersistenceEnabled(true);
        setWelcomeView(nextView);
        setSession(ANONYMOUS);
    };

    /**
     * Reset the WelcomeScreen start view after it has been read once.
     */
    const clearWelcomeView = (): void => {
        setWelcomeView('login');
    };

    /**
     * Count a guest answer in memory only.
     */
    const recordGuestAnswer = (isCorrect: boolean): void => {
        setSession(prev => {
            if (prev.kind !== 'guest') return prev;
            return {
                kind: 'guest',
                stats: {
                    correct_count: prev.stats.correct_count + (isCorrect ? 1 : 0),
                    incorrect_count: prev.stats.incorrect_count + (isCorrect ? 0 : 1),
                },
            };
        });
    };

    /**
     * Clear error message.
     */
    const clearError = (): void => {
        setError(null);
    };

    const value: AuthContextType = {
        user,
        isGuest,
        guestStats,
        loading,
        error,
        login,
        register,
        logout,
        refreshUser,
        applyGameResult,
        startGuest,
        leaveGuest,
        recordGuestAnswer,
        welcomeView,
        clearWelcomeView,
        clearError,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// ==================== Hook ====================

/**
 * Hook to access authentication context.
 *
 * @returns Auth context with user state and methods
 * @throws Error if used outside AuthProvider
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}
