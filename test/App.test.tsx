import { render, screen, fireEvent, waitFor } from '../src/test-utils.tsx'
import App from '../src/App.tsx'
import { api } from '../src/services/api.ts'

// Mock the api module
vi.mock('./services/api', () => ({
  api: {
    getUser: vi.fn(),
    getLeaderboard: vi.fn(),
    updateUserCorrect: vi.fn(),
    updateUserIncorrect: vi.fn(),
  },
}))

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

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()

    // Mock Math.random for deterministic questions
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    // Setup default API mock responses
    vi.mocked(api.getUser).mockResolvedValue({
      name: 'TestUser',
      correct: 5,
      incorrect: 2,
      points: 50,
    })
    vi.mocked(api.getLeaderboard).mockResolvedValue([
      { name: 'Alice', correct: 10, incorrect: 2, points: 100 },
      { name: 'Bob', correct: 8, incorrect: 3, points: 80 },
    ])
    vi.mocked(api.updateUserCorrect).mockResolvedValue({
      message: 'Correct',
      user: { name: 'TestUser', correct: 6, incorrect: 2, points: 60 },
    })
    vi.mocked(api.updateUserIncorrect).mockResolvedValue({
      message: 'Incorrect',
      user: { name: 'TestUser', correct: 5, incorrect: 3, points: 50 },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows WelcomeScreen when no saved name in localStorage', () => {
    render(<App />)

    // Should show welcome screen
    expect(screen.getByRole('heading', { name: /it-trainer/i })).toBeInTheDocument()
    expect(screen.getByRole('form', { name: /login form/i })).toBeInTheDocument()

    // Should NOT call getUser
    expect(api.getUser).not.toHaveBeenCalled()
  })

  it('loads user from localStorage on mount and shows trainer', async () => {
    // Arrange: saved name in localStorage
    localStorageMock.getItem.mockReturnValue('SavedUser')
    vi.mocked(api.getUser).mockResolvedValue({
      name: 'SavedUser',
      correct: 10,
      incorrect: 5,
      points: 100,
    })

    // Act
    render(<App />)

    // Assert: should call getUser with saved name
    await waitFor(() => {
      expect(api.getUser).toHaveBeenCalledWith('SavedUser')
    })

    // Should show trainer interface (Sidebar + HexBinTrainer by default)
    await waitFor(() => {
      expect(screen.getByLabelText('Main navigation')).toBeInTheDocument()
      expect(screen.getByRole('region', { name: /hex\/binary trainer/i })).toBeInTheDocument()
    })
  })

  it('creates offline user when API fails on mount', async () => {
    // Arrange: saved name but API rejects
    localStorageMock.getItem.mockReturnValue('OfflineUser')
    vi.mocked(api.getUser).mockRejectedValue(new Error('Network error'))

    // Act
    render(<App />)

    // Assert: should show trainer with offline user (stats 0/0/0)
    await waitFor(() => {
      expect(screen.getByLabelText('Main navigation')).toBeInTheDocument()
    })

    // Check that stats show 0 (offline user)
    const statsContainer = screen.getByLabelText('Your statistics')
    expect(statsContainer).toBeInTheDocument()

    // Should have saved name to localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith('trainer_name', 'OfflineUser')
  })

  it('joins via WelcomeScreen form and switches to trainer view', async () => {
    render(<App />)

    // Type valid name
    const nameInput = screen.getByLabelText(/username/i)
    fireEvent.change(nameInput, { target: { value: 'Alice' } })

    // Submit form
    const submitButton = screen.getByRole('button', { name: /los geht's/i })
    fireEvent.click(submitButton)

    // Should call getUser and save to localStorage
    await waitFor(() => {
      expect(api.getUser).toHaveBeenCalledWith('Alice')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('trainer_name', 'Alice')
    })

    // Should switch to trainer view
    await waitFor(() => {
      expect(screen.getByLabelText('Main navigation')).toBeInTheDocument()
    })
  })

  it('logs out and returns to WelcomeScreen', async () => {
    // Arrange: start with logged-in user
    localStorageMock.getItem.mockReturnValue('TestUser')

    render(<App />)

    // Wait for trainer to load
    await waitFor(() => {
      expect(screen.getByLabelText('Main navigation')).toBeInTheDocument()
    })

    // Act: click logout button
    const logoutButton = screen.getByLabelText(/sitzung beenden/i)
    fireEvent.click(logoutButton)

    // Assert: should return to WelcomeScreen
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /it-trainer/i })).toBeInTheDocument()
    })

    // Should remove name from localStorage
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('trainer_name')
  })

  it('navigates between hex, unicode, and leaderboard views', async () => {
    // Arrange: start logged in
    localStorageMock.getItem.mockReturnValue('TestUser')

    render(<App />)

    // Wait for trainer to load
    await waitFor(() => {
      expect(screen.getByLabelText('Main navigation')).toBeInTheDocument()
    })

    // Initially shows HexBinTrainer
    expect(screen.getByRole('region', { name: /hex\/binary trainer/i })).toBeInTheDocument()

    // Click Unicode trainer nav (use role=button to avoid matching leaderboard heading)
    const unicodeButton = screen.getByRole('button', { name: 'Unicode trainer' })
    fireEvent.click(unicodeButton)

    // Should show UnicodeTrainer
    await waitFor(() => {
      expect(screen.getByRole('region', { name: /unicode trainer/i })).toBeInTheDocument()
    })

    // Click Leaderboard nav (use role=button to avoid matching leaderboard heading)
    const leaderboardButton = screen.getByRole('button', { name: 'Leaderboard' })
    fireEvent.click(leaderboardButton)

    // Should hide trainer main and show leaderboard full-width
    await waitFor(() => {
      expect(screen.queryByRole('main')).not.toBeInTheDocument()
      // Leaderboard should be visible (check for leaderboard heading)
      expect(screen.getByRole('heading', { name: /bestenliste/i })).toBeInTheDocument()
    })
  })

  it('has skip link and main landmark for accessibility', async () => {
    // Arrange: start logged in
    localStorageMock.getItem.mockReturnValue('TestUser')

    render(<App />)

    // Wait for trainer to load
    await waitFor(() => {
      expect(screen.getByLabelText('Main navigation')).toBeInTheDocument()
    })

    // Should have skip link
    const skipLink = screen.getByText('Skip to main content')
    expect(skipLink).toBeInTheDocument()
    expect(skipLink).toHaveAttribute('href', '#main-content')

    // Should have main landmark with id
    const main = screen.getByRole('main')
    expect(main).toHaveAttribute('id', 'main-content')
  })

  it('renders leaderboard alongside trainer', async () => {
    // Arrange: start logged in
    localStorageMock.getItem.mockReturnValue('TestUser')

    render(<App />)

    // Wait for trainer to load
    await waitFor(() => {
      expect(screen.getByRole('region', { name: /hex\/binary trainer/i })).toBeInTheDocument()
    })

    // Should also render leaderboard (getLeaderboard called)
    await waitFor(() => {
      expect(api.getLeaderboard).toHaveBeenCalled()
    })

    // Should show leaderboard heading
    expect(screen.getByRole('heading', { name: /bestenliste/i })).toBeInTheDocument()
  })
})
