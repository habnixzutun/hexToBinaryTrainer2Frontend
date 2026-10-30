import { userEvent } from '@testing-library/user-event'
import { render, screen, waitFor, within } from '../src/test-utils.tsx'
import App from '../src/App.tsx'
import * as authApi from '../src/services/authApi.ts'
import { gameApi, type GameAnswerResponse, type LeaderboardEntry } from '../src/services/api.ts'
import { testUser } from './helpers/auth.ts'
import { setPersistenceEnabled } from '../src/utils/persistence.ts'

// Real AuthProvider + AuthGate; only the HTTP layer is mocked.
vi.mock('../src/services/authApi.ts', () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
  refreshAccessToken: vi.fn(),
}))

vi.mock('../src/services/api.ts', () => ({
  gameApi: {
    submitAnswer: vi.fn(),
    getLeaderboard: vi.fn(),
  },
}))

const mockedAuthApi = vi.mocked(authApi)
const mockedGameApi = vi.mocked(gameApi)

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

const DESKTOP_WIDTH = 1280
const MOBILE_WIDTH = 500

const leaderboardEntries: LeaderboardEntry[] = [
  { user_id: 'u-1', username: 'Alice', total_xp: 1320, level: 6, correct_count: 10, incorrect_count: 2 },
  { user_id: 'user-1', username: 'TestUser', total_xp: 50, level: 1, correct_count: 5, incorrect_count: 2 },
]

/** L1 -> 58 of 100 XP: the server computes everything, the client only renders. */
const answer: GameAnswerResponse = {
  xp_delta: 8,
  total_xp: 58,
  level: 1,
  xp_in_level: 58,
  xp_required_for_next_level: 100,
  current_streak: 1,
  best_streak: 3,
  correct_count: 6,
  incorrect_count: 2,
  newly_unlocked: [],
}

const setViewportWidth = (width: number): void => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width })
}

async function loginThroughForm(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.type(screen.getByLabelText('E-Mail'), 'test@example.com')
  await user.type(screen.getByLabelText('Passwort'), 'Test1234!')
  await user.click(screen.getByRole('button', { name: 'Anmelden' }))
  await screen.findByRole('region', { name: /hex\/binary trainer/i })
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setPersistenceEnabled(true)
    setViewportWidth(DESKTOP_WIDTH)

    // Mock Math.random for deterministic questions (8 bits → hex "87")
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    // No session on startup: no access token, no valid refresh cookie
    mockedAuthApi.refreshAccessToken.mockRejectedValue(new Error('Missing refresh token.'))
    mockedAuthApi.login.mockResolvedValue({ access_token: 'access-1', token_type: 'bearer' })
    mockedAuthApi.getCurrentUser.mockResolvedValue(testUser)
    mockedAuthApi.logout.mockResolvedValue({ message: 'Logged out.' })

    mockedGameApi.getLeaderboard.mockResolvedValue(leaderboardEntries)
    mockedGameApi.submitAnswer.mockResolvedValue(answer)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows the login screen when not authenticated', async () => {
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Willkommen zurück' })).toBeInTheDocument()
    expect(screen.getByRole('form', { name: 'Anmelden' })).toBeInTheDocument()
    expect(mockedAuthApi.getCurrentUser).not.toHaveBeenCalled()
  })

  it('logs in, loads the current user and shows the trainer', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByRole('heading', { name: 'Willkommen zurück' })

    await loginThroughForm(user)

    expect(mockedAuthApi.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'Test1234!',
    })
    expect(mockedAuthApi.getCurrentUser).toHaveBeenCalledTimes(1)

    // Sidebar shows data from GET /api/user/me
    const sidebar = screen.getByLabelText('Main navigation')
    expect(within(sidebar).getByText('TestUser')).toBeInTheDocument()
    // correct / incorrect / total XP
    expect(within(sidebar).getByLabelText('Your statistics').textContent).toBe('5OK2ERR50XP')
  })

  it('holds the XP progress back until the server supplies it (cold start)', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByRole('heading', { name: 'Willkommen zurück' })
    await loginThroughForm(user)

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Stufe')).toHaveTextContent('1')
  })

  it('stays on the login screen and shows the error when loading the user fails', async () => {
    // Regression: GET /api/user/me returned 404 right after a successful login
    mockedAuthApi.getCurrentUser.mockRejectedValue(new Error('Not Found'))
    const user = userEvent.setup()
    render(<App />)
    await screen.findByRole('heading', { name: 'Willkommen zurück' })

    await user.type(screen.getByLabelText('E-Mail'), 'test@example.com')
    await user.type(screen.getByLabelText('Passwort'), 'Test1234!')
    await user.click(screen.getByRole('button', { name: 'Anmelden' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Not Found')
    expect(screen.getByRole('heading', { name: 'Willkommen zurück' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Main navigation')).not.toBeInTheDocument()
  })

  it('applies the server answer to the HUD and the sidebar without a second round-trip', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByRole('heading', { name: 'Willkommen zurück' })
    await loginThroughForm(user)

    // hex "87" → binary "10000111"
    await user.type(screen.getByRole('textbox'), '10000111')
    await user.click(screen.getByRole('button', { name: /check answer/i }))

    await waitFor(() => {
      expect(mockedGameApi.submitAnswer).toHaveBeenCalledWith('hex_to_bin', 8, true)
    })
    // applyGameResult replaces the refreshUser() call the /answer response makes redundant.
    expect(mockedAuthApi.getCurrentUser).toHaveBeenCalledTimes(1)

    const stats = within(screen.getByLabelText('Main navigation')).getByLabelText('Your statistics')
    await waitFor(() => {
      expect(stats.textContent).toBe('6OK2ERR58XP')
    })

    // The HUD renders the progress straight off the /answer payload (AC-2).
    const bar = await screen.findByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '58')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
    expect(screen.getByLabelText('Serie')).toHaveTextContent('1')
    expect(screen.getByLabelText('Beste Serie')).toHaveTextContent('3')
  })

  it('logs out and returns to the login screen', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByRole('heading', { name: 'Willkommen zurück' })
    await loginThroughForm(user)

    await user.click(screen.getByLabelText(/ausloggen/i))

    expect(await screen.findByRole('heading', { name: 'Willkommen zurück' })).toBeInTheDocument()
    expect(mockedAuthApi.logout).toHaveBeenCalledTimes(1)
  })

  it('has skip link and main landmark for accessibility', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByRole('heading', { name: 'Willkommen zurück' })
    await loginThroughForm(user)

    const skipLink = screen.getByText('Skip to main content')
    expect(skipLink).toHaveAttribute('href', '#main-content')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
  })

  it('renders the leaderboard alongside the trainer on desktop', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByRole('heading', { name: 'Willkommen zurück' })
    await loginThroughForm(user)

    expect(await screen.findByRole('heading', { name: 'Bestenliste' })).toBeInTheDocument()
    expect(mockedGameApi.getLeaderboard).toHaveBeenCalled()
    expect(await screen.findByLabelText(/rank 1: alice/i)).toBeInTheDocument()

    // On desktop the leaderboard is always visible, so its nav item is hidden
    expect(screen.queryByRole('button', { name: 'Leaderboard' })).not.toBeInTheDocument()
  })

  it('navigates between hex, unicode and leaderboard views on mobile', async () => {
    setViewportWidth(MOBILE_WIDTH)
    const user = userEvent.setup()
    render(<App />)
    await screen.findByRole('heading', { name: 'Willkommen zurück' })
    await loginThroughForm(user)

    await user.click(screen.getByRole('button', { name: 'Unicode trainer' }))
    expect(await screen.findByRole('region', { name: /unicode trainer/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Leaderboard' }))
    await waitFor(() => {
      // Trainer area is replaced by the full-width leaderboard
      expect(screen.queryByRole('main')).not.toBeInTheDocument()
    })
    expect(screen.getByRole('heading', { name: 'Bestenliste' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Hex/Binary trainer' }))
    expect(await screen.findByRole('region', { name: /hex\/binary trainer/i })).toBeInTheDocument()
  })

  describe('guest mode', () => {
    it('lets a guest train without backend calls or localStorage writes', async () => {
      const user = userEvent.setup()
      render(<App />)
      await screen.findByRole('heading', { name: 'Willkommen zurück' })

      await user.click(screen.getByRole('button', { name: 'Als Gast testen' }))
      await screen.findByRole('region', { name: /hex\/binary trainer/i })
      localStorageMock.setItem.mockClear()

      // Correct answer for hex "87"
      await user.type(screen.getByRole('textbox'), '10000111')
      await user.click(screen.getByRole('button', { name: /check answer/i }))

      const stats = screen.getByLabelText('Your statistics')
      await waitFor(() => expect(within(stats).getByText('1')).toBeInTheDocument())
      expect(within(stats).getByText('–')).toBeInTheDocument()
      expect(screen.getByText('Gast')).toBeInTheDocument()

      // Changing the theme as a guest must not be persisted
      await user.click(screen.getByRole('button', { name: 'Switch to light mode' }))

      expect(mockedGameApi.submitAnswer).not.toHaveBeenCalled()
      expect(mockedAuthApi.getCurrentUser).not.toHaveBeenCalled()
      expect(localStorageMock.setItem).not.toHaveBeenCalled()

      // The public leaderboard is still visible
      expect(await screen.findByText('Alice')).toBeInTheDocument()
    })

    it('returns to the welcome screen when the guest leaves', async () => {
      const user = userEvent.setup()
      render(<App />)
      await screen.findByRole('heading', { name: 'Willkommen zurück' })

      await user.click(screen.getByRole('button', { name: 'Als Gast testen' }))
      await user.click(await screen.findByRole('button', { name: 'Gastmodus beenden' }))

      expect(await screen.findByRole('heading', { name: 'Willkommen zurück' })).toBeInTheDocument()
      expect(mockedAuthApi.logout).not.toHaveBeenCalled()
    })

    it('takes a guest straight to the registration via the account menu', async () => {
      const user = userEvent.setup()
      render(<App />)
      await screen.findByRole('heading', { name: 'Willkommen zurück' })

      await user.click(screen.getByRole('button', { name: 'Als Gast testen' }))
      await user.click(await screen.findByRole('button', { name: 'Konto' }))
      await user.click(screen.getByRole('button', { name: 'Konto erstellen' }))

      expect(await screen.findByRole('heading', { name: 'Konto erstellen' })).toBeInTheDocument()
    })
  })
})
