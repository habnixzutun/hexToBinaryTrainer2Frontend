import type { useAuth } from '../../src/contexts/AuthContext.tsx'
import type { UserMeResponse } from '../../src/services/authApi.ts'

type AuthValue = ReturnType<typeof useAuth>

// Shape returned by GET /api/user/me (Sprint 4 economy fields, US-37 contract).
export const testUser: UserMeResponse = {
  id: 'user-1',
  username: 'TestUser',
  email: 'test@example.com',
  correct_count: 5,
  incorrect_count: 2,
  total_xp: 50,
  level: 1,
  current_streak: 0,
  best_streak: 3,
}

/**
 * Build a complete AuthContext value for components that call useAuth().
 *
 * Usage in a test file:
 *   const mockUseAuth = vi.hoisted(() => vi.fn())
 *   vi.mock('../../src/contexts/AuthContext.tsx', () => ({ useAuth: mockUseAuth }))
 *   beforeEach(() => mockUseAuth.mockReturnValue(authValue()))
 */
export function authValue(overrides: Partial<AuthValue> = {}): AuthValue {
  return {
    user: testUser,
    lastAnswer: null,
    pendingUnlocks: [],
    loading: false,
    error: null,
    login: vi.fn().mockResolvedValue(undefined),
    register: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    refreshUser: vi.fn().mockResolvedValue(undefined),
    applyGameResult: vi.fn(),
    dismissLevelUp: vi.fn(),
    clearError: vi.fn(),
    ...overrides,
  }
}
