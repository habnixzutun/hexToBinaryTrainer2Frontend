import { render, screen } from '../../src/test-utils.tsx'
import HexBinTrainer from '../../src/components/HexBinTrainer.tsx'
import { gameApi, type GameAnswerResponse } from '../../src/services/api.ts'
import { questionText, selectedTier } from '../helpers/tier.ts'

/**
 * US-46, component half: `HexBinTrainer` keeps an internal `bits` fallback for
 * isolated use (and for its own tests). That fallback was hardcoded to 8 too, so
 * it disagreed with the profile it was handed.
 *
 * The desktop tab bar is CSS-hidden below `lg` but stays in the DOM, which is
 * what makes `aria-selected` a stable read of the internal default.
 */

vi.mock('../../src/services/api.ts', () => ({
  gameApi: {
    submitAnswer: vi.fn(),
    getLeaderboard: vi.fn(),
  },
}))

const mockedSubmitAnswer = vi.mocked(gameApi.submitAnswer)

const answer: GameAnswerResponse = {
  xp_delta: 8,
  total_xp: 58,
  level: 1,
  xp_in_level: 58,
  xp_required_for_next_level: 100,
  current_streak: 1,
  best_streak: 3,
  correct_count: 6,
  incorrect_count: 2,
  newly_unlocked: [],
}


describe('HexBinTrainer default tier (US-46)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    mockedSubmitAnswer.mockResolvedValue(answer)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('opens an unlevel-tied trainer on 4 bits, not 8', () => {
    render(<HexBinTrainer onUpdate={vi.fn()} />)

    expect(selectedTier()).toBe(4)
  })

  it.each([1, 3, 4, 8, 13, 99])('opens the internal fallback on 4 bits at level %i', (level) => {
    render(<HexBinTrainer onUpdate={vi.fn()} playerLevel={level} />)

    expect(selectedTier()).toBe(4)
  })

  it('treats a missing level like a guest: slot 1', () => {
    render(<HexBinTrainer onUpdate={vi.fn()} playerLevel={undefined} />)

    expect(selectedTier()).toBe(4)
  })

  it('generates the 4-bit question for the tier it opens on', () => {
    render(<HexBinTrainer onUpdate={vi.fn()} playerLevel={1} />)

    // bits=4, random=0.5 → value 8 → hex "8". The old 8-bit default asked "87".
    expect(questionText()).toBe('8')
  })

  it('still lets an explicit bits prop win over the default', () => {
    render(<HexBinTrainer onUpdate={vi.fn()} bits={16} playerLevel={13} />)

    expect(selectedTier()).toBe(16)
  })

  it('keeps the default below the cap so a locked tier is never selected', () => {
    render(<HexBinTrainer onUpdate={vi.fn()} playerLevel={1} />)

    expect(screen.getByRole('tab', { name: `${selectedTier()} Bits` })).not.toHaveAttribute(
      'aria-disabled'
    )
  })
})
