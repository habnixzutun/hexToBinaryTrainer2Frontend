import { getCurrentUser } from '../../src/services/authApi.ts'
import { clearAccessToken, getAccessToken, setAccessToken } from '../../src/utils/tokenManager.ts'

const mockFetch = vi.fn()

const jsonResponse = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
})

const user = {
  id: 'user-1',
  username: 'alice',
  email: 'alice@example.com',
  correct_count: 3,
  incorrect_count: 1,
  points: 42,
}

describe('authApi.getCurrentUser', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()
    clearAccessToken()
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('throws without an access token and does not call the backend', async () => {
    await expect(getCurrentUser()).rejects.toThrow('No access token available')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('fetches GET /api/user/me with the bearer token', async () => {
    setAccessToken('access-1')
    mockFetch.mockResolvedValueOnce(jsonResponse(200, user))

    await expect(getCurrentUser()).resolves.toEqual(user)
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/user/me',
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer access-1' },
        credentials: 'include',
      })
    )
  })

  it('refreshes the access token once on 401 and retries', async () => {
    setAccessToken('expired')
    mockFetch
      .mockResolvedValueOnce(jsonResponse(401, { detail: 'Token has expired.' }))
      .mockResolvedValueOnce(jsonResponse(200, { access_token: 'access-2', token_type: 'bearer' }))
      .mockResolvedValueOnce(jsonResponse(200, user))

    await expect(getCurrentUser()).resolves.toEqual(user)

    expect(mockFetch).toHaveBeenCalledTimes(3)
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'http://localhost:8000/api/auth/refresh',
      expect.objectContaining({ method: 'POST', credentials: 'include' })
    )
    expect(mockFetch).toHaveBeenNthCalledWith(
      3,
      'http://localhost:8000/api/user/me',
      expect.objectContaining({ headers: { Authorization: 'Bearer access-2' } })
    )
    expect(getAccessToken()).toBe('access-2')
  })

  it('throws when the refresh after a 401 fails', async () => {
    setAccessToken('expired')
    mockFetch
      .mockResolvedValueOnce(jsonResponse(401, { detail: 'Token has expired.' }))
      .mockResolvedValueOnce(jsonResponse(401, { detail: 'Missing refresh token.' }))

    await expect(getCurrentUser()).rejects.toThrow('Missing refresh token.')
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('throws the backend detail on other errors without refreshing', async () => {
    setAccessToken('access-1')
    mockFetch.mockResolvedValueOnce(jsonResponse(404, { detail: 'Not Found' }))

    await expect(getCurrentUser()).rejects.toThrow('Not Found')
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
