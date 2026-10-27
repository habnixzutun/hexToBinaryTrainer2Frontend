import { render, screen, fireEvent, waitFor } from '../../src/test-utils.tsx'
import UnicodeTrainer from '../../src/components/UnicodeTrainer.tsx'
import { gameApi } from '../../src/services/api.ts'

// Mock the game API
vi.mock('../../src/services/api.ts', () => ({
  gameApi: {
    submitCorrect: vi.fn(),
    submitIncorrect: vi.fn(),
  },
}))

const mockSubmitCorrect = vi.mocked(gameApi.submitCorrect)
const mockSubmitIncorrect = vi.mocked(gameApi.submitIncorrect)

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

describe('UnicodeTrainer', () => {
  let mockOnUpdate: ReturnType<typeof vi.fn<() => void>>

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    mockOnUpdate = vi.fn()

    // Mock Math.random for deterministic questions
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    // Setup default API mock responses
    mockSubmitCorrect.mockResolvedValue({
      message: 'Correct answer recorded',
      user_id: 'user-1',
      correct_count: 6,
      incorrect_count: 2,
      points: 58,
    })
    mockSubmitIncorrect.mockResolvedValue({
      message: 'Incorrect answer recorded',
      user_id: 'user-1',
      correct_count: 5,
      incorrect_count: 3,
      points: 18,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders without crashing and shows initial state', () => {
    render(<UnicodeTrainer onUpdate={mockOnUpdate} />)

    // Should render the trainer interface
    expect(screen.getByRole('region', { name: /unicode trainer/i })).toBeInTheDocument()

    // Should show byte tabs
    expect(screen.getByRole('tab', { name: '1 Byte' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '2 Bytes' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '3 Bytes' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '4 Bytes' })).toBeInTheDocument()
  })

  it('filters input to only allow 0 and 1 characters', () => {
    render(<UnicodeTrainer onUpdate={mockOnUpdate} />)

    const input = screen.getByRole('textbox')

    // Type mixed input - only 0 and 1 should remain
    fireEvent.change(input, { target: { value: '01ab01' } })
    expect(input).toHaveValue('0101')
  })

  it('handles correct answer flow with API call and feedback', async () => {
    render(<UnicodeTrainer onUpdate={mockOnUpdate} />)

    const input = screen.getByRole('textbox')
    const submitButton = screen.getByRole('button', { name: /check answer/i })

    // With Math.random()=0.5 and bytes=1: cp=64 (U+0040='@'), correctAnswer='01000000'
    fireEvent.change(input, { target: { value: '01000000' } })

    // Submit button should be enabled
    expect(submitButton).not.toBeDisabled()

    // Click submit
    fireEvent.click(submitButton)

    // Should show correct feedback
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText(/Richtig/i)).toBeInTheDocument()
    })

    // Should call API with correct parameters (bytes*8 = 8)
    expect(mockSubmitCorrect).toHaveBeenCalledWith(8)

    // Should notify parent so it can refresh user stats
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledTimes(1)
    })
  })

  it('handles wrong answer flow with API call and feedback', async () => {
    render(<UnicodeTrainer onUpdate={mockOnUpdate} />)

    const input = screen.getByRole('textbox')
    const submitButton = screen.getByRole('button', { name: /check answer/i })

    // Type wrong answer (correct is '01000000')
    fireEvent.change(input, { target: { value: '00000000' } })

    // Click submit
    fireEvent.click(submitButton)

    // Should show wrong feedback with alert role
    await waitFor(() => {
      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
      expect(alert).toHaveTextContent(/Falsch/i)
    })

    // Should call API with correct parameters
    expect(mockSubmitIncorrect).toHaveBeenCalledWith(8)

    // Should notify parent so it can refresh user stats
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledTimes(1)
    })
  })

  it('submits answer when Enter key is pressed', async () => {
    render(<UnicodeTrainer onUpdate={mockOnUpdate} />)

    const input = screen.getByRole('textbox')

    // Type correct answer (cp=64 → '01000000')
    fireEvent.change(input, { target: { value: '01000000' } })

    // Press Enter
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

    // Should trigger submit and call API
    await waitFor(() => {
      expect(mockSubmitCorrect).toHaveBeenCalledWith(8)
    })
  })

  it('switches byte tabs and generates new question in correct range', () => {
    render(<UnicodeTrainer onUpdate={mockOnUpdate} />)

    // Click 2 Bytes tab
    const twoBytesTab = screen.getByRole('tab', { name: '2 Bytes' })
    fireEvent.click(twoBytesTab)

    // Should update aria-selected
    expect(twoBytesTab).toHaveAttribute('aria-selected', 'true')

    // Should show a Unicode question (U+XXXX format)
    expect(screen.getByText(/U\+[0-9A-F]{4}/i)).toBeInTheDocument()
  })

  it('handles API failure gracefully with error feedback', async () => {
    // Mock API to reject
    mockSubmitCorrect.mockRejectedValue(new Error('Network error'))

    render(<UnicodeTrainer onUpdate={mockOnUpdate} />)

    const input = screen.getByRole('textbox')
    const submitButton = screen.getByRole('button', { name: /check answer/i })

    // Type correct answer to trigger the correct path (which will fail)
    fireEvent.change(input, { target: { value: '01000000' } })

    // Click submit
    fireEvent.click(submitButton)

    // Should show error feedback
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/Fehler beim Speichern/i)).toBeInTheDocument()
    })

    // Should NOT call onUpdate
    expect(mockOnUpdate).not.toHaveBeenCalled()
  })

  it('has proper accessibility attributes', () => {
    render(<UnicodeTrainer onUpdate={mockOnUpdate} />)

    // Should have region landmark
    expect(screen.getByRole('region', { name: /unicode trainer/i })).toBeInTheDocument()

    // Should have tablist
    expect(screen.getByRole('tablist', { name: /byte selection/i })).toBeInTheDocument()

    // Should have input with label
    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('aria-label', 'UTF-8 binary answer')
  })


  it('counts the answer locally and skips the backend in guest mode', async () => {
    const onGuestAnswer = vi.fn()
    render(<UnicodeTrainer onUpdate={mockOnUpdate} onGuestAnswer={onGuestAnswer} />)

    const input = screen.getByRole('textbox')
    const submitButton = screen.getByRole('button', { name: /check answer/i })

    // cp=64 → '01000000'
    fireEvent.change(input, { target: { value: '01000000' } })
    fireEvent.click(submitButton)
    await waitFor(() => expect(onGuestAnswer).toHaveBeenCalledWith(true))

    fireEvent.change(input, { target: { value: '1' } })
    fireEvent.click(submitButton)
    await waitFor(() => expect(onGuestAnswer).toHaveBeenCalledWith(false))

    expect(mockSubmitCorrect).not.toHaveBeenCalled()
    expect(mockSubmitIncorrect).not.toHaveBeenCalled()
    expect(mockOnUpdate).not.toHaveBeenCalled()
  })
})
