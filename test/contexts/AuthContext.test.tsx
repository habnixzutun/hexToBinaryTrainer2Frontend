import { renderHook, waitFor, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from '../../src/contexts/AuthContext.tsx'
import * as authApi from '../../src/services/authApi.ts'
import { clearAccessToken, getAccessToken, setAccessToken } from '../../src/utils/tokenManager.ts'
import { isPersistenceEnabled, setPersistenceEnabled } from '../../src/utils/persistence.ts'

vi.mock('../../src/services/authApi.ts', () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
  refreshAccessToken: vi.fn(),
}))

const mockedApi = vi.mocked(authApi)

const user = {
  id: 'user-1',
  username: 'alice',
  email: 'alice@example.com',
  correct_count: 0,
  incorrect_count: 0,
  points: 0,
}

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearAccessToken()
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
})

describe('AuthContext guest mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearAccessToken()
    setPersistenceEnabled(true)
    // No session on startup
    mockedApi.refreshAccessToken.mockRejectedValue(new Error('Missing refresh token.'))
  })

  afterEach(() => {
    setPersistenceEnabled(true)
  })

  async function startAsGuest() {
    const hook = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(hook.result.current.loading).toBe(false))
    act(() => hook.result.current.startGuest())
    return hook
  }

  it('starts a guest session without a user and turns off persistence', async () => {
    const { result } = await startAsGuest()

    expect(result.current.isGuest).toBe(true)
    expect(result.current.user).toBeNull()
    expect(result.current.guestStats).toEqual({ correct_count: 0, incorrect_count: 0 })
    expect(isPersistenceEnabled()).toBe(false)
  })

  it('counts guest answers in memory only', async () => {
    const { result } = await startAsGuest()

    act(() => result.current.recordGuestAnswer(true))
    act(() => result.current.recordGuestAnswer(true))
    act(() => result.current.recordGuestAnswer(false))

    expect(result.current.guestStats).toEqual({ correct_count: 2, incorrect_count: 1 })
  })

  it('ignores guest answers when not in guest mode', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => result.current.recordGuestAnswer(true))

    expect(result.current.isGuest).toBe(false)
    expect(result.current.guestStats).toBeNull()
  })

  it('does not call the backend when a guest refreshes or leaves', async () => {
    const { result } = await startAsGuest()

    await act(() => result.current.refreshUser())
    await act(() => result.current.logout())

    expect(mockedApi.getCurrentUser).not.toHaveBeenCalled()
    expect(mockedApi.logout).not.toHaveBeenCalled()
    expect(result.current.isGuest).toBe(false)
    expect(result.current.guestStats).toBeNull()
    expect(isPersistenceEnabled()).toBe(true)
  })

  it('ignores game results while in guest mode', async () => {
    const { result } = await startAsGuest()

    act(() =>
      result.current.applyGameResult({
        message: 'Correct answer recorded',
        user_id: 'user-1',
        correct_count: 9,
        incorrect_count: 9,
        points: 99,
      }),
    )

    expect(result.current.user).toBeNull()
    expect(result.current.guestStats).toEqual({ correct_count: 0, incorrect_count: 0 })
  })
})
