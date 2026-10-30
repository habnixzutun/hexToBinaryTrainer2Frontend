import { render, screen } from '../../src/test-utils.tsx'
import GameHud from '../../src/components/GameHud.tsx'
import { TOAST_AUTO_DISMISS_MS } from '../../src/components/LevelUpToast.tsx'
import { authValue, testUser } from '../helpers/auth.ts'
import type { GameAnswerResponse } from '../../src/services/api.ts'
import type { UserMeResponse } from '../../src/services/authApi.ts'

const mockUseAuth = vi.hoisted(() => vi.fn())
vi.mock('../../src/contexts/AuthContext.tsx', () => ({ useAuth: mockUseAuth }))

/** US-33 golden fixture: a level-up to L6 with NO unlock — the normal case. */
const goldenAnswer: GameAnswerResponse = {
  xp_delta: 40,
  total_xp: 1320,
  level: 6,
  xp_in_level: 0,
  xp_required_for_next_level: 760,
  current_streak: 3,
  best_streak: 7,
  correct_count: 42,
  incorrect_count: 5,
  newly_unlocked: [],
}

/** Mid-level progress: 120 of 760 XP -> 16 %. */
const progressAnswer: GameAnswerResponse = { ...goldenAnswer, xp_in_level: 120 }

const economyUser: UserMeResponse = {
  ...testUser,
  correct_count: 42,
  incorrect_count: 5,
  total_xp: 1320,
  level: 6,
  current_streak: 3,
  best_streak: 7,
}

const fillOf = (): HTMLElement | null =>
  screen.getByRole('progressbar').querySelector<HTMLElement>('[data-hud-fill]')

describe('GameHud', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockUseAuth.mockReturnValue(authValue({ user: economyUser, lastAnswer: goldenAnswer }))
  })

  it('renders level, current streak and best streak', () => {
    render(<GameHud />)

    expect(screen.getByLabelText('Stufe')).toHaveTextContent('6')
    expect(screen.getByLabelText('Serie')).toHaveTextContent('3')
    expect(screen.getByLabelText('Beste Serie')).toHaveTextContent('7')
  })

  it('renders the total XP grouped by the active locale', () => {
    render(<GameHud />)

    expect(screen.getByLabelText('XP')).toHaveTextContent('1.320')
  })

  it('renders XP progress from the last /answer response', () => {
    mockUseAuth.mockReturnValue(authValue({ user: economyUser, lastAnswer: progressAnswer }))
    render(<GameHud />)

    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuenow', '120')
    expect(bar).toHaveAttribute('aria-valuemax', '760')
    expect(bar).toHaveAccessibleName('120 von 760 XP')
    expect(fillOf()).toHaveStyle({ transform: 'scaleX(0.16)' })
  })

  it('renders the empty-newly_unlocked level-up without any popup (AC-2)', () => {
    render(<GameHud />)

    // L6 has no entry in the D-2 seed — the toast must stay a no-op...
    expect(screen.queryAllByRole('status')).toHaveLength(0)
    // ... while the level-up itself is still reflected.
    expect(screen.getByLabelText('Stufe')).toHaveTextContent('6')
    expect(fillOf()).toHaveStyle({ transform: 'scaleX(0)' })
  })

  it('clamps a floor-blocked penalty to 0 %, never negative (OQ-4 floor / LV-10)', () => {
    mockUseAuth.mockReturnValue(
      authValue({
        user: { ...economyUser, current_streak: 0, incorrect_count: 6 },
        lastAnswer: { ...goldenAnswer, xp_delta: 0, xp_in_level: 0, current_streak: 0, incorrect_count: 6 },
      })
    )
    render(<GameHud />)

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
    expect(fillOf()).toHaveStyle({ transform: 'scaleX(0)' })
    // xp_delta 0 must not read as "nothing happened": streak reset stays visible.
    expect(screen.getByLabelText('Serie')).toHaveTextContent('0')
    expect(screen.getByLabelText('Wrong answers')).toHaveTextContent('6')
  })

  it('defends against a negative xp_in_level from a broken server', () => {
    mockUseAuth.mockReturnValue(
      authValue({ user: economyUser, lastAnswer: { ...goldenAnswer, xp_in_level: -40 } })
    )
    render(<GameHud />)

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
    expect(fillOf()).toHaveStyle({ transform: 'scaleX(0)' })
  })

  it('does not divide by zero when the next level needs no XP', () => {
    mockUseAuth.mockReturnValue(
      authValue({ user: economyUser, lastAnswer: { ...goldenAnswer, xp_required_for_next_level: 0 } })
    )
    render(<GameHud />)

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
    expect(fillOf()).toHaveStyle({ transform: 'scaleX(0)' })
  })

  it('drops the progress bar on a cold start until the server supplies progress', () => {
    mockUseAuth.mockReturnValue(authValue({ user: economyUser, lastAnswer: null }))
    render(<GameHud />)

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Stufe')).toHaveTextContent('6')
    expect(screen.getByLabelText('XP')).toHaveTextContent('1.320')
  })

  it('renders nothing without a user', () => {
    mockUseAuth.mockReturnValue(authValue({ user: null, lastAnswer: null }))
    const { container } = render(<GameHud />)

    expect(container).toBeEmptyDOMElement()
  })

  it('speaks English when the locale is en', () => {
    localStorage.setItem('locale', 'en')
    mockUseAuth.mockReturnValue(authValue({ user: economyUser, lastAnswer: progressAnswer }))
    render(<GameHud />)

    expect(screen.getByLabelText('Level')).toHaveTextContent('6')
    expect(screen.getByLabelText('Streak')).toHaveTextContent('3')
    expect(screen.getByLabelText('Best streak')).toHaveTextContent('7')
    expect(screen.getByLabelText('XP')).toHaveTextContent('1,320')
    expect(screen.getByRole('progressbar')).toHaveAccessibleName('120 of 760 XP')
  })

  it('levels the toast from the pendingUnlocks handed down by the answer', () => {
    const unlocks = [{ mode: 'hex_to_bin', bit_width: 16, min_level: 8 }] as const
    mockUseAuth.mockReturnValue(
      authValue({
        user: { ...economyUser, level: 8 },
        lastAnswer: { ...goldenAnswer, level: 8, newly_unlocked: unlocks },
        pendingUnlocks: [...unlocks],
      })
    )
    render(<GameHud />)

    expect(screen.getByRole('status')).toHaveAccessibleName(/Stufe 8/)
    expect(screen.getByText('16 Bits')).toBeInTheDocument()
  })

  it('gives the toast a bounded dwell time', () => {
    expect(TOAST_AUTO_DISMISS_MS).toBeLessThanOrEqual(8000)
    expect(TOAST_AUTO_DISMISS_MS).toBeGreaterThan(2000)
  })
})
