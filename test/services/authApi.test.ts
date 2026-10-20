import {
  getCurrentUser,
  login,
  logout,
  refreshAccessToken,
  register,
  verifyEmail,
} from '../../src/services/authApi.ts'
import { clearAccessToken, getAccessToken, setAccessToken } from '../../src/utils/tokenManager.ts'

const mockFetch = vi.fn()

const jsonResponse = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
})

const nonJsonResponse = (status: number) => ({
  ok: false,
  status,
  json: async () => {
    throw new SyntaxError('Unexpected token')
  },
})

const user = {
  id: 'user-1',
  username: 'alice',
  email: 'alice@example.com',
  correct_count: 3,
  incorrect_count: 1,
  points: 42,
}

describe('authApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()
    clearAccessToken()
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  describe('register', () => {
    const data = { email: 'alice@example.com', username: 'alice', password: 'Test1234!' }

    it('posts the registration data', async () => {
      const result = { message: 'Registration successful.', user_id: 'user-1' }
      mockFetch.mockResolvedValueOnce(jsonResponse(201, result))

      await expect(register(data)).resolves.toEqual(result)
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    })

    it('throws the backend detail on conflict', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(409, { detail: 'Email already registered.' }))

      await expect(register(data)).rejects.toThrow('Email already registered.')
    })

    it('throws detail.message for structured errors', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(429, { detail: { message: 'Too many requests.' } }))

      await expect(register(data)).rejects.toThrow('Too many requests.')
    })

    it('throws a fallback message when the error body is not JSON', async () => {
      mockFetch.mockResolvedValueOnce(nonJsonResponse(500))

      await expect(register(data)).rejects.toThrow('Registration failed')
    })
  })

  describe('login', () => {
    const credentials = { email: 'alice@example.com', password: 'Test1234!' }

    it('posts the credentials with cookies and stores the access token', async () => {
      const result = { access_token: 'access-1', token_type: 'bearer' }
      mockFetch.mockResolvedValueOnce(jsonResponse(200, result))

      await expect(login(credentials)).resolves.toEqual(result)
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials),
      })
      expect(getAccessToken()).toBe('access-1')
    })

    it('throws the backend detail and stores no token on failure', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(403, { detail: 'Account not verified.' }))

      await expect(login(credentials)).rejects.toThrow('Account not verified.')
      expect(getAccessToken()).toBeNull()
    })

    it('throws a fallback message when the error body is not JSON', async () => {
      mockFetch.mockResolvedValueOnce(nonJsonResponse(500))

      await expect(login(credentials)).rejects.toThrow('Login failed')
    })
  })

  describe('verifyEmail', () => {
    it('posts the token', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(200, { message: 'Email verified.' }))

      await expect(verifyEmail('verify-token')).resolves.toEqual({ message: 'Email verified.' })
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'verify-token' }),
      })
    })

    it('throws the backend detail on failure', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(400, { detail: 'Token has expired.' }))

      await expect(verifyEmail('old')).rejects.toThrow('Token has expired.')
    })

    it('throws a fallback message when the error body is not JSON', async () => {
      mockFetch.mockResolvedValueOnce(nonJsonResponse(500))

      await expect(verifyEmail('x')).rejects.toThrow('Email verification failed')
    })
  })

  describe('refreshAccessToken', () => {
    it('sends the refresh cookie and stores the new access token', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(200, { access_token: 'access-2', token_type: 'bearer' }))

      await expect(refreshAccessToken()).resolves.toEqual({ access_token: 'access-2', token_type: 'bearer' })
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      })
      expect(getAccessToken()).toBe('access-2')
    })

    it('throws the backend detail on failure', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(401, { detail: 'Missing refresh token.' }))

      await expect(refreshAccessToken()).rejects.toThrow('Missing refresh token.')
    })

    it('throws a fallback message when the error body is not JSON', async () => {
      mockFetch.mockResolvedValueOnce(nonJsonResponse(500))

      await expect(refreshAccessToken()).rejects.toThrow('Token refresh failed')
    })
  })

  describe('logout', () => {
    it('sends the refresh cookie and clears the access token', async () => {
      setAccessToken('access-1')
      mockFetch.mockResolvedValueOnce(jsonResponse(200, { message: 'Logged out.' }))

      await expect(logout()).resolves.toEqual({ message: 'Logged out.' })
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      expect(getAccessToken()).toBeNull()
    })

    it('throws and keeps the token on failure', async () => {
      setAccessToken('access-1')
      mockFetch.mockResolvedValueOnce(nonJsonResponse(500))

      await expect(logout()).rejects.toThrow('Logout failed')
      expect(getAccessToken()).toBe('access-1')
    })
  })

  describe('getCurrentUser', () => {
    it('throws without an access token and does not call the backend', async () => {
      await expect(getCurrentUser()).rejects.toThrow('No access token available')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('fetches GET /api/user/me with the bearer token', async () => {
      setAccessToken('access-1')
      mockFetch.mockResolvedValueOnce(jsonResponse(200, user))

      await expect(getCurrentUser()).resolves.toEqual(user)
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/user/me', {
        method: 'GET',
        headers: { Authorization: 'Bearer access-1' },
        credentials: 'include',
      })
    })

    it('throws the backend detail on error', async () => {
      setAccessToken('access-1')
      mockFetch.mockResolvedValueOnce(jsonResponse(404, { detail: 'Not Found' }))

      await expect(getCurrentUser()).rejects.toThrow('Not Found')
    })

    it('throws a fallback message when the error body is not JSON', async () => {
      setAccessToken('access-1')
      mockFetch.mockResolvedValueOnce(nonJsonResponse(500))

      await expect(getCurrentUser()).rejects.toThrow('Failed to fetch user data')
    })
  })
})
