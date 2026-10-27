import type { ComponentProps } from 'react'
import { render, screen, fireEvent } from '../../src/test-utils.tsx'
import Sidebar from '../../src/components/Sidebar.tsx'
import type { ActiveApp } from '../../src/App.tsx'
import { authValue } from '../helpers/auth.ts'

const mockUseAuth = vi.hoisted(() => vi.fn())
vi.mock('../../src/contexts/AuthContext.tsx', () => ({ useAuth: mockUseAuth }))

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

describe('Sidebar', () => {
  let mockSetActiveApp: ReturnType<typeof vi.fn<(app: ActiveApp) => void>>
  let mockOnLogout: ReturnType<typeof vi.fn<() => void>>
  let mockSetIsMobileMenuOpen: ReturnType<typeof vi.fn<(open: boolean) => void>>
  let defaultProps: ComponentProps<typeof Sidebar>

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    mockUseAuth.mockReturnValue(authValue())
    mockSetActiveApp = vi.fn()
    mockOnLogout = vi.fn()
    mockSetIsMobileMenuOpen = vi.fn()
    defaultProps = {
      activeApp: 'hex',
      setActiveApp: mockSetActiveApp,
      onLogout: mockOnLogout,
      isMobileMenuOpen: false,
      setIsMobileMenuOpen: mockSetIsMobileMenuOpen,
      hideLeaderboardNav: false,
      isMobile: false,
    }
  })

  it('renders user name and stats correctly', () => {
    render(<Sidebar {...defaultProps} />)

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
    render(<Sidebar {...defaultProps} />)

    // Should have three nav buttons
    expect(screen.getByLabelText('Hex/Binary trainer')).toBeInTheDocument()
    expect(screen.getByLabelText('Unicode trainer')).toBeInTheDocument()
    expect(screen.getByLabelText('Leaderboard')).toBeInTheDocument()
  })

  it('hides leaderboard nav when hideLeaderboardNav is true', () => {
    render(<Sidebar {...defaultProps} hideLeaderboardNav={true} />)

    // Should only have two nav buttons (no leaderboard)
    expect(screen.getByLabelText('Hex/Binary trainer')).toBeInTheDocument()
    expect(screen.getByLabelText('Unicode trainer')).toBeInTheDocument()
    expect(screen.queryByLabelText('Leaderboard')).not.toBeInTheDocument()
  })

  it('marks active navigation item with aria-current="page"', () => {
    render(<Sidebar {...defaultProps} />)

    const hexButton = screen.getByLabelText('Hex/Binary trainer')
    expect(hexButton).toHaveAttribute('aria-current', 'page')

    const unicodeButton = screen.getByLabelText('Unicode trainer')
    expect(unicodeButton).not.toHaveAttribute('aria-current')
  })

  it('calls setActiveApp when navigation button is clicked', () => {
    render(<Sidebar {...defaultProps} />)

    const leaderboardButton = screen.getByLabelText('Leaderboard')
    fireEvent.click(leaderboardButton)

    expect(mockSetActiveApp).toHaveBeenCalledWith('leaderboard')
    expect(mockSetIsMobileMenuOpen).toHaveBeenCalledWith(false)
  })

  it('closes mobile menu when navigation item is clicked', () => {
    render(<Sidebar {...defaultProps} isMobileMenuOpen={true} />)

    // Click nav item
    const unicodeButton = screen.getByLabelText('Unicode trainer')
    fireEvent.click(unicodeButton)

    // Should close menu
    expect(mockSetIsMobileMenuOpen).toHaveBeenCalledWith(false)
    expect(mockSetActiveApp).toHaveBeenCalledWith('unicode')
  })

  it('renders hex/bin mode sub-section when hex trainer is active', () => {
    const mockOnHexModeChange = vi.fn()
    render(<Sidebar {...defaultProps} onHexModeChange={mockOnHexModeChange} activeHexMode="HexToBin" />)

    // Should show mode list (labelled via aria-label)
    expect(screen.getByRole('list', { name: 'Hex/Bin Modi' })).toBeInTheDocument()

    // Should show 6 mode buttons
    expect(screen.getByLabelText('Mode: HexToBin')).toBeInTheDocument()
    expect(screen.getByLabelText('Mode: HexToDec')).toBeInTheDocument()
    expect(screen.getByLabelText('Mode: BinToHex')).toBeInTheDocument()
    expect(screen.getByLabelText('Mode: BinToDec')).toBeInTheDocument()
    expect(screen.getByLabelText('Mode: DecToHex')).toBeInTheDocument()
    expect(screen.getByLabelText('Mode: DecToBin')).toBeInTheDocument()
  })

  it('calls onHexModeChange when mode button is clicked', () => {
    const mockOnHexModeChange = vi.fn()
    render(<Sidebar {...defaultProps} onHexModeChange={mockOnHexModeChange} activeHexMode="HexToBin" />)

    fireEvent.click(screen.getByLabelText('Mode: HexToDec'))
    expect(mockOnHexModeChange).toHaveBeenCalledWith('HexToDec')
  })

  it('does not render mode sub-section when not in hex app', () => {
    const mockOnHexModeChange = vi.fn()
    render(<Sidebar {...defaultProps} activeApp="unicode" onHexModeChange={mockOnHexModeChange} />)

    expect(screen.queryByRole('list', { name: 'Hex/Bin Modi' })).not.toBeInTheDocument()
  })

  it('toggles theme and updates aria-label', () => {
    render(<Sidebar {...defaultProps} />)

    // Find theme toggle button (initially dark theme based on ThemeProvider default)
    const themeButton = screen.getByLabelText(/switch to light mode/i)
    expect(themeButton).toBeInTheDocument()

    // Click to toggle
    fireEvent.click(themeButton)

    // Should now show "Switch to dark mode"
    expect(screen.getByLabelText(/switch to dark mode/i)).toBeInTheDocument()
  })

  it('toggles locale and updates button text', () => {
    render(<Sidebar {...defaultProps} />)

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
    render(<Sidebar {...defaultProps} />)

    // Find logout button (German locale is default)
    const logoutButton = screen.getByLabelText(/sitzung beenden/i)
    fireEvent.click(logoutButton)

    expect(mockOnLogout).toHaveBeenCalled()
  })

  it('shows online status dot with proper aria-label', () => {
    render(<Sidebar {...defaultProps} />)

    // Should have status dot with aria-label
    const statusDot = screen.getByRole('status', { name: /online/i })
    expect(statusDot).toBeInTheDocument()
    expect(statusDot).toHaveAttribute('aria-label', 'Online')
  })


  it('shows guest name, local counters and no points in guest mode', () => {
    mockUseAuth.mockReturnValue(
      authValue({ user: null, isGuest: true, guestStats: { correct_count: 3, incorrect_count: 1 } }),
    )
    render(<Sidebar {...defaultProps} />)

    expect(screen.getByText('Gast')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('–')).toBeInTheDocument()

    const exitButton = screen.getByRole('button', { name: 'Gastmodus beenden' })
    fireEvent.click(exitButton)
    expect(mockOnLogout).toHaveBeenCalled()
  })
})
