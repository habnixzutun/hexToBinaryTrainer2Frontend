import { render, screen, fireEvent, waitFor } from '../../src/test-utils.tsx'
import HexBinTrainer from '../../src/components/HexBinTrainer.tsx'
import { gameApi, type GameAnswerResponse } from '../../src/services/api.ts'
import { ApiError } from '../../src/services/apiError.ts'
import { HEX_BIN_MODES, modeForDirection, type GameMode, type HexBinDirection } from '../../src/constants/gameModes.ts'

// Mock the game API — US-38 ships a single unified submit path.
vi.mock('../../src/services/api.ts', () => ({
  gameApi: {
    submitAnswer: vi.fn(),
    getLeaderboard: vi.fn(),
  },
}))

const mockSubmitAnswer = vi.mocked(gameApi.submitAnswer)

/** Server-computed economy payload; the client never derives any of these. */
const answer: GameAnswerResponse = {
  xp_delta: 32,
  total_xp: 1280,
  level: 5,
  xp_in_level: 88,
  xp_required_for_next_level: 508,
  current_streak: 2,
  best_streak: 7,
  correct_count: 41,
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

/** bits=8 + Math.random()=0.5 -> value 135 -> hex 87, bin 10000111, dec 135. */
const BIN = '10000111'
const HEX = '87'
const DEC = '135'

const directionCases: Array<[HexBinDirection, GameMode, string]> = [
  ['HexToBin', 'hex_to_bin', BIN],
  ['BinToHex', 'hex_to_bin', HEX],
  ['HexToDec', 'hex_to_dec', DEC],
  ['DecToHex', 'hex_to_dec', HEX],
  ['BinToDec', 'bin_to_dec', DEC],
  ['DecToBin', 'bin_to_dec', BIN],
]

describe('HexBinTrainer', () => {
  let mockOnUpdate: ReturnType<typeof vi.fn<() => void>>

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    mockOnUpdate = vi.fn()

    // Mock Math.random for deterministic questions
    // With bits=8, range [15, 255], random=0.5 → value = floor(0.5 * 241) + 15 = 135 = 0x87
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    mockSubmitAnswer.mockResolvedValue(answer)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const typeAnswer = (value: string): void => {
    fireEvent.change(screen.getByRole('textbox'), { target: { value } })
  }

  const pressCheck = (): void => {
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
  }

  it('renders without crashing', () => {
    render(<HexBinTrainer onUpdate={mockOnUpdate} />)

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

    typeAnswer(BIN)
    expect(screen.getByRole('button', { name: /check answer/i })).not.toBeDisabled()
    pressCheck()

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText(/Richtig/i)).toBeInTheDocument()
    })

    // The wire payload is (mode, bits, is_correct) — bits, never byte counts.
    await waitFor(() => {
      expect(mockSubmitAnswer).toHaveBeenCalledWith('hex_to_bin', 8, true)
    })

    // Should notify parent so it can refresh user stats
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledTimes(1)
    })
  })

  it('handles wrong answer flow with API call and feedback', async () => {
    render(<HexBinTrainer onUpdate={mockOnUpdate} />)

    typeAnswer('11111111')
    pressCheck()

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Falsch/i)
    })
    await waitFor(() => {
      expect(mockSubmitAnswer).toHaveBeenCalledWith('hex_to_bin', 8, false)
    })

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledTimes(1)
    })
  })

  it('handles API failure gracefully with error feedback', async () => {
    mockSubmitAnswer.mockRejectedValue(new TypeError('Network error'))

    render(<HexBinTrainer onUpdate={mockOnUpdate} />)

    typeAnswer(BIN)
    pressCheck()

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Fehler beim Speichern/i)
    })

    expect(mockOnUpdate).not.toHaveBeenCalled()
  })

  it('submits answer when Enter key is pressed', async () => {
    render(<HexBinTrainer onUpdate={mockOnUpdate} />)

    const input = screen.getByRole('textbox')
    typeAnswer(BIN)
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

    await waitFor(() => {
      expect(mockSubmitAnswer).toHaveBeenCalledWith('hex_to_bin', 8, true)
    })
  })

  it('uses the mode passed in from the sidebar', () => {
    render(<HexBinTrainer onUpdate={mockOnUpdate} activeMode="HexToDec" />)

    expect(screen.getByLabelText('Current mode')).toHaveTextContent('Hex → Dec')
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

    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('reports bit changes to the parent when controlled', () => {
    const mockOnBitsChange = vi.fn()
    render(<HexBinTrainer onUpdate={mockOnUpdate} bits={8} onBitsChange={mockOnBitsChange} />)

    fireEvent.click(screen.getByRole('tab', { name: '16 Bits' }))

    expect(mockOnBitsChange).toHaveBeenCalledWith(16)
  })

  describe('direction -> mode mapping (US-38 AC-1)', () => {
    it('covers all six UI directions', () => {
      expect(directionCases).toHaveLength(HEX_BIN_MODES.length)
      for (const [direction] of directionCases) {
        expect(HEX_BIN_MODES).toContain(direction)
      }
    })

    it.each(directionCases)(
      'submits the %s direction as backend mode %s',
      async (direction, mode, value) => {
        render(<HexBinTrainer onUpdate={mockOnUpdate} activeMode={direction} />)

        typeAnswer(value)
        pressCheck()

        await waitFor(() => {
          expect(mockSubmitAnswer).toHaveBeenCalledWith(mode, 8, true)
        })
      }
    )

    it('derives the mode from the shared mapper instead of a local copy', () => {
      render(<HexBinTrainer onUpdate={mockOnUpdate} activeMode="DecToBin" />)

      expect(screen.getByLabelText('Current mode')).toHaveTextContent('Dec → Bin')
      expect(modeForDirection('DecToBin')).toBe('bin_to_dec')
    })
  })

  it('hands the raw /answer response to the parent so the server wins', async () => {
    const onGameResult = vi.fn()
    render(<HexBinTrainer onUpdate={mockOnUpdate} onGameResult={onGameResult} />)

    typeAnswer(BIN)
    pressCheck()

    await waitFor(() => {
      expect(onGameResult).toHaveBeenCalledWith(answer)
    })
    // applyGameResult replaces the extra /api/user/me round-trip.
    expect(mockOnUpdate).not.toHaveBeenCalled()
  })

  it('names the required level when the answer is locked (AC-3)', async () => {
    mockSubmitAnswer.mockRejectedValue(
      new ApiError({ status: 403, detail: 'Content locked until level 13' })
    )

    render(<HexBinTrainer onUpdate={mockOnUpdate} />)

    typeAnswer(BIN)
    pressCheck()

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Freigeschaltet ab Stufe 13.')
    })
  })

  it('sends the bit width — not a byte count — for a 32-bit question', async () => {
    render(<HexBinTrainer onUpdate={mockOnUpdate} bits={32} />)

    // A 32-bit question is 32 chars long, so the 8-bit answer is simply wrong.
    typeAnswer(BIN)
    pressCheck()

    await waitFor(() => {
      expect(mockSubmitAnswer).toHaveBeenCalledWith('hex_to_bin', 32, false)
    })
  })

  it('counts the answer locally and skips the backend in guest mode', async () => {
    const onGuestAnswer = vi.fn()
    render(<HexBinTrainer onUpdate={mockOnUpdate} onGuestAnswer={onGuestAnswer} />)

    const input = screen.getByRole('textbox')
    const submitButton = screen.getByRole('button', { name: /check answer/i })

    // Correct answer for hex "87"
    fireEvent.change(input, { target: { value: BIN } })
    fireEvent.click(submitButton)
    await waitFor(() => expect(screen.getByText(/Richtig/i)).toBeInTheDocument())
    expect(onGuestAnswer).toHaveBeenCalledWith(true)

    // Wrong answer
    fireEvent.change(input, { target: { value: '1' } })
    fireEvent.click(submitButton)
    await waitFor(() => expect(onGuestAnswer).toHaveBeenCalledWith(false))

    // Nothing left the browser: no /answer, no profile refresh.
    expect(mockSubmitAnswer).not.toHaveBeenCalled()
    expect(mockOnUpdate).not.toHaveBeenCalled()
  })
})
