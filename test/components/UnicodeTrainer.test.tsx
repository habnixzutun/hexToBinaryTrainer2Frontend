import { render, screen, fireEvent, waitFor, act } from '../../src/test-utils.tsx'
import UnicodeTrainer from '../../src/components/UnicodeTrainer.tsx'
import { gameApi, type GameAnswerResponse } from '../../src/services/api.ts'
import { ApiError } from '../../src/services/apiError.ts'
import { BITS_PER_BYTE, UNICODE_BYTE_OPTIONS, bitsForBytes } from '../../src/constants/gameModes.ts'

// Mock the game API
vi.mock('../../src/services/api.ts', () => ({
  gameApi: {
    submitAnswer: vi.fn(),
    getLeaderboard: vi.fn(),
  },
}))

const mockSubmitAnswer = vi.mocked(gameApi.submitAnswer)

const answer: GameAnswerResponse = {
  xp_delta: 64,
  total_xp: 1320,
  level: 6,
  xp_in_level: 0,
  xp_required_for_next_level: 760,
  current_streak: 4,
  best_streak: 7,
  correct_count: 42,
  incorrect_count: 5,
  newly_unlocked: [],
}

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

/** bytes=1 + Math.random()=0.5 -> cp 64 (U+0040 '@') -> UTF-8 '01000000'. */
const ONE_BYTE_ANSWER = '01000000'
/** bytes=2 + Math.random()=0.5 -> cp 1088 (U+0440) -> UTF-8 16 bits. */
const TWO_BYTE_ANSWER = '1101000110000000'

const byteCases: Array<[number]> = UNICODE_BYTE_OPTIONS.map((bytes) => [bytes])

describe('UnicodeTrainer', () => {
  let mockOnUpdate: ReturnType<typeof vi.fn<() => void>>

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    mockOnUpdate = vi.fn()

    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    mockSubmitAnswer.mockResolvedValue(answer)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  const typeAnswer = (value: string): void => {
    fireEvent.change(screen.getByRole('textbox'), { target: { value } })
  }

  const pressCheck = (): void => {
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
  }

  it('renders without crashing and shows initial state', () => {
    render(<UnicodeTrainer onUpdate={mockOnUpdate} />)

    expect(screen.getByRole('region', { name: /unicode trainer/i })).toBeInTheDocument()

    expect(screen.getByRole('tab', { name: '1 Byte' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '2 Bytes' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '3 Bytes' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '4 Bytes' })).toBeInTheDocument()
  })

  it('filters input to only allow 0 and 1 characters', () => {
    render(<UnicodeTrainer onUpdate={mockOnUpdate} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '01ab01' } })
    expect(input).toHaveValue('0101')
  })

  it('handles correct answer flow with API call and feedback', async () => {
    render(<UnicodeTrainer onUpdate={mockOnUpdate} />)

    typeAnswer(ONE_BYTE_ANSWER)
    expect(screen.getByRole('button', { name: /check answer/i })).not.toBeDisabled()
    pressCheck()

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText(/Richtig/i)).toBeInTheDocument()
    })

    // OQ-7: the byte selector stays the UI unit, the wire always carries bits.
    await waitFor(() => {
      expect(mockSubmitAnswer).toHaveBeenCalledWith('unicode', 8, true)
    })

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledTimes(1)
    })
  })

  it('handles wrong answer flow with API call and feedback', async () => {
    render(<UnicodeTrainer onUpdate={mockOnUpdate} />)

    typeAnswer('00000000')
    pressCheck()

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Falsch/i)
    })
    await waitFor(() => {
      expect(mockSubmitAnswer).toHaveBeenCalledWith('unicode', 8, false)
    })

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledTimes(1)
    })
  })

  it('submits answer when Enter key is pressed', async () => {
    render(<UnicodeTrainer onUpdate={mockOnUpdate} />)

    const input = screen.getByRole('textbox')
    typeAnswer(ONE_BYTE_ANSWER)
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

    await waitFor(() => {
      expect(mockSubmitAnswer).toHaveBeenCalledWith('unicode', 8, true)
    })
  })

  it('switches byte tabs and generates new question in correct range', () => {
    render(<UnicodeTrainer onUpdate={mockOnUpdate} />)

    const twoBytesTab = screen.getByRole('tab', { name: '2 Bytes' })
    fireEvent.click(twoBytesTab)

    expect(twoBytesTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText(/U\+[0-9A-F]{4}/i)).toBeInTheDocument()
  })

  it.each(byteCases)(
    'sends %i bits for the %i-byte tier (OQ-7)',
    async (bytes) => {
      render(<UnicodeTrainer onUpdate={mockOnUpdate} bytes={bytes} />)

      // The answer length is irrelevant for this assertion — only the unit is.
      typeAnswer('00000000')
      pressCheck()

      await waitFor(() => {
        expect(mockSubmitAnswer).toHaveBeenCalledWith('unicode', bitsForBytes(bytes), false)
      })
      expect(bitsForBytes(bytes)).toBe(bytes * BITS_PER_BYTE)
    }
  )

  it('sends 16 bits for the two-byte tier', async () => {
    render(<UnicodeTrainer onUpdate={mockOnUpdate} />)

    fireEvent.click(screen.getByRole('tab', { name: '2 Bytes' }))
    typeAnswer(TWO_BYTE_ANSWER)
    pressCheck()

    await waitFor(() => {
      expect(mockSubmitAnswer).toHaveBeenCalledWith('unicode', 16, true)
    })
  })

  it('handles API failure gracefully with error feedback', async () => {
    mockSubmitAnswer.mockRejectedValue(new TypeError('Network error'))

    render(<UnicodeTrainer onUpdate={mockOnUpdate} />)

    typeAnswer(ONE_BYTE_ANSWER)
    pressCheck()

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Fehler beim Speichern/i)
    })

    expect(mockOnUpdate).not.toHaveBeenCalled()
  })

  it('blocks further submissions during the 429 backoff (AC-3)', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    mockSubmitAnswer.mockRejectedValue(
      new ApiError({ status: 429, detail: 'Too many answers.', retryAfterSeconds: 25 })
    )

    render(<UnicodeTrainer onUpdate={mockOnUpdate} />)

    typeAnswer(ONE_BYTE_ANSWER)
    await act(async () => {
      pressCheck()
    })

    expect(screen.getByRole('alert')).toHaveTextContent(/25/)
    const button = screen.getByRole('button', { name: /check answer/i })
    expect(button).toBeDisabled()
    expect(screen.getAllByRole('alert')).toHaveLength(1)

    await act(async () => {
      vi.advanceTimersByTime(25_000)
    })
    expect(button).not.toBeDisabled()
    expect(mockSubmitAnswer).toHaveBeenCalledTimes(1)
  })

  it('has proper accessibility attributes', () => {
    render(<UnicodeTrainer onUpdate={mockOnUpdate} />)

    expect(screen.getByRole('region', { name: /unicode trainer/i })).toBeInTheDocument()
    expect(screen.getByRole('tablist', { name: /byte selection/i })).toBeInTheDocument()

    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('aria-label', 'UTF-8 binary answer')
  })
})
