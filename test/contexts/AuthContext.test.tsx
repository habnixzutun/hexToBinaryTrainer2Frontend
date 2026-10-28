import { renderHook, waitFor, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from '../../src/contexts/AuthContext.tsx'
import * as authApi from '../../src/services/authApi.ts'
import { clearAccessToken, getAccessToken, setAccessToken } from '../../src/utils/tokenManager.ts'
import { SCORE_CACHE_VERSION, getScoreCache } from '../../src/utils/scoreCache.ts'
import type { GameAnswerResponse, UnlockEntry } from '../../src/services/api.ts'
import type { UserMeResponse } from '../../src/services/authApi.ts'

vi.mock('../../src/services/authApi.ts', () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
  refreshAccessToken: vi.fn(),
}))

const mockedApi = vi.mocked(authApi)

const user: UserMeResponse = {
  id: 'user-1',
  username: 'alice',
  email: 'alice@example.com',
  correct_count: 41,
  incorrect_count: 5,
  total_xp: 1280,
  level: 5,
  current_streak: 2,
  best_streak: 7,
}

/**
 * US-33 golden fixture (normative). Written out in full on purpose: the shape
 * below is compile-checked against GameAnswerResponse, so adding a field to the
 * contract without extending this fixture fails the build (AC-4).
 */
const answerFixture = {
  xp_delta: 40,
  total_xp: 1320,
  level: 6,
  xp_in_level: 0,
  xp_required_for_next_level: 760,
  current_streak: 3,
  best_streak: 7,
  correct_count: 42,
  incorrect_count: 5,
  newly_unlocked: [],
} satisfies GameAnswerResponse

type UncoveredAnswerField = Exclude<keyof GameAnswerResponse, keyof typeof answerFixture>
const answerFieldsAreExhaustive: UncoveredAnswerField extends never ? true : false = true

/** The subset of the answer contract that /api/user/me also carries. */
const USER_ECONOMY_FIELDS = [
  'total_xp',
  'level',
  'current_streak',
  'best_streak',
  'correct_count',
  'incorrect_count',
] as const satisfies readonly (keyof UserMeResponse)[]

const unlockFixture: UnlockEntry[] = [
  { mode: 'hex_to_bin', bit_width: 16, min_level: 8 },
  { mode: 'unicode', bit_width: 16, min_level: 2 },
]

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>

/**
 * Mount a provider that already holds an access token, so the startup restore
 * goes straight to GET /api/user/me. (A rejected refresh must NOT fall through
 * to /user/me — that is pinned by 'stays logged out without error…' below.)
 */
async function mountLoggedIn() {
  setAccessToken('access-1')
  mockedApi.getCurrentUser.mockResolvedValue(user)
  const rendered = renderHook(() => useAuth(), { wrapper })
  await waitFor(() => expect(rendered.result.current.loading).toBe(false))
  await waitFor(() => expect(rendered.result.current.user).toEqual(user))
  return rendered
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearAccessToken()
    localStorage.clear()
  })

  describe('session restore on startup', () => {
    it('restores the user via the refresh cookie after a reload', async () => {
      mockedApi.refreshAccessToken.mockImplementation(async () => {
        setAccessToken('access-1')
        return { access_token: 'access-1', token_type: 'bearer' }
      })
      mockedApi.getCurrentUser.mockResolvedValue(user)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.user).toEqual(user)
      expect(result.current.error).toBeNull()
    })

    it('syncs the full economy shape into the score cache', async () => {
      // A live access token is what a restored session looks like.
      setAccessToken('access-1')
      mockedApi.getCurrentUser.mockResolvedValue(user)

      renderHook(() => useAuth(), { wrapper })

      await waitFor(() => expect(getScoreCache('user-1')).not.toBeNull())
      expect(getScoreCache('user-1')).toMatchObject({
        version: SCORE_CACHE_VERSION,
        correct_count: 41,
        incorrect_count: 5,
        total_xp: 1280,
        level: 5,
        current_streak: 2,
        best_streak: 7,
      })
    })

    it('stays logged out without error when there is no valid refresh cookie', async () => {
      mockedApi.refreshAccessToken.mockRejectedValue(new Error('Missing refresh token.'))

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.user).toBeNull()
      expect(result.current.error).toBeNull()
      expect(mockedApi.getCurrentUser).not.toHaveBeenCalled()
      expect(getAccessToken()).toBeNull()
    })
  })

  describe('login', () => {
    beforeEach(() => {
      mockedApi.refreshAccessToken.mockRejectedValue(new Error('Missing refresh token.'))
    })

    it('logs in and loads the current user', async () => {
      mockedApi.login.mockResolvedValue({ access_token: 'access-1', token_type: 'bearer' })
      mockedApi.getCurrentUser.mockResolvedValue(user)
      const { result } = renderHook(() => useAuth(), { wrapper })
      await waitFor(() => expect(result.current.loading).toBe(false))

      await act(() => result.current.login({ email: 'alice@example.com', password: 'pw' }))

      expect(mockedApi.login).toHaveBeenCalledWith({ email: 'alice@example.com', password: 'pw' })
      expect(result.current.user).toEqual(user)
      expect(result.current.error).toBeNull()
    })

    it('sets the error and rethrows when loading the user fails', async () => {
      mockedApi.login.mockResolvedValue({ access_token: 'access-1', token_type: 'bearer' })
      mockedApi.getCurrentUser.mockRejectedValue(new Error('Not Found'))
      const { result } = renderHook(() => useAuth(), { wrapper })
      await waitFor(() => expect(result.current.loading).toBe(false))

      await act(async () => {
        await expect(
          result.current.login({ email: 'alice@example.com', password: 'pw' })
        ).rejects.toThrow('Not Found')
      })

      expect(result.current.user).toBeNull()
      expect(result.current.error).toBe('Not Found')
    })
  })

  describe('applyGameResult (server response wins)', () => {
    it('fails when the fixture stops covering the whole /answer contract', () => {
      // Compile-time guard promoted to a runtime assertion.
      expect(answerFieldsAreExhaustive).toBe(true)
      expect(Object.keys(answerFixture)).toHaveLength(10)
    })

    it('passes through EVERY economy field of the response — nothing is dropped', async () => {
      const { result } = await mountLoggedIn()

      act(() => result.current.applyGameResult(answerFixture))

      // Every single response field survives somewhere: the HUD reads the raw
      // answer, the sidebar reads the merged user, the cache mirrors the user.
      expect(result.current.lastAnswer).toEqual(answerFixture)
      for (const key of Object.keys(answerFixture) as (keyof GameAnswerResponse)[]) {
        const rendered: unknown = result.current.lastAnswer?.[key]
        const expected: unknown = answerFixture[key]
        expect(rendered).toEqual(expected)
      }

      const cached = getScoreCache('user-1')
      expect(cached).not.toBeNull()
      expect(cached?.version).toBe(SCORE_CACHE_VERSION)
      for (const key of USER_ECONOMY_FIELDS) {
        const inUser: unknown = result.current.user?.[key]
        const inCache: unknown = cached?.[key]
        expect(inUser).toBe(answerFixture[key])
        expect(inCache).toBe(answerFixture[key])
      }
    })

    it('lets the server win over the optimistic-local state', async () => {
      const { result } = await mountLoggedIn()

      // Server says the streak broke (xp_delta negative, streak 0) even though the
      // client just believed it had answered correctly.
      act(() =>
        result.current.applyGameResult({
          ...answerFixture,
          xp_delta: -64,
          total_xp: 1256,
          level: 5,
          xp_in_level: 416,
          xp_required_for_next_level: 508,
          current_streak: 0,
          best_streak: 7,
          correct_count: 41,
          incorrect_count: 6,
        })
      )

      expect(result.current.user?.current_streak).toBe(0)
      expect(result.current.user?.total_xp).toBe(1256)
      expect(result.current.user?.incorrect_count).toBe(6)
      expect(result.current.pendingUnlocks).toEqual([])
    })

    it('handles the floor-clamped xp_delta === 0 case without inventing state', async () => {
      const { result } = await mountLoggedIn()

      // LV-09b: penalty blocked at cum(level) -> xp_delta 0, streak still resets.
      act(() =>
        result.current.applyGameResult({
          ...answerFixture,
          xp_delta: 0,
          total_xp: 1280,
          level: 5,
          xp_in_level: 0,
          current_streak: 0,
          correct_count: 41,
          incorrect_count: 6,
        })
      )

      expect(result.current.lastAnswer?.xp_delta).toBe(0)
      expect(result.current.user?.total_xp).toBe(1280)
      expect(result.current.user?.current_streak).toBe(0)
    })

    it('records newly_unlocked and clears only the toast on dismiss', async () => {
      const { result } = await mountLoggedIn()

      act(() => result.current.applyGameResult({ ...answerFixture, newly_unlocked: unlockFixture }))

      expect(result.current.pendingUnlocks).toEqual(unlockFixture)

      act(() => result.current.dismissLevelUp())

      expect(result.current.pendingUnlocks).toEqual([])
      // Dismissing the toast must not lose the progress numbers the HUD renders.
      expect(result.current.lastAnswer?.xp_in_level).toBe(0)
      expect(result.current.lastAnswer?.xp_required_for_next_level).toBe(760)
      expect(result.current.user?.level).toBe(6)
    })

    it('does not crash when no user is loaded, but still records the answer', async () => {
      mockedApi.refreshAccessToken.mockRejectedValue(new Error('Missing refresh token.'))

      const { result } = renderHook(() => useAuth(), { wrapper })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.user).toBeNull()

      act(() => result.current.applyGameResult(answerFixture))

      expect(result.current.user).toBeNull()
      expect(result.current.lastAnswer).toEqual(answerFixture)
      expect(getScoreCache('user-1')).toBeNull()
    })
  })

  describe('refreshUser', () => {
    it('pulls the economy state and re-syncs the cache', async () => {
      const { result } = await mountLoggedIn()

      const refreshed: UserMeResponse = { ...user, total_xp: 2080, level: 7, current_streak: 11, best_streak: 11 }
      mockedApi.getCurrentUser.mockResolvedValue(refreshed)

      await act(() => result.current.refreshUser())

      expect(result.current.user).toEqual(refreshed)
      expect(getScoreCache('user-1')).toMatchObject({ total_xp: 2080, level: 7, best_streak: 11 })
    })
  })

  describe('logout', () => {
    it('clears the user and the score cache', async () => {
      mockedApi.logout.mockResolvedValue({ message: 'Logged out.' })
      const { result } = await mountLoggedIn()
      expect(getScoreCache('user-1')).not.toBeNull()

      await act(() => result.current.logout())

      expect(result.current.user).toBeNull()
      expect(getScoreCache('user-1')).toBeNull()
    })
  })
})
