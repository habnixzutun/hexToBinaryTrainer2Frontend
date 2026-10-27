import { render, screen, fireEvent, waitFor } from '../../src/test-utils.tsx'
import HexBinTrainer from '../../src/components/HexBinTrainer.tsx'
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

describe('HexBinTrainer', () => {
  let mockOnUpdate: ReturnType<typeof vi.fn<() => void>>

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    mockOnUpdate = vi.fn()

    // Mock Math.random for deterministic questions
    // With bits=8, range [15, 255], random=0.5 → value = floor(0.5 * 241) + 15 = 135 = 0x87
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

  it('renders without crashing', () => {
    render(<HexBinTrainer onUpdate={mockOnUpdate} />)

    // Should render the trainer interface
    expect(screen.getByRole('region', { name: /hex\/binary trainer/i })).toBeInTheDocument()
  })

  it('shows bit selection tabs with 8 bits selected by default', () => {
    render(<HexBinTrainer onUpdate={mockOnUpdate} />)

    // In jsdom (no lg breakpoint) the tab bar is hidden via CSS, but still in the DOM
    expect(screen.getByRole('tablist', { name: /bit selection/i })).toBeInTheDocument()
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(4)

    for (const b of [4, 16, 32]) {
      expect(screen.getByRole('tab', { name: `${b} Bits` })).toHaveAttribute('aria-selected', 'false')
    }
    expect(screen.getByRole('tab', { name: '8 Bits' })).toHaveAttribute('aria-selected', 'true')
  })

  it('generates deterministic question with mocked random', () => {
    render(<HexBinTrainer onUpdate={mockOnUpdate} />)

    // With bits=8, random=0.5: value = 135 = 0x87
    // Default mode is HexToBin, so question shows hex "87"
    expect(screen.getByText('87')).toBeInTheDocument()
  })

  it('filters input based on target format', () => {
    render(<HexBinTrainer onUpdate={mockOnUpdate} />)

    const input = screen.getByRole('textbox')

    // Default mode is HexToBin, so input should only accept 0 and 1
    fireEvent.change(input, { target: { value: '01ab01' } })
    expect(input).toHaveValue('0101')
  })

  it('handles correct answer flow with API call and feedback', async () => {
    render(<HexBinTrainer onUpdate={mockOnUpdate} />)

    const input = screen.getByRole('textbox')
    const submitButton = screen.getByRole('button', { name: /check answer/i })

    // Type correct answer for hex "87" → binary "10000111"
    fireEvent.change(input, { target: { value: '10000111' } })

    // Submit button should be enabled
    expect(submitButton).not.toBeDisabled()

    // Click submit
    fireEvent.click(submitButton)

    // Should show correct feedback
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText(/Richtig/i)).toBeInTheDocument()
    })

    // Should call API with the number of bits
    expect(mockSubmitCorrect).toHaveBeenCalledWith(8)
    expect(mockSubmitIncorrect).not.toHaveBeenCalled()

    // Should notify parent so it can refresh user stats
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledTimes(1)
    })
  })

  it('handles wrong answer flow with API call and feedback', async () => {
    render(<HexBinTrainer onUpdate={mockOnUpdate} />)

    const input = screen.getByRole('textbox')
    const submitButton = screen.getByRole('button', { name: /check answer/i })

    // Type wrong answer
    fireEvent.change(input, { target: { value: '11111111' } })

    // Click submit
    fireEvent.click(submitButton)

    // Should show wrong feedback with alert role
    await waitFor(() => {
      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
      // German locale is default, so check for "Falsch"
      expect(alert).toHaveTextContent(/Falsch/i)
    })

    // Should call API with the number of bits
    expect(mockSubmitIncorrect).toHaveBeenCalledWith(8)
    expect(mockSubmitCorrect).not.toHaveBeenCalled()

    // Should notify parent so it can refresh user stats
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledTimes(1)
    })
  })

  it('handles API failure gracefully with error feedback', async () => {
    // Mock API to reject
    mockSubmitCorrect.mockRejectedValue(new Error('Network error'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<HexBinTrainer onUpdate={mockOnUpdate} />)

    const input = screen.getByRole('textbox')
    const submitButton = screen.getByRole('button', { name: /check answer/i })

    // Type correct answer
    fireEvent.change(input, { target: { value: '10000111' } })

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

  it('submits answer when Enter key is pressed', async () => {
    render(<HexBinTrainer onUpdate={mockOnUpdate} />)

    const input = screen.getByRole('textbox')

    // Type correct answer
    fireEvent.change(input, { target: { value: '10000111' } })

    // Press Enter
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

    // Should trigger submit and call API
    await waitFor(() => {
      expect(mockSubmitCorrect).toHaveBeenCalledWith(8)
    })
  })

  it('uses the mode passed in from the sidebar', () => {
    render(<HexBinTrainer onUpdate={mockOnUpdate} activeMode="HexToDec" />)

    // Mode label is shown in the top bar
    expect(screen.getByLabelText('Current mode')).toHaveTextContent('Hex → Dec')

    // Question is still hex "87", but the answer is decimal now
    expect(screen.getByText('87')).toBeInTheDocument()
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '123abc' } })
    expect(input).toHaveValue('123')
  })

  it('switches bits via tab and generates a question in the new range', () => {
    render(<HexBinTrainer onUpdate={mockOnUpdate} />)

    const fourBitsTab = screen.getByRole('tab', { name: '4 Bits' })
    fireEvent.click(fourBitsTab)

    expect(fourBitsTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: '8 Bits' })).toHaveAttribute('aria-selected', 'false')

    // With bits=4, range [0, 15], random=0.5 → value = floor(0.5 * 16) + 0 = 8 = 0x8
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('reports bit changes to the parent when controlled', () => {
    const mockOnBitsChange = vi.fn()
    render(<HexBinTrainer onUpdate={mockOnUpdate} bits={8} onBitsChange={mockOnBitsChange} />)

    fireEvent.click(screen.getByRole('tab', { name: '16 Bits' }))

    expect(mockOnBitsChange).toHaveBeenCalledWith(16)
  })


  it('counts the answer locally and skips the backend in guest mode', async () => {
    const onGuestAnswer = vi.fn()
    render(<HexBinTrainer onUpdate={mockOnUpdate} onGuestAnswer={onGuestAnswer} />)

    const input = screen.getByRole('textbox')
    const submitButton = screen.getByRole('button', { name: /check answer/i })

    // Correct answer for hex "87"
    fireEvent.change(input, { target: { value: '10000111' } })
    fireEvent.click(submitButton)
    await waitFor(() => expect(screen.getByText(/Richtig/i)).toBeInTheDocument())
    expect(onGuestAnswer).toHaveBeenCalledWith(true)

    // Wrong answer
    fireEvent.change(input, { target: { value: '1' } })
    fireEvent.click(submitButton)
    await waitFor(() => expect(onGuestAnswer).toHaveBeenCalledWith(false))

    expect(mockSubmitCorrect).not.toHaveBeenCalled()
    expect(mockSubmitIncorrect).not.toHaveBeenCalled()
    expect(mockOnUpdate).not.toHaveBeenCalled()
  })
})
