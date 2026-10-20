/**
 * Auth Context: Global authentication state management.
 *
 * Provides:
 * - User state (authenticated user info + stats)
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

// ==================== Types ====================

interface AuthContextType {
    user: UserMeResponse | null;
    loading: boolean;
    error: string | null;
    login: (data: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    clearError: () => void;
}

// ==================== Context ====================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ==================== Provider ====================

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): ReactElement {
    const [user, setUser] = useState<UserMeResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
     * On success, fetches user data and sets authenticated state.
     */
    const login = async (data: LoginRequest): Promise<void> => {
        setError(null);
        setLoading(true);

        try {
            await apiLogin(data);
            const userData = await getCurrentUser();
            setUser(userData);
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
     */
    const logout = async (): Promise<void> => {
        setError(null);

        try {
            await apiLogout();
            setUser(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Logout failed';
            setError(message);
        }
    };

    /**
     * Refresh user data from backend.
     *
     * Called after game actions to update stats.
     */
    const refreshUser = async (): Promise<void> => {
        try {
            const userData = await getCurrentUser();
            setUser(userData);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to refresh user data';
            setError(message);
        }
    };

    /**
     * Clear error message.
     */
    const clearError = (): void => {
        setError(null);
    };

    const value: AuthContextType = {
        user,
        loading,
        error,
        login,
        register,
        logout,
        refreshUser,
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
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}
