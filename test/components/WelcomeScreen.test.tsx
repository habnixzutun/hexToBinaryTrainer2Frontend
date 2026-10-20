import { userEvent } from '@testing-library/user-event'
import { render, screen, waitFor } from '../../src/test-utils.tsx'
import WelcomeScreen from '../../src/components/WelcomeScreen.tsx'
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

const VALID_PASSWORD = 'Test1234!'

describe('WelcomeScreen', () => {
  let auth: ReturnType<typeof authValue>

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    auth = authValue({ user: null })
    mockUseAuth.mockReturnValue(auth)
  })

  it('has exactly one main landmark rendered as <main>', () => {
    render(<WelcomeScreen />)

    const mainElements = screen.getAllByRole('main')
    expect(mainElements).toHaveLength(1)
    expect(mainElements[0]?.tagName).toBe('MAIN')
  })

  it('shows the login form by default', () => {
    render(<WelcomeScreen />)

    expect(screen.getByRole('heading', { name: 'Willkommen zurück' })).toBeInTheDocument()
    expect(screen.getByRole('form', { name: 'Anmelden' })).toBeInTheDocument()
    expect(screen.getByLabelText('E-Mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Passwort')).toBeInTheDocument()
  })

  describe('login', () => {
    it('shows validation errors and does not call login for empty fields', async () => {
      const user = userEvent.setup()
      render(<WelcomeScreen />)

      await user.click(screen.getByRole('button', { name: 'Anmelden' }))

      expect(await screen.findByText('E-Mail ist erforderlich')).toBeInTheDocument()
      expect(screen.getByText('Passwort ist erforderlich')).toBeInTheDocument()
      expect(screen.getByLabelText('E-Mail')).toHaveAttribute('aria-invalid', 'true')
      expect(auth.login).not.toHaveBeenCalled()
    })

    it('calls login with email and password', async () => {
      const user = userEvent.setup()
      render(<WelcomeScreen />)

      await user.type(screen.getByLabelText('E-Mail'), 'alice@example.com')
      await user.type(screen.getByLabelText('Passwort'), VALID_PASSWORD)
      await user.click(screen.getByRole('button', { name: 'Anmelden' }))

      await waitFor(() => {
        expect(auth.login).toHaveBeenCalledWith({
          email: 'alice@example.com',
          password: VALID_PASSWORD,
        })
      })
    })

    it('shows the backend error when login fails', async () => {
      vi.mocked(auth.login).mockRejectedValue(new Error('Invalid credentials.'))
      const user = userEvent.setup()
      render(<WelcomeScreen />)

      await user.type(screen.getByLabelText('E-Mail'), 'alice@example.com')
      await user.type(screen.getByLabelText('Passwort'), 'wrong')
      await user.click(screen.getByRole('button', { name: 'Anmelden' }))

      expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials.')
    })
  })

  describe('register', () => {
    it('switches to the register form and back', async () => {
      const user = userEvent.setup()
      render(<WelcomeScreen />)

      await user.click(screen.getByRole('button', { name: /noch kein konto/i }))
      expect(screen.getByRole('heading', { name: 'Konto erstellen' })).toBeInTheDocument()
      expect(screen.getByLabelText('Benutzername')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /bereits ein konto/i }))
      expect(screen.getByRole('heading', { name: 'Willkommen zurück' })).toBeInTheDocument()
    })

    it('shows an error when the passwords do not match', async () => {
      const user = userEvent.setup()
      render(<WelcomeScreen />)

      await user.click(screen.getByRole('button', { name: /noch kein konto/i }))
      await user.type(screen.getByLabelText('E-Mail'), 'alice@example.com')
      await user.type(screen.getByLabelText('Benutzername'), 'alice')
      await user.type(screen.getByLabelText('Passwort'), VALID_PASSWORD)
      await user.type(screen.getByLabelText('Passwort bestätigen'), 'Other1234!')
      await user.click(screen.getByRole('button', { name: 'Konto erstellen' }))

      expect(await screen.findByText('Passwörter stimmen nicht überein')).toBeInTheDocument()
      expect(auth.register).not.toHaveBeenCalled()
    })

    it('registers and shows the verify-email screen with the address', async () => {
      const user = userEvent.setup()
      render(<WelcomeScreen />)

      await user.click(screen.getByRole('button', { name: /noch kein konto/i }))
      await user.type(screen.getByLabelText('E-Mail'), 'alice@example.com')
      await user.type(screen.getByLabelText('Benutzername'), 'alice')
      await user.type(screen.getByLabelText('Passwort'), VALID_PASSWORD)
      await user.type(screen.getByLabelText('Passwort bestätigen'), VALID_PASSWORD)
      await user.click(screen.getByRole('button', { name: 'Konto erstellen' }))

      // Password confirmation is client-side only and not sent to the backend
      await waitFor(() => {
        expect(auth.register).toHaveBeenCalledWith({
          email: 'alice@example.com',
          username: 'alice',
          password: VALID_PASSWORD,
        })
      })
      expect(await screen.findByRole('heading', { name: 'E-Mail bestätigen' })).toBeInTheDocument()
      expect(screen.getByText('alice@example.com')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /zurück zur anmeldung/i }))
      expect(screen.getByRole('heading', { name: 'Willkommen zurück' })).toBeInTheDocument()
    })
  })

  it('toggles theme and updates aria-label', async () => {
    const user = userEvent.setup()
    render(<WelcomeScreen />)

    // Default theme is dark → shows "Switch to light mode"
    await user.click(screen.getByLabelText(/switch to light mode/i))
    expect(screen.getByLabelText(/switch to dark mode/i)).toBeInTheDocument()

    await user.click(screen.getByLabelText(/switch to dark mode/i))
    expect(screen.getByLabelText(/switch to light mode/i)).toBeInTheDocument()
  })

  it('toggles locale and translates the login screen', async () => {
    const user = userEvent.setup()
    render(<WelcomeScreen />)

    // Initially German locale: button shows "EN"
    expect(screen.getByText('EN')).toBeInTheDocument()

    await user.click(screen.getByLabelText(/switch to english/i))

    expect(screen.getByText('DE')).toBeInTheDocument()
    expect(screen.getByLabelText(/auf deutsch wechseln/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(screen.getByRole('form', { name: 'Login' })).toBeInTheDocument()
  })

  it('has a settings toolbar', () => {
    render(<WelcomeScreen />)

    expect(screen.getByRole('toolbar', { name: /settings/i })).toBeInTheDocument()
  })
})
