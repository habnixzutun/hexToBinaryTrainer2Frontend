import { gameApi } from '../../src/services/api.ts'
import { clearAccessToken, getAccessToken, setAccessToken } from '../../src/utils/tokenManager.ts'

const mockFetch = vi.fn()

const jsonResponse = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
})

const submitResult = {
  message: 'Correct answer recorded',
  user_id: 'user-1',
  correct_count: 1,
  incorrect_count: 0,
  points: 8,
}

describe('gameApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()
    clearAccessToken()
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  describe('submitCorrect', () => {
    it('posts the bits with bearer token and refresh cookie', async () => {
      setAccessToken('access-1')
      mockFetch.mockResolvedValueOnce(jsonResponse(200, submitResult))

      await expect(gameApi.submitCorrect(8)).resolves.toEqual(submitResult)
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/game/correct', {
        method: 'POST',
        body: JSON.stringify({ bits: 8 }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer access-1',
        },
        credentials: 'include',
      })
    })

    it('omits the Authorization header without access token', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(200, submitResult))

      await gameApi.submitCorrect(8)

      expect(mockFetch.mock.calls[0]?.[1]?.headers).toEqual({ 'Content-Type': 'application/json' })
    })

    it('throws the backend detail on error', async () => {
      setAccessToken('access-1')
      mockFetch.mockResolvedValueOnce(jsonResponse(404, { detail: 'User not found.' }))

      await expect(gameApi.submitCorrect(8)).rejects.toThrow('User not found.')
    })
  })

  describe('submitIncorrect', () => {
    it('posts the bits to /api/game/incorrect', async () => {
      setAccessToken('access-1')
      const result = { ...submitResult, message: 'Incorrect answer recorded', points: -16 }
      mockFetch.mockResolvedValueOnce(jsonResponse(200, result))

      await expect(gameApi.submitIncorrect(4)).resolves.toEqual(result)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/game/incorrect',
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ bits: 4 }) })
      )
    })

    it('throws a fallback message when the error body is not JSON', async () => {
      setAccessToken('access-1')
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new SyntaxError('Unexpected token')
        },
      })

      await expect(gameApi.submitIncorrect(4)).rejects.toThrow('Failed to submit incorrect answer')
    })
  })

  describe('token refresh on 401', () => {
    it('refreshes the access token and retries the request once', async () => {
      setAccessToken('expired')
      mockFetch
        .mockResolvedValueOnce(jsonResponse(401, { detail: 'Token has expired.' }))
        .mockResolvedValueOnce(jsonResponse(200, { access_token: 'access-2', token_type: 'bearer' }))
        .mockResolvedValueOnce(jsonResponse(200, submitResult))

      await expect(gameApi.submitCorrect(8)).resolves.toEqual(submitResult)

      expect(mockFetch).toHaveBeenCalledTimes(3)
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        'http://localhost:8000/api/auth/refresh',
        expect.objectContaining({ method: 'POST', credentials: 'include' })
      )
      expect(mockFetch).toHaveBeenNthCalledWith(
        3,
        'http://localhost:8000/api/game/correct',
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

      await expect(gameApi.submitCorrect(8)).rejects.toThrow('Session expired. Please login again.')
      expect(getAccessToken()).toBeNull()
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('getLeaderboard', () => {
    it('returns the unwrapped entries from a public GET', async () => {
      const entries = [
        { user_id: 'u-1', username: 'Alice', correct_count: 10, incorrect_count: 2, points: 100 },
      ]
      mockFetch.mockResolvedValueOnce(jsonResponse(200, { entries }))

      await expect(gameApi.getLeaderboard()).resolves.toEqual(entries)
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/game/leaderboard', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
    })

    it('throws on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(500, {}))

      await expect(gameApi.getLeaderboard()).rejects.toThrow('Failed to fetch leaderboard')
    })
  })
})
