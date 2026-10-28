/**
 * Auth Context: Global authentication state management.
 *
 * Provides:
 * - User state (authenticated user info + XP economy)
 * - The raw last /answer response (HUD progress, level-up toast)
 * - Auth methods (login, register, logout, refreshUser)
 * - Loading and error states
 * - Automatic user restoration on app startup
 *
 * Server wins: the /answer payload is the only writer of the economy fields.
 * Nothing here recomputes XP, streaks or levels locally — an optimistic chain
 * that diverges from the backend is exactly what US-38 removes.
 */

import { createContext, useCallback, useContext, useState, useEffect, type ReactNode, type ReactElement } from 'react';
import {
    login as apiLogin,
    register as apiRegister,
    logout as apiLogout,
    getCurrentUser,
    refreshAccessToken,
    type UserMeResponse,
    type LoginRequest,
    type RegisterRequest
} from '../services/authApi.ts';
import { getAccessToken, clearAccessToken } from '../utils/tokenManager.ts';
import { setScoreCache, clearScoreCache } from '../utils/scoreCache.ts';
import type { GameAnswerResponse, UnlockEntry } from '../services/api.ts';

// ==================== Types ====================

interface AuthContextType {
    user: UserMeResponse | null;
    /** Raw payload of the last POST /api/game/answer — the HUD renders from it. */
    lastAnswer: GameAnswerResponse | null;
    /** `newly_unlocked` of that answer; cleared by dismissLevelUp(). */
    pendingUnlocks: readonly UnlockEntry[];
    loading: boolean;
    error: string | null;
    login: (data: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    applyGameResult: (answer: GameAnswerResponse) => void;
    dismissLevelUp: () => void;
    clearError: () => void;
}

// ==================== Context ====================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * The economy fields /api/user/me and /api/game/answer have in common.
 * Listed explicitly so a dropped field fails the compile, not the player.
 */
function economyOf(answer: GameAnswerResponse): Pick<
    UserMeResponse,
    'total_xp' | 'level' | 'current_streak' | 'best_streak' | 'correct_count' | 'incorrect_count'
> {
    return {
        total_xp: answer.total_xp,
        level: answer.level,
        current_streak: answer.current_streak,
        best_streak: answer.best_streak,
        correct_count: answer.correct_count,
        incorrect_count: answer.incorrect_count,
    };
}

// ==================== Provider ====================

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): ReactElement {
    const [user, setUser] = useState<UserMeResponse | null>(null);
    const [lastAnswer, setLastAnswer] = useState<GameAnswerResponse | null>(null);
    const [pendingUnlocks, setPendingUnlocks] = useState<readonly UnlockEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Sync user stats to localStorage cache.
     *
     * Backend remains single source of truth — cache is for fast UI rendering.
     */
    const syncScoreCache = (userData: UserMeResponse): void => {
        setScoreCache(userData.id, {
            correct_count: userData.correct_count,
            incorrect_count: userData.incorrect_count,
            total_xp: userData.total_xp,
            level: userData.level,
            current_streak: userData.current_streak,
            best_streak: userData.best_streak,
        });
    };

    /**
     * Drop every per-account figure — used on logout and when a session cannot
     * be restored, so the next player never sees the previous one's HUD.
     */
    const clearSessionState = (): void => {
        setUser(null);
        setLastAnswer(null);
        setPendingUnlocks([]);
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
                clearSessionState();
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
     */
    const logout = async (): Promise<void> => {
        setError(null);

        try {
            const userId = user?.id;
            await apiLogout();
            clearSessionState();
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
     * Fallback path for players who skipped a submit (network blip, tab was
     * backgrounded). A /answer response makes this round-trip unnecessary.
     */
    const refreshUser = async (): Promise<void> => {
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
     * Apply a /answer response: server numbers win over whatever the client
     * assumed, the raw payload is kept for the HUD and the unlock toast.
     */
    const applyGameResult = (answer: GameAnswerResponse): void => {
        setLastAnswer(answer);
        setPendingUnlocks([...answer.newly_unlocked]);

        if (user === null) return;

        const updated: UserMeResponse = { ...user, ...economyOf(answer) };
        setUser(updated);
        syncScoreCache(updated);
    };

    /**
     * Close the level-up toast. The progress numbers stay — the toast is not
     * the owner of the answer.
     */
    const dismissLevelUp = (): void => {
        setPendingUnlocks([]);
    };

    /**
     * Clear error message.
     */
    const clearError = useCallback((): void => {
        setError(null);
    }, []);

    const value: AuthContextType = {
        user,
        lastAnswer,
        pendingUnlocks,
        loading,
        error,
        login,
        register,
        logout,
        refreshUser,
        applyGameResult,
        dismissLevelUp,
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
