import { render, screen } from '../test-utils'
import WelcomeScreen from './WelcomeScreen'

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
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  it('has only one main landmark', () => {
    const mockOnJoin = vi.fn()
    render(<WelcomeScreen onJoin={mockOnJoin} />)

    // Should have exactly one main element
    const mainElements = screen.getAllByRole('main')
    expect(mainElements).toHaveLength(1)
  })

  it('does not have role="main" on outer div', () => {
    const mockOnJoin = vi.fn()
    render(<WelcomeScreen onJoin={mockOnJoin} />)

    // The outer div should not have role="main"
    const outerDiv = screen.queryByRole('main', { hidden: true })
    // If there's a main, it should be the <main> element, not a div with role="main"
    const mainElement = screen.getByRole('main')
    expect(mainElement.tagName).toBe('MAIN')
  })
})
