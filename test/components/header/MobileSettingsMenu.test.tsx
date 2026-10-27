import { render, screen, fireEvent } from '../../../src/test-utils.tsx'
import MobileSettingsMenu from '../../../src/components/header/MobileSettingsMenu.tsx'
import { authValue, testUser } from '../../helpers/auth.ts'

const mockUseAuth = vi.hoisted(() => vi.fn())
vi.mock('../../../src/contexts/AuthContext.tsx', () => ({ useAuth: mockUseAuth }))

describe('MobileSettingsMenu', () => {
  let onLogout: ReturnType<typeof vi.fn<() => void>>

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockUseAuth.mockReturnValue(authValue())
    onLogout = vi.fn()
  })

  function openMenu(): HTMLElement {
    const trigger = screen.getByRole('button', { name: 'Einstellungen' })
    fireEvent.click(trigger)
    return trigger
  }

  it('is closed by default and opens with the account section first', () => {
    render(<MobileSettingsMenu onLogout={onLogout} />)
    expect(screen.queryByText(testUser.email)).not.toBeInTheDocument()

    const trigger = openMenu()

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(testUser.username)).toBeInTheDocument()
    expect(screen.getByText(testUser.email)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Heller Modus' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ausloggen' })).toBeInTheDocument()
  })

  it('switches the language and closes after the selection', () => {
    render(<MobileSettingsMenu onLogout={onLogout} />)
    openMenu()

    fireEvent.click(screen.getByRole('button', { name: 'English' }))

    const trigger = screen.getByRole('button', { name: 'Settings' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('switches the theme and closes after the selection', () => {
    render(<MobileSettingsMenu onLogout={onLogout} />)
    openMenu()
    fireEvent.click(screen.getByRole('button', { name: 'Heller Modus' }))
    expect(screen.queryByRole('button', { name: 'Heller Modus' })).not.toBeInTheDocument()

    openMenu()
    expect(screen.getByRole('button', { name: 'Dunkler Modus' })).toBeInTheDocument()
  })

  it('calls onLogout and closes', () => {
    render(<MobileSettingsMenu onLogout={onLogout} />)
    const trigger = openMenu()

    fireEvent.click(screen.getByRole('button', { name: 'Ausloggen' }))

    expect(onLogout).toHaveBeenCalledTimes(1)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes on Escape and returns focus to the gear button', () => {
    render(<MobileSettingsMenu onLogout={onLogout} />)
    const trigger = openMenu()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveFocus()
  })

  it('shows the guest hint, "create account" and "leave guest mode" for a guest', () => {
    const auth = authValue({ user: null, isGuest: true, guestStats: { correct_count: 0, incorrect_count: 0 } })
    mockUseAuth.mockReturnValue(auth)
    render(<MobileSettingsMenu onLogout={onLogout} />)
    openMenu()

    expect(screen.getByText(/Du nutzt die App als Gast/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gastmodus beenden' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Konto erstellen' }))
    expect(auth.leaveGuest).toHaveBeenCalledWith('register')
  })
})
