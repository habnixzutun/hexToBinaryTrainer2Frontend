import { render, screen, fireEvent, waitFor } from '../test-utils'
import UnicodeTrainer from './UnicodeTrainer'
import { api } from '../services/api'

// Mock the api module
vi.mock('../services/api', () => ({
  api: {
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

const mockUser = { name: 'TestUser', correct: 5, incorrect: 2, points: 50 }

describe('UnicodeTrainer', () => {
  let mockOnUpdate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    mockOnUpdate = vi.fn()

    // Mock Math.random for deterministic questions
    // With bytes=1, range [0x0000, 0x007F], random=0.5 → cp=64 (0x40='@')
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    // Setup default API mock responses
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

  it('renders without crashing and shows initial state', () => {
    render(<UnicodeTrainer user={mockUser} onUpdate={mockOnUpdate} />)

    // Should render the trainer interface
    expect(screen.getByRole('region', { name: /unicode trainer/i })).toBeInTheDocument()

    // Should show 4 byte tabs
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(4)

    // 1-byte tab should be selected
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')

    // Should show question U+0040 (with random=0.5)
    expect(screen.getByText('U+0040')).toBeInTheDocument()

    // Input should be empty
    const input = screen.getByLabelText(/utf-8 binary answer/i)
    expect(input).toHaveValue('')

    // Submit button should be disabled (empty answer)
    const submitButton = screen.getByRole('button', { name: /check answer/i })
    expect(submitButton).toBeDisabled()
  })

  it('filters input to only allow 0 and 1 characters', () => {
    render(<UnicodeTrainer user={mockUser} onUpdate={mockOnUpdate} />)

    const input = screen.getByLabelText(/utf-8 binary answer/i)

    // Type invalid characters mixed with valid ones
    fireEvent.change(input, { target: { value: '01ab01' } })

    // Should filter to only 0 and 1
    expect(input).toHaveValue('0101')
  })

  it('handles correct answer flow with API call and feedback', async () => {
    render(<UnicodeTrainer user={mockUser} onUpdate={mockOnUpdate} />)

    const input = screen.getByLabelText(/utf-8 binary answer/i)
    const submitButton = screen.getByRole('button', { name: /check answer/i })

    // Type correct answer for U+0040 (cp=64) → "01000000"
    fireEvent.change(input, { target: { value: '01000000' } })

    // Submit button should now be enabled
    expect(submitButton).not.toBeDisabled()

    // Click submit
    fireEvent.click(submitButton)

    // Should show correct feedback
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText(/correct/i)).toBeInTheDocument()
    })

    // Should call API with correct parameters (bytes * 8 = 1 * 8 = 8)
    expect(api.updateUserCorrect).toHaveBeenCalledWith('TestUser', 8)

    // Should call onUpdate with new user data
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith({
        name: 'TestUser',
        correct: 6,
        incorrect: 2,
        points: 60,
      })
    })
  })

  it('handles wrong answer flow with API call and feedback', async () => {
    render(<UnicodeTrainer user={mockUser} onUpdate={mockOnUpdate} />)

    const input = screen.getByLabelText(/utf-8 binary answer/i)
    const submitButton = screen.getByRole('button', { name: /check answer/i })

    // Type wrong answer
    fireEvent.change(input, { target: { value: '11111111' } })

    // Click submit
    fireEvent.click(submitButton)

    // Should show wrong feedback with alert role
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
      // German locale is default, so check for "Versuch's nochmal!"
      expect(screen.getByText(/versuch's nochmal/i)).toBeInTheDocument()
    })

    // Should call API with correct parameters (bytes * 8 = 1 * 8 = 8)
    expect(api.updateUserIncorrect).toHaveBeenCalledWith('TestUser', 8)

    // Should call onUpdate with new user data
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith({
        name: 'TestUser',
        correct: 5,
        incorrect: 3,
        points: 50,
      })
    })
  })

  it('submits answer when Enter key is pressed', async () => {
    render(<UnicodeTrainer user={mockUser} onUpdate={mockOnUpdate} />)

    const input = screen.getByLabelText(/utf-8 binary answer/i)

    // Type correct answer
    fireEvent.change(input, { target: { value: '01000000' } })

    // Press Enter
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

    // Should trigger submit and call API
    await waitFor(() => {
      expect(api.updateUserCorrect).toHaveBeenCalledWith('TestUser', 8)
    })
  })

  it('switches byte tabs and generates new question in correct range', async () => {
    render(<UnicodeTrainer user={mockUser} onUpdate={mockOnUpdate} />)

    // Click 3-byte tab
    const threeByteTab = screen.getByRole('tab', { name: /3 bytes/i })
    fireEvent.click(threeByteTab)

    // Should update aria-selected
    expect(threeByteTab).toHaveAttribute('aria-selected', 'true')

    // Should generate new question in 3-byte range [0x0800, 0xFFFF]
    // With random=0.5: cp = floor(0.5 * (0xFFFF - 0x800 + 1)) + 0x800
    // = floor(0.5 * 63488) + 2048 = 31744 + 2048 = 33792 = 0x8400
    await waitFor(() => {
      expect(screen.getByText('U+8400')).toBeInTheDocument()
    })
  })

  it('handles API failure gracefully with error feedback', async () => {
    // Mock API to reject
    vi.mocked(api.updateUserCorrect).mockRejectedValue(new Error('Network error'))

    render(<UnicodeTrainer user={mockUser} onUpdate={mockOnUpdate} />)

    const input = screen.getByLabelText(/utf-8 binary answer/i)
    const submitButton = screen.getByRole('button', { name: /check answer/i })

    // Type correct answer
    fireEvent.change(input, { target: { value: '01000000' } })

    // Click submit
    fireEvent.click(submitButton)

    // Should show error feedback
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/error saving result/i)).toBeInTheDocument()
    })

    // Should NOT call onUpdate
    expect(mockOnUpdate).not.toHaveBeenCalled()
  })

  it('has proper accessibility attributes', () => {
    render(<UnicodeTrainer user={mockUser} onUpdate={mockOnUpdate} />)

    // Check region has aria-label
    expect(screen.getByRole('region', { name: /unicode trainer/i })).toBeInTheDocument()

    // Check tablist has aria-label
    expect(screen.getByRole('tablist', { name: /byte selection/i })).toBeInTheDocument()

    // Check input has aria-describedby linking to help text
    const input = screen.getByLabelText(/utf-8 binary answer/i)
    expect(input).toHaveAttribute('aria-describedby', 'utf8-help')

    // Check help text exists
    const helpText = screen.getByText(/enter the utf-8 binary representation/i)
    expect(helpText).toBeInTheDocument()
    expect(helpText).toHaveAttribute('id', 'utf8-help')

    // Check question area has aria-live for screen readers
    const questionArea = screen.getByText('U+0040').closest('[aria-live]')
    expect(questionArea).toHaveAttribute('aria-live', 'polite')
    expect(questionArea).toHaveAttribute('aria-atomic', 'true')
  })
})
