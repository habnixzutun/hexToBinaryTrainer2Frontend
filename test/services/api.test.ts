import { gameApi, type GameAnswerResponse, type LeaderboardEntry } from '../../src/services/api.ts'
import { ApiError } from '../../src/services/apiError.ts'
import { clearAccessToken, getAccessToken, setAccessToken } from '../../src/utils/tokenManager.ts'

const mockFetch = vi.fn()

// A real Headers bag is case-insensitive; this double has to be too, otherwise
// a caller writing 'Retry-After' (the RFC spelling) reads back null.
const jsonResponse = (status: number, body: unknown, headers: Record<string, string> = {}) => {
  const normalized = Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value])
  )
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => normalized[name.toLowerCase()] ?? null },
    json: async () => body,
  }
}

/**
 * Normative golden fixture from the sprint plan (US-33). Every value is derived
 * there: xp_delta 40 = HB-8 @ streak 3 (32 x 1.25); total_xp 1320 = cum(6) so the
 * player landed exactly on the L6 threshold -> xp_in_level 0 of req(6) = 760.
 * A level-up with no unlock is a NORMAL case, not an edge case.
 */
const goldenAnswer: GameAnswerResponse = {
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
}

const entries: LeaderboardEntry[] = [
  { user_id: 'u-1', username: 'Alice', total_xp: 1320, level: 6, correct_count: 42, incorrect_count: 5 },
]

describe('gameApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()
    clearAccessToken()
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  describe('unified submit path only', () => {
    // Pairs with backend US-34 AC-2 (grep proof on submitCorrect/submitIncorrect).
    it('exposes submitAnswer and nothing else for submissions', () => {
      expect(typeof gameApi.submitAnswer).toBe('function')
      expect(gameApi).not.toHaveProperty('submitCorrect')
      expect(gameApi).not.toHaveProperty('submitIncorrect')
    })
  })

  describe('submitAnswer', () => {
    it('posts mode, bit_width and is_correct to /api/game/answer', async () => {
      setAccessToken('access-1')
      mockFetch.mockResolvedValueOnce(jsonResponse(200, goldenAnswer))

      await expect(gameApi.submitAnswer('hex_to_bin', 8, true)).resolves.toEqual(goldenAnswer)
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/game/answer', {
        method: 'POST',
        body: JSON.stringify({ mode: 'hex_to_bin', bit_width: 8, is_correct: true }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer access-1',
        },
        credentials: 'include',
      })
    })

    it('sends exactly the three contract fields — never client-computed XP', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(200, goldenAnswer))

      await gameApi.submitAnswer('unicode', 24, false)

      const body = JSON.parse(String(mockFetch.mock.calls[0]?.[1]?.body)) as Record<string, unknown>
      expect(Object.keys(body).sort()).toEqual(['bit_width', 'is_correct', 'mode'])
      expect(body.bit_width).toBe(24)
      expect(body.is_correct).toBe(false)
    })

    it('omits the Authorization header without access token', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(200, goldenAnswer))

      await gameApi.submitAnswer('bin_to_dec', 32, true)

      expect(mockFetch.mock.calls[0]?.[1]?.headers).toEqual({ 'Content-Type': 'application/json' })
    })

    it('throws an ApiError carrying the status and detail on error', async () => {
      // Two calls below, so two queued responses — `mockResolvedValueOnce` is
      // consumed by the first assertion.
      mockFetch
        .mockResolvedValueOnce(jsonResponse(404, { detail: 'User not found.' }))
        .mockResolvedValueOnce(jsonResponse(404, { detail: 'User not found.' }))

      const promise = gameApi.submitAnswer('hex_to_bin', 4, true)
      await expect(promise).rejects.toThrow('User not found.')
      await expect(
        gameApi.submitAnswer('hex_to_bin', 4, true)
      ).rejects.toBeInstanceOf(ApiError)
      expect(mockFetch.mock.calls[0]?.[1]?.body).toBeDefined()
    })

    it('parses the required level out of a 403 locked-content response', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(403, { detail: 'Content locked until level 13' }))

      const err = await gameApi.submitAnswer('hex_to_bin', 32, true).catch((e: unknown) => e)
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).status).toBe(403)
      expect((err as ApiError).lockedLevel).toBe(13)
    })

    it('reads the backoff from Retry-After on a 429', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse(429, { detail: 'Too many answers.' }, { 'Retry-After': '25' })
      )

      const err = await gameApi.submitAnswer('hex_to_bin', 4, false).catch((e: unknown) => e)
      expect((err as ApiError).status).toBe(429)
      expect((err as ApiError).retryAfterSeconds).toBe(25)
    })

    it('throws a fallback message when the error body is not JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new SyntaxError('Unexpected token')
        },
      })

      await expect(gameApi.submitAnswer('hex_to_bin', 4, true)).rejects.toThrow('Failed to submit answer')
    })
  })

  describe('token refresh on 401', () => {
    it('refreshes the access token and retries the request once', async () => {
      setAccessToken('expired')
      mockFetch
        .mockResolvedValueOnce(jsonResponse(401, { detail: 'Token has expired.' }))
        .mockResolvedValueOnce(jsonResponse(200, { access_token: 'access-2', token_type: 'bearer' }))
        .mockResolvedValueOnce(jsonResponse(200, goldenAnswer))

      await expect(gameApi.submitAnswer('hex_to_bin', 8, true)).resolves.toEqual(goldenAnswer)

      expect(mockFetch).toHaveBeenCalledTimes(3)
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        'http://localhost:8000/api/auth/refresh',
        expect.objectContaining({ method: 'POST', credentials: 'include' })
      )
      expect(mockFetch).toHaveBeenNthCalledWith(
        3,
        'http://localhost:8000/api/game/answer',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer access-2' }),
        })
      )
      expect(getAccessToken()).toBe('access-2')
    })

    it('clears the token and throws when the refresh fails', async () => {
      setAccessToken('expired')
      mockFetch
        .mockResolvedValueOnce(jsonResponse(401, { detail: 'Token has expired.' }))
        .mockResolvedValueOnce(jsonResponse(401, { detail: 'Missing refresh token.' }))

      await expect(gameApi.submitAnswer('hex_to_bin', 8, true)).rejects.toThrow(
        'Session expired. Please login again.'
      )
      expect(getAccessToken()).toBeNull()
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('getLeaderboard', () => {
    it('returns the unwrapped entries of the economy shape', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(200, { entries }))

      await expect(gameApi.getLeaderboard()).resolves.toEqual(entries)
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/game/leaderboard', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
    })

    it('stays public — no Authorization header even with a live token (OQ-9)', async () => {
      setAccessToken('access-1')
      mockFetch.mockResolvedValueOnce(jsonResponse(200, { entries }))

      await gameApi.getLeaderboard()

      const options = mockFetch.mock.calls[0]?.[1] as RequestInit | undefined
      expect(options?.headers).toEqual({ 'Content-Type': 'application/json' })
      expect(options?.credentials).toBeUndefined()
    })

    it('throws on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(500, {}))

      await expect(gameApi.getLeaderboard()).rejects.toThrow('Failed to fetch leaderboard')
    })
  })
})
