import { render, screen, fireEvent } from '../../../src/test-utils.tsx'
import HeaderToolbar from '../../../src/components/header/HeaderToolbar.tsx'
import { authValue, testUser } from '../../helpers/auth.ts'

const mockUseAuth = vi.hoisted(() => vi.fn())
vi.mock('../../../src/contexts/AuthContext.tsx', () => ({ useAuth: mockUseAuth }))

describe('HeaderToolbar', () => {
  let onLogout: ReturnType<typeof vi.fn<() => void>>

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockUseAuth.mockReturnValue(authValue())
    onLogout = vi.fn()
  })

  it('shows theme, language, account and logout from left to right', () => {
    render(<HeaderToolbar onLogout={onLogout} />)

    const toolbar = screen.getByRole('toolbar', { name: 'Einstellungen' })
    const labels = Array.from(toolbar.querySelectorAll('button')).map((button) =>
      button.getAttribute('aria-label'),
    )
    expect(labels).toEqual(['Switch to light mode', 'Switch to English', 'Konto', 'Ausloggen'])
  })

  it('toggles theme and language', () => {
    render(<HeaderToolbar onLogout={onLogout} />)

    fireEvent.click(screen.getByLabelText(/switch to light mode/i))
    expect(screen.getByLabelText(/switch to dark mode/i)).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText(/switch to english/i))
    expect(screen.getByText('DE')).toBeInTheDocument()
    expect(screen.getByLabelText(/auf deutsch wechseln/i)).toBeInTheDocument()
  })

  it('calls onLogout from the logout button', () => {
    render(<HeaderToolbar onLogout={onLogout} />)

    fireEvent.click(screen.getByRole('button', { name: 'Ausloggen' }))
    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it('opens the account menu with name and email and closes it on Escape', () => {
    render(<HeaderToolbar onLogout={onLogout} />)
    const trigger = screen.getByRole('button', { name: 'Konto' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(testUser.username)).toBeInTheDocument()
    expect(screen.getByText(testUser.email)).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(testUser.email)).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('closes the account menu on a click outside', () => {
    render(<HeaderToolbar onLogout={onLogout} />)
    fireEvent.click(screen.getByRole('button', { name: 'Konto' }))
    expect(screen.getByText(testUser.email)).toBeInTheDocument()

    fireEvent.mouseDown(document.body)
    expect(screen.queryByText(testUser.email)).not.toBeInTheDocument()
  })

  it('keeps the account menu open on a click inside it', () => {
    render(<HeaderToolbar onLogout={onLogout} />)
    fireEvent.click(screen.getByRole('button', { name: 'Konto' }))

    fireEvent.mouseDown(screen.getByText(testUser.email))
    expect(screen.getByText(testUser.email)).toBeInTheDocument()
  })

  it('offers "create account" to a guest and labels logout as leaving guest mode', () => {
    const auth = authValue({ user: null, isGuest: true, guestStats: { correct_count: 0, incorrect_count: 0 } })
    mockUseAuth.mockReturnValue(auth)
    render(<HeaderToolbar onLogout={onLogout} />)

    expect(screen.getByRole('button', { name: 'Gastmodus beenden' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Konto' }))
    expect(screen.getByText(/Du nutzt die App als Gast/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Konto erstellen' }))

    expect(auth.leaveGuest).toHaveBeenCalledWith('register')
  })
})
