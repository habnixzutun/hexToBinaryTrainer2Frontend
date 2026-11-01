import { userEvent } from '@testing-library/user-event'
import { render, screen, waitFor, within } from '../src/test-utils.tsx'
import App from '../src/App.tsx'
import * as authApi from '../src/services/authApi.ts'
import { gameApi, type GameAnswerResponse, type LeaderboardEntry } from '../src/services/api.ts'
import { testUser } from './helpers/auth.ts'
import { setPersistenceEnabled } from '../src/utils/persistence.ts'

/**
 * US-45: the GameHud bar is gone, the level-up toast survives.
 *
 * Personal figures already live in the sidebar, so `GameHud.tsx` is deleted —
 * but `LevelUpToast` hung inside it (`GameHud.tsx:126`) and the unlock feedback
 * must not disappear with the bar. These tests pin the two halves of that story
 * through the REAL AuthProvider: the toast is now App's own concern, and every
 * test asserts the HUD is not there to carry it any more.
 *
 * The `not.toBeInTheDocument()` HUD assertion in the toast tests is what makes
 * them RED before the implementation: today the toast renders *because* the HUD
 * renders it, so it cannot survive the removal it is tested against.
 */

vi.mock('../src/services/authApi.ts', () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
  refreshAccessToken: vi.fn(),
}))

vi.mock('../src/services/api.ts', () => ({
  gameApi: {
    submitAnswer: vi.fn(),
    getLeaderboard: vi.fn(),
  },
}))

const mockedAuthApi = vi.mocked(authApi)
const mockedGameApi = vi.mocked(gameApi)

// US-43: the V2 entry is four fields — no per-statistic columns on the wire.
const leaderboardEntries: LeaderboardEntry[] = [
  { user_id: 'u-1', username: 'Alice', total_xp: 1320, level: 6 },
]

/** D-2 seed: L2 opens the 16-bit hex conversion. The toast lists exactly this. */
const answerWithUnlock: GameAnswerResponse = {
  xp_delta: 40,
  total_xp: 90,
  level: 2,
  xp_in_level: 0,
  xp_required_for_next_level: 130,
  current_streak: 4,
  best_streak: 4,
  correct_count: 6,
  incorrect_count: 2,
  newly_unlocked: [{ mode: 'hex_to_bin', bit_width: 16, min_level: 2 }],
}

/** The same answer with an empty `newly_unlocked`: a level-up nobody needs a popup for. */
const answerWithoutUnlock: GameAnswerResponse = { ...answerWithUnlock, newly_unlocked: [] }

/** The HUD bar announced itself as "Trainingsfortschritt" (t.hudLabel). */
const HUD_NAME = /trainingsfortschritt/i

const setViewportWidth = (width: number): void => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width })
}

/**
 * Sign in and wait for the trainer. Level 1 → the trainer opens on the first
 * unlocked tier (US-46), so with Math.random pinned to 0.5 the question is the
 * 4-bit hex "8" and the correct answer is "1000".
 */
async function signInAndAnswer(
  user: ReturnType<typeof userEvent.setup>,
  answer: GameAnswerResponse
): Promise<void> {
  mockedGameApi.submitAnswer.mockResolvedValue(answer)

  render(<App />)
  await screen.findByRole('heading', { name: 'Willkommen zurück' })

  await user.type(screen.getByLabelText('E-Mail'), 'test@example.com')
  await user.type(screen.getByLabelText('Passwort'), 'Test1234!')
  await user.click(screen.getByRole('button', { name: 'Anmelden' }))
  await screen.findByRole('region', { name: /hex\/binary trainer/i })

  await user.type(screen.getByRole('textbox'), '1000')
  await user.click(screen.getByRole('button', { name: /check answer/i }))
}

describe('App without the GameHud (US-45)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    setPersistenceEnabled(true)
    setViewportWidth(1280)

    // Deterministic question: 4 bits, hex "8" -> bin "1000".
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    mockedAuthApi.refreshAccessToken.mockRejectedValue(new Error('Missing refresh token.'))
    mockedAuthApi.login.mockResolvedValue({ access_token: 'access-1', token_type: 'bearer' })
    mockedAuthApi.getCurrentUser.mockResolvedValue(testUser)
    mockedGameApi.getLeaderboard.mockResolvedValue(leaderboardEntries)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('keeps the unlock toast alive after the HUD bar is gone (AC-1)', async () => {
    const user = userEvent.setup()
    await signInAndAnswer(user, answerWithUnlock)

    const toast = await screen.findByRole('status', { name: /Stufe 2/ })
    expect(within(toast).getByText('16 Bits')).toBeInTheDocument()

    // The toast no longer rides along inside the HUD — the bar is gone.
    expect(screen.queryByRole('region', { name: HUD_NAME })).not.toBeInTheDocument()
  })

  it('renders no toast when the answer carried no unlock', async () => {
    const user = userEvent.setup()
    await signInAndAnswer(user, answerWithoutUnlock)

    // Wait for the answer to land in the context before asserting the absence.
    await waitFor(() => {
      expect(mockedGameApi.submitAnswer).toHaveBeenCalledWith('hex_to_bin', 4, true)
    })
    await waitFor(() => {
      expect(within(screen.getByLabelText('Main navigation')).getByLabelText('Your statistics').textContent)
        .toBe('6OK2ERR90XP')
    })

    expect(screen.queryByRole('status', { name: /Stufe/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: HUD_NAME })).not.toBeInTheDocument()
  })

  it('closes the toast through its dismiss button (AC-3)', async () => {
    const user = userEvent.setup()
    await signInAndAnswer(user, answerWithUnlock)

    const toast = await screen.findByRole('status', { name: /Stufe 2/ })
    await user.click(within(toast).getByRole('button', { name: 'Hinweis ausblenden' }))

    await waitFor(() => {
      expect(screen.queryByRole('status', { name: /Stufe 2/ })).not.toBeInTheDocument()
    })
    expect(screen.queryByRole('region', { name: HUD_NAME })).not.toBeInTheDocument()
  })

  it('never renders the GameHud bar again — no progress, no streak, no XP row (AC-4)', async () => {
    const user = userEvent.setup()
    await signInAndAnswer(user, answerWithUnlock)

    await waitFor(() => {
      expect(mockedGameApi.submitAnswer).toHaveBeenCalled()
    })

    expect(screen.queryByRole('region', { name: HUD_NAME })).not.toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Serie')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Beste Serie')).not.toBeInTheDocument()
  })
})
