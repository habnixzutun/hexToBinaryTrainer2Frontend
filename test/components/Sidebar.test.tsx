import { render, screen, fireEvent } from '../../src/test-utils.tsx'
import Sidebar from '../../src/components/Sidebar.tsx'

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

const mockUser = { name: 'TestUser', correct: 5, incorrect: 2, points: 50 }

describe('Sidebar', () => {
  let mockSetActiveApp: ReturnType<typeof vi.fn>
  let mockOnLogout: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    mockSetActiveApp = vi.fn()
    mockOnLogout = vi.fn()
  })

  it('renders user name and stats correctly', () => {
    render(
      <Sidebar
        activeApp="hex"
        setActiveApp={mockSetActiveApp}
        user={mockUser}
        onLogout={mockOnLogout}
      />
    )

    // Should show user name
    expect(screen.getByText('TestUser')).toBeInTheDocument()

    // Should show stats: correct (OK), incorrect (ERR), points (PTS)
    expect(screen.getByText('5')).toBeInTheDocument() // correct
    expect(screen.getByText('2')).toBeInTheDocument() // incorrect
    expect(screen.getByText('50')).toBeInTheDocument() // points

    // Check stat labels
    expect(screen.getByLabelText('Correct answers')).toBeInTheDocument()
    expect(screen.getByLabelText('Wrong answers')).toBeInTheDocument()
    expect(screen.getByLabelText('Points')).toBeInTheDocument()
  })

  it('renders three navigation buttons with correct aria-labels', () => {
    render(
      <Sidebar
        activeApp="hex"
        setActiveApp={mockSetActiveApp}
        user={mockUser}
        onLogout={mockOnLogout}
      />
    )

    // Should have three nav buttons
    expect(screen.getByLabelText('Hex/Binary trainer')).toBeInTheDocument()
    expect(screen.getByLabelText('Unicode trainer')).toBeInTheDocument()
    expect(screen.getByLabelText('Leaderboard')).toBeInTheDocument()
  })

  it('marks active navigation item with aria-current="page"', () => {
    render(
      <Sidebar
        activeApp="hex"
        setActiveApp={mockSetActiveApp}
        user={mockUser}
        onLogout={mockOnLogout}
      />
    )

    const hexButton = screen.getByLabelText('Hex/Binary trainer')
    expect(hexButton).toHaveAttribute('aria-current', 'page')

    const unicodeButton = screen.getByLabelText('Unicode trainer')
    expect(unicodeButton).not.toHaveAttribute('aria-current')
  })

  it('calls setActiveApp when navigation button is clicked', () => {
    render(
      <Sidebar
        activeApp="hex"
        setActiveApp={mockSetActiveApp}
        user={mockUser}
        onLogout={mockOnLogout}
      />
    )

    const leaderboardButton = screen.getByLabelText('Leaderboard')
    fireEvent.click(leaderboardButton)

    expect(mockSetActiveApp).toHaveBeenCalledWith('leaderboard')
  })

  it('toggles mobile menu on hamburger button click', () => {
    render(
      <Sidebar
        activeApp="hex"
        setActiveApp={mockSetActiveApp}
        user={mockUser}
        onLogout={mockOnLogout}
      />
    )

    const hamburgerButton = screen.getByLabelText('Open menu')

    // Initially closed
    expect(hamburgerButton).toHaveAttribute('aria-expanded', 'false')

    // Click to open
    fireEvent.click(hamburgerButton)
    expect(hamburgerButton).toHaveAttribute('aria-expanded', 'true')
    expect(hamburgerButton).toHaveAttribute('aria-label', 'Close menu')

    // Click to close
    fireEvent.click(hamburgerButton)
    expect(hamburgerButton).toHaveAttribute('aria-expanded', 'false')
    expect(hamburgerButton).toHaveAttribute('aria-label', 'Open menu')
  })

  it('closes mobile menu when navigation item is clicked', () => {
    render(
      <Sidebar
        activeApp="hex"
        setActiveApp={mockSetActiveApp}
        user={mockUser}
        onLogout={mockOnLogout}
      />
    )

    const hamburgerButton = screen.getByLabelText('Open menu')

    // Open menu
    fireEvent.click(hamburgerButton)
    expect(hamburgerButton).toHaveAttribute('aria-expanded', 'true')

    // Click nav item
    const unicodeButton = screen.getByLabelText('Unicode trainer')
    fireEvent.click(unicodeButton)

    // Menu should close
    expect(hamburgerButton).toHaveAttribute('aria-expanded', 'false')
    expect(mockSetActiveApp).toHaveBeenCalledWith('unicode')
  })

  it('toggles theme and updates aria-label', () => {
    render(
      <Sidebar
        activeApp="hex"
        setActiveApp={mockSetActiveApp}
        user={mockUser}
        onLogout={mockOnLogout}
      />
    )

    // Find theme toggle button (initially dark theme based on ThemeProvider default)
    const themeButton = screen.getByLabelText(/switch to light mode/i)
    expect(themeButton).toBeInTheDocument()

    // Click to toggle
    fireEvent.click(themeButton)

    // Should now show "Switch to dark mode"
    expect(screen.getByLabelText(/switch to dark mode/i)).toBeInTheDocument()
  })

  it('toggles locale and updates button text', () => {
    render(
      <Sidebar
        activeApp="hex"
        setActiveApp={mockSetActiveApp}
        user={mockUser}
        onLogout={mockOnLogout}
      />
    )

    // Find locale toggle button (initially 'de' locale, shows "EN")
    const localeButton = screen.getByLabelText(/switch to english/i)
    expect(localeButton).toBeInTheDocument()
    expect(screen.getByText('EN')).toBeInTheDocument()

    // Click to toggle to English
    fireEvent.click(localeButton)

    // Should now show "DE" and German label
    expect(screen.getByText('DE')).toBeInTheDocument()
    expect(screen.getByLabelText(/auf deutsch wechseln/i)).toBeInTheDocument()
  })

  it('calls onLogout when logout button is clicked', () => {
    render(
      <Sidebar
        activeApp="hex"
        setActiveApp={mockSetActiveApp}
        user={mockUser}
        onLogout={mockOnLogout}
      />
    )

    // Find logout button (German locale is default)
    const logoutButton = screen.getByLabelText(/sitzung beenden/i)
    fireEvent.click(logoutButton)

    expect(mockOnLogout).toHaveBeenCalled()
  })

  it('shows online status dot with proper aria-label', () => {
    render(
      <Sidebar
        activeApp="hex"
        setActiveApp={mockSetActiveApp}
        user={mockUser}
        onLogout={mockOnLogout}
      />
    )

    // Should have status dot with aria-label
    const statusDot = screen.getByRole('status', { name: /online/i })
    expect(statusDot).toBeInTheDocument()
    expect(statusDot).toHaveAttribute('aria-label', 'Online')
  })
})
