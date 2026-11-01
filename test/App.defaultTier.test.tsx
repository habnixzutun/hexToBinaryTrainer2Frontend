import { userEvent } from '@testing-library/user-event'
import { render, screen, waitFor, within } from '../src/test-utils.tsx'
import App from '../src/App.tsx'
import * as authApi from '../src/services/authApi.ts'
import { gameApi, type GameAnswerResponse } from '../src/services/api.ts'
import { testUser } from './helpers/auth.ts'
import { questionText, selectedTier } from './helpers/tier.ts'
import { setPersistenceEnabled } from '../src/utils/persistence.ts'

/**
 * US-46: the tier a session opens on.
 *
 * These run through the real AuthProvider — only the HTTP layer is mocked — so
 * " beim Login" in the story title is literally what is under test: the profile
 * arrives from GET /api/user/me and the trainer must open on a tier that profile
 * actually owns.
 *
 * The point is not cosmetics. A level-1 account defaulted to 8 bits, the server
 * gate rejected the very first answer with 403, and the new player's opening
 * move was an error message. Every "bit_width 4" assertion below is that bug
 * held shut.
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

const DESKTOP_WIDTH = 1280
const MOBILE_WIDTH = 500

/**
 * bits=4 + Math.random()=0.5 → value 8 → hex "8", bin "1000".
 * The 4-bit question is what a level-1 player is allowed to answer.
 */
const FOUR_BIT_HEX = '8'
const FOUR_BIT_BIN = '1000'

const answerAt = (level: number): GameAnswerResponse => ({
  xp_delta: 10,
  total_xp: level * 10,
  level,
  xp_in_level: 10,
  xp_required_for_next_level: 100,
  current_streak: 1,
  best_streak: 1,
  correct_count: 1,
  incorrect_count: 0,
  newly_unlocked: [],
})

const setViewportWidth = (width: number): void => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width })
}

const playerAt = (level: number): void => {
  mockedAuthApi.getCurrentUser.mockResolvedValue({ ...testUser, level })
}

async function loginThroughForm(actor: ReturnType<typeof userEvent.setup>): Promise<void> {
  // The welcome screen mounts async; typing before it is a harness bug, not a
  // failing assertion.
  await screen.findByRole('heading', { name: 'Willkommen zurück' })
  await actor.type(screen.getByLabelText('E-Mail'), 'test@example.com')
  await actor.type(screen.getByLabelText('Passwort'), 'Test1234!')
  await actor.click(screen.getByRole('button', { name: 'Anmelden' }))
  await screen.findByRole('region', { name: /hex\/binary trainer/i })
}


describe('default tier on login (US-46)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    setPersistenceEnabled(true)
    setViewportWidth(DESKTOP_WIDTH)
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    mockedAuthApi.refreshAccessToken.mockRejectedValue(new Error('Missing refresh token.'))
    mockedAuthApi.login.mockResolvedValue({ access_token: 'access-1', token_type: 'bearer' })
    mockedAuthApi.logout.mockResolvedValue({ message: 'Logged out.' })
    mockedGameApi.getLeaderboard.mockResolvedValue([])
    mockedGameApi.submitAnswer.mockResolvedValue(answerAt(1))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('every level opens on its first unlocked tier', () => {
    const matrix: ReadonlyArray<[number, number]> = [
      [1, 4],
      [3, 4],
      [4, 4],
      [7, 4],
      [8, 4],
      [12, 4],
      [13, 4],
      [99, 4],
    ]

    it.each(matrix)('a level-%i player logs in on %i bits', async (level, expected) => {
      playerAt(level)
      const actor = userEvent.setup()
      render(<App />)
      await loginThroughForm(actor)

      expect(selectedTier()).toBe(expected)
    })

    /**
     * AC 3, stated as the invariant the story is really about: whatever the
     * level, the preselected tier is never one the server would reject.
     */
    it.each(matrix)('never opens a level-%i player on a locked tier', async (level) => {
      playerAt(level)
      const actor = userEvent.setup()
      render(<App />)
      await loginThroughForm(actor)

      const tier = selectedTier()
      expect(screen.getByRole('tab', { name: `${tier} Bits` })).not.toHaveAttribute(
        'aria-disabled'
      )
    })

    it('asks the server for the 4-bit question a level-1 player can answer', async () => {
      playerAt(1)
      const actor = userEvent.setup()
      render(<App />)
      await loginThroughForm(actor)

      // 8-bit hex "87" was the old default's question; 4-bit hex "8" is the new one.
      expect(questionText()).toBe(FOUR_BIT_HEX)
    })
  })

  describe('the first answer no longer hits the unlock gate', () => {
    it('submits bit_width 4 for a level-1 player, not the old 8', async () => {
      playerAt(1)
      const actor = userEvent.setup()
      render(<App />)
      await loginThroughForm(actor)

      await actor.type(screen.getByRole('textbox'), FOUR_BIT_BIN)
      await actor.click(screen.getByRole('button', { name: /check answer/i }))

      await waitFor(() => {
        expect(mockedGameApi.submitAnswer).toHaveBeenCalledWith('hex_to_bin', 4, true)
      })
      expect(mockedGameApi.submitAnswer).not.toHaveBeenCalledWith('hex_to_bin', 8, true)
    })

    it('keeps the answer out of the locked range at level 4 too', async () => {
      // 8 bits is *unlocked* at level 4, but it is not the default — the wire
      // width must still match the tier on screen or the question is unsolvable.
      playerAt(4)
      const actor = userEvent.setup()
      render(<App />)
      await loginThroughForm(actor)

      await actor.type(screen.getByRole('textbox'), FOUR_BIT_BIN)
      await actor.click(screen.getByRole('button', { name: /check answer/i }))

      await waitFor(() => {
        expect(mockedGameApi.submitAnswer).toHaveBeenCalledWith('hex_to_bin', 4, true)
      })
    })
  })

  describe('guest (no profile)', () => {
    it('opens a guest on 4 bits as the safe default', async () => {
      const actor = userEvent.setup()
      render(<App />)
      await screen.findByRole('heading', { name: 'Willkommen zurück' })

      await actor.click(screen.getByRole('button', { name: 'Als Gast testen' }))
      await screen.findByRole('region', { name: /hex\/binary trainer/i })

      expect(selectedTier()).toBe(4)
      expect(questionText()).toBe(FOUR_BIT_HEX)
    })
  })

  describe('mobile selector (AC 5)', () => {
    it('carries the same 4-bit default into the sidebar', async () => {
      setViewportWidth(MOBILE_WIDTH)
      playerAt(1)
      const actor = userEvent.setup()
      render(<App />)
      await loginThroughForm(actor)

      const nav = screen.getByLabelText('Main navigation')
      expect(within(nav).getByRole('button', { name: '4 Bits' })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
      expect(within(nav).getByRole('button', { name: '8 Bits' })).toHaveAttribute(
        'aria-pressed',
        'false'
      )
    })
  })

  describe('no forced switch mid-session (AC 4)', () => {
    it('leaves the chosen tier alone when an answer levels the player up', async () => {
      playerAt(3)
      mockedGameApi.submitAnswer.mockResolvedValue(answerAt(4))
      const actor = userEvent.setup()
      render(<App />)
      await loginThroughForm(actor)

      expect(selectedTier()).toBe(4)

      await actor.type(screen.getByRole('textbox'), FOUR_BIT_BIN)
      await actor.click(screen.getByRole('button', { name: /check answer/i }))

      await waitFor(() => {
        expect(mockedGameApi.submitAnswer).toHaveBeenCalled()
      })
      // L3 → L4 unlocks 8 bits, but the player was never asked — do not jump.
      expect(selectedTier()).toBe(4)
      expect(screen.getByRole('tab', { name: '8 Bits' })).not.toHaveAttribute('aria-disabled')
    })

    /**
     * The stronger half of AC 4, and the one that catches overimplementation:
     * a player who deliberately climbs to 8 bits must be left there by the next
     * level-up. Guard, not RED driver — it passes today only because no
     * promotion effect exists yet, and it is the tripwire that fires the moment
     * someone adds `setBits(defaultTierFor(user.level))` behind an effect.
     */
    it('leaves a tier the player picked alone on the next level-up', async () => {
      playerAt(4)
      mockedGameApi.submitAnswer.mockResolvedValue(answerAt(8))
      const actor = userEvent.setup()
      render(<App />)
      await loginThroughForm(actor)

      await actor.click(screen.getByRole('tab', { name: '8 Bits' }))
      expect(selectedTier()).toBe(8)

      // 8-bit question: hex "87" → bin "10000111".
      await actor.type(screen.getByRole('textbox'), '10000111')
      await actor.click(screen.getByRole('button', { name: /check answer/i }))

      await waitFor(() => {
        expect(mockedGameApi.submitAnswer).toHaveBeenCalledWith('hex_to_bin', 8, true)
      })
      // L4 → L8 unlocks 16 bits. The player chose 8; the level-up does not.
      expect(selectedTier()).toBe(8)
      expect(screen.getByRole('tab', { name: '16 Bits' })).not.toHaveAttribute('aria-disabled')
    })
  })
})
