import { render, screen, fireEvent } from '../../src/test-utils.tsx'
import WelcomeScreen from '../../src/components/WelcomeScreen.tsx'

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

describe('WelcomeScreen', () => {
  let mockOnJoin: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    mockOnJoin = vi.fn()
  })

  it('has only one main landmark', () => {
    render(<WelcomeScreen onJoin={mockOnJoin} />)

    // Should have exactly one main element
    const mainElements = screen.getAllByRole('main')
    expect(mainElements).toHaveLength(1)
  })

  it('does not have role="main" on outer div', () => {
    render(<WelcomeScreen onJoin={mockOnJoin} />)

    // If there's a main, it should be the <main> element, not a div with role="main"
    const mainElement = screen.getByRole('main')
    expect(mainElement.tagName).toBe('MAIN')
  })

  it('disables submit button when name is shorter than 2 characters', () => {
    render(<WelcomeScreen onJoin={mockOnJoin} />)

    const submitButton = screen.getByRole('button', { name: /los geht's/i })
    const nameInput = screen.getByLabelText(/(username|benutzername)/i)

    // Initially disabled (empty name)
    expect(submitButton).toBeDisabled()

    // Type single character → still disabled
    fireEvent.change(nameInput, { target: { value: 'A' } })
    expect(submitButton).toBeDisabled()

    // Type second character → enabled
    fireEvent.change(nameInput, { target: { value: 'Al' } })
    expect(submitButton).not.toBeDisabled()
  })

  it('calls onJoin with trimmed name on form submit', () => {
    render(<WelcomeScreen onJoin={mockOnJoin} />)

    const nameInput = screen.getByLabelText(/(username|benutzername)/i)
    const submitButton = screen.getByRole('button', { name: /los geht's/i })

    // Type name with surrounding whitespace
    fireEvent.change(nameInput, { target: { value: '  Alice  ' } })
    fireEvent.click(submitButton)

    // Should call onJoin with trimmed name
    expect(mockOnJoin).toHaveBeenCalledWith('Alice')
    expect(mockOnJoin).toHaveBeenCalledTimes(1)
  })

  it('shows validation error with role=alert for short names', () => {
    render(<WelcomeScreen onJoin={mockOnJoin} />)

    const nameInput = screen.getByLabelText(/(username|benutzername)/i)

    // No error initially (empty input)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    // Type single character → error shown
    fireEvent.change(nameInput, { target: { value: 'A' } })
    expect(screen.getByRole('alert')).toBeInTheDocument()
    // German locale default: "Mindestens 2 Zeichen erforderlich"
    expect(screen.getByText(/mindestens 2 zeichen/i)).toBeInTheDocument()

    // Input should be marked invalid
    expect(nameInput).toHaveAttribute('aria-invalid', 'true')

    // Type valid name → error disappears
    fireEvent.change(nameInput, { target: { value: 'Alice' } })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(nameInput).toHaveAttribute('aria-invalid', 'false')
  })

  it('does not call onJoin when submitting invalid name via Enter key', () => {
    render(<WelcomeScreen onJoin={mockOnJoin} />)

    const nameInput = screen.getByLabelText(/(username|benutzername)/i)

    // Type single character and press Enter
    fireEvent.change(nameInput, { target: { value: 'A' } })
    fireEvent.keyDown(nameInput, { key: 'Enter', code: 'Enter' })

    // onJoin should NOT be called (name too short)
    expect(mockOnJoin).not.toHaveBeenCalled()
  })

  it('toggles theme and updates aria-label', () => {
    render(<WelcomeScreen onJoin={mockOnJoin} />)

    // Default theme is dark → shows "Switch to light mode"
    const themeButton = screen.getByLabelText(/switch to light mode/i)

    // Click to toggle to light
    fireEvent.click(themeButton)
    expect(screen.getByLabelText(/switch to dark mode/i)).toBeInTheDocument()

    // Click to toggle back to dark
    fireEvent.click(screen.getByLabelText(/switch to dark mode/i))
    expect(screen.getByLabelText(/switch to light mode/i)).toBeInTheDocument()
  })

  it('toggles locale and translates validation error', () => {
    render(<WelcomeScreen onJoin={mockOnJoin} />)

    // Initially German locale: button shows "EN"
    const localeButton = screen.getByLabelText(/switch to english/i)
    expect(screen.getByText('EN')).toBeInTheDocument()

    // Trigger German validation error
    const nameInput = screen.getByLabelText(/(username|benutzername)/i)
    fireEvent.change(nameInput, { target: { value: 'A' } })
    expect(screen.getByText(/mindestens 2 zeichen/i)).toBeInTheDocument()

    // Switch to English
    fireEvent.click(localeButton)

    // Button now shows "DE" with German aria-label
    expect(screen.getByText('DE')).toBeInTheDocument()
    expect(screen.getByLabelText(/auf deutsch wechseln/i)).toBeInTheDocument()

    // Validation error now in English (match full text to exclude sr-only help)
    expect(screen.getByText(/minimum 2 characters required/i)).toBeInTheDocument()
  })

  it('has proper form accessibility attributes', () => {
    render(<WelcomeScreen onJoin={mockOnJoin} />)

    // Form has aria-label
    expect(screen.getByRole('form', { name: /login form/i })).toBeInTheDocument()

    // Input is required and described by help text
    const nameInput = screen.getByLabelText(/(username|benutzername)/i)
    expect(nameInput).toHaveAttribute('aria-required', 'true')
    expect(nameInput).toHaveAttribute('aria-describedby', 'username-help')

    // Help text exists
    const helpText = screen.getByText(/enter your username/i)
    expect(helpText).toBeInTheDocument()
    expect(helpText).toHaveAttribute('id', 'username-help')

    // Settings toolbar exists
    expect(screen.getByRole('toolbar', { name: /settings/i })).toBeInTheDocument()
  })
})
