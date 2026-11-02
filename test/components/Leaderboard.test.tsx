import { act, render, screen, waitFor, within } from '../../src/test-utils.tsx'
import Leaderboard, { LEADERBOARD_POLL_MS } from '../../src/components/Leaderboard.tsx'
import { gameApi, type LeaderboardEntry } from '../../src/services/api.ts'
import type { UserMeResponse } from '../../src/services/authApi.ts'
import { authValue, testUser } from '../helpers/auth.ts'

const mockUseAuth = vi.hoisted(() => vi.fn())
vi.mock('../../src/contexts/AuthContext.tsx', () => ({ useAuth: mockUseAuth }))

vi.mock('../../src/services/api.ts', () => ({
  gameApi: {
    getLeaderboard: vi.fn(),
  },
}))

const mockedGetLeaderboard = vi.mocked(gameApi.getLeaderboard)

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

/**
 * US-43: the V2 wire shape carries exactly four fields. The per-statistic
 * columns (correct_count / incorrect_count) left the contract, so no fixture
 * here may mention them — a fixture that does is a compile error, which is the
 * point: the test data cannot drift away from the backend schema unnoticed.
 *
 * Deliberately unsorted: the panel must order by total_xp, not by server order.
 */
const entries: LeaderboardEntry[] = [
  { user_id: 'u-2', username: 'Bob', total_xp: 476, level: 4 },
  { user_id: 'user-1', username: 'Alice', total_xp: 1320, level: 6 },
  { user_id: 'u-3', username: 'Charlie', total_xp: 252, level: 3 },
  { user_id: 'u-4', username: 'Dave', total_xp: 100, level: 1 },
]

type IsExact<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false

/**
 * Contract guard for US-43: a leaderboard entry is `user_id`, `username`,
 * `total_xp`, `level` — no more, no less. Widening the interface re-adds a
 * field the backend no longer sends, so this assignment stops compiling.
 */
const v2ShapeIsFrozen: IsExact<keyof LeaderboardEntry, 'user_id' | 'username' | 'total_xp' | 'level'> = true

/** Accessible names of the column headers, in DOM order. */
const columnHeaderNames = () =>
  screen.getAllByRole('columnheader').map((el) => (el.getAttribute('aria-label') ?? el.textContent ?? '').trim())

/**
 * The signed-in session, by default mirroring the `user-1` row of the fixture
 * above exactly.
 *
 * US-44: the panel overlays the viewer's own row from the session, so a session
 * that disagrees with the wire would move that row in every test that does not
 * talk about the overlay — the column and badge assertions would silently test
 * the merge instead of the shape they were written for. A test that *does* talk
 * about US-44 passes its own numbers here.
 */
const session = (overrides: Partial<UserMeResponse> = {}): UserMeResponse => ({
  ...testUser,
  username: 'Alice',
  total_xp: 1320,
  level: 6,
  ...overrides,
})

describe('Leaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    mockUseAuth.mockReturnValue(authValue({ user: session() }))
    mockedGetLeaderboard.mockResolvedValue(entries)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('exposes exactly the four V2 fields on LeaderboardEntry (US-43)', () => {
    expect(v2ShapeIsFrozen).toBe(true)
  })

  it('renders three data columns behind the rank spacer (US-43)', async () => {
    render(<Leaderboard refreshTrigger={0} />)

    await waitFor(() => {
      expect(screen.getAllByRole('columnheader')).toHaveLength(4)
    })
    expect(columnHeaderNames()).toEqual(['Rank', 'Name', 'Stufe', 'XP'])
  })

  it('shows neither a correct nor an incorrect column (US-43)', async () => {
    render(<Leaderboard refreshTrigger={0} />)

    await waitFor(() => {
      expect(screen.getByLabelText(/rank 1: alice/i)).toBeInTheDocument()
    })

    expect(screen.queryByLabelText(/correct answers/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/wrong answers/i)).not.toBeInTheDocument()
    expect(screen.queryByText('✓')).not.toBeInTheDocument()
    expect(screen.queryByText('✗')).not.toBeInTheDocument()
  })

  it('renders every figure of a four-field entry without leaving holes (US-43)', async () => {
    render(<Leaderboard refreshTrigger={0} />)

    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(4)
    })

    // A component still reading the dropped columns renders "undefined correct"
    // into the aria-label and an empty cell into the row — both are caught here.
    for (const row of screen.getAllByRole('listitem')) {
      expect(row.textContent).not.toMatch(/undefined|NaN/)
      expect(row.getAttribute('aria-label')).not.toMatch(/undefined/)
      expect(within(row).queryAllByLabelText(/correct|wrong/i)).toHaveLength(0)
    }

    const alice = screen.getByLabelText(/rank 1: alice/i)
    expect(within(alice).getByText('Alice')).toBeInTheDocument()
    expect(within(alice).getByText('6')).toBeInTheDocument()
    expect(within(alice).getByText('1.320')).toBeInTheDocument()
  })

  it('ranks by total XP instead of the legacy points column', async () => {
    render(<Leaderboard refreshTrigger={0} />)

    await waitFor(() => {
      expect(screen.getByLabelText(/rank 1: alice/i)).toBeInTheDocument()
    })
    expect(screen.getByLabelText(/rank 2: bob/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/rank 3: charlie/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/rank 4: dave/i)).toBeInTheDocument()

    const rows = screen.getAllByRole('listitem')
    expect(rows[0]?.textContent).toContain('1.320')
    expect(rows[3]?.textContent).toContain('100')
  })

  it('renders medal icons for top 3 ranks instead of emojis', async () => {
    render(<Leaderboard refreshTrigger={0} />)

    await waitFor(() => {
      const rank1 = screen.getByLabelText(/rank 1: alice/i)
      const rank2 = screen.getByLabelText(/rank 2: bob/i)
      const rank3 = screen.getByLabelText(/rank 3: charlie/i)

      expect(rank1.querySelector('svg[aria-label="Medal: rank 1"]')).toBeInTheDocument()
      expect(rank2.querySelector('svg[aria-label="Medal: rank 2"]')).toBeInTheDocument()
      expect(rank3.querySelector('svg[aria-label="Medal: rank 3"]')).toBeInTheDocument()
    })
  })

  it('exposes the XP and level columns and drops the legacy PTS header', async () => {
    render(<Leaderboard refreshTrigger={0} />)

    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: 'XP' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Stufe' })).toBeInTheDocument()
    })
    expect(screen.queryByText('PTS')).not.toBeInTheDocument()
    expect(screen.queryByText('Punkte')).not.toBeInTheDocument()
  })

  it('marks the signed-in player', async () => {
    render(<Leaderboard refreshTrigger={0} />)

    await waitFor(() => {
      const alice = screen.getByLabelText(/rank 1: alice/i)
      expect(within(alice).getByText('(Du)')).toBeInTheDocument()
    })
  })

  it('attributes the (Du) badge to the user_id, not to the display name (US-43)', async () => {
    // Alice renamed herself on the server: her row no longer shares the signed-in
    // name, but it still shares the id. The other row wears the old name with a
    // foreign id. Comparing names would light up the wrong row.
    mockedGetLeaderboard.mockResolvedValue([
      { user_id: 'u-9', username: 'Alice', total_xp: 999, level: 5 },
      { user_id: 'user-1', username: 'Alice (alt)', total_xp: 500, level: 3 },
    ])
    // US-44: the session mirrors its own row so this test keeps asserting the
    // badge rule, not the overlay.
    mockUseAuth.mockReturnValue(authValue({ user: session({ total_xp: 500, level: 3 }) }))

    render(<Leaderboard refreshTrigger={0} />)

    await waitFor(() => {
      expect(screen.getByLabelText(/rank 2: alice \(alt\)/i)).toBeInTheDocument()
    })
    expect(within(screen.getByLabelText(/rank 2: alice \(alt\)/i)).getByText('(Du)')).toBeInTheDocument()

    const impostor = screen.getByLabelText(/rank 1: alice,/i)
    expect(within(impostor).queryByText('(Du)')).not.toBeInTheDocument()
  })

  it('shows no (Du) badge for a guest session', async () => {
    mockUseAuth.mockReturnValue(authValue({ user: null, isGuest: true }))

    render(<Leaderboard refreshTrigger={0} />)

    await waitFor(() => {
      expect(screen.getByLabelText(/rank 1: alice/i)).toBeInTheDocument()
    })
    expect(screen.queryByText('(Du)')).not.toBeInTheDocument()
  })

  it('keeps Max pinned to rank 1 regardless of his XP', async () => {
    mockedGetLeaderboard.mockResolvedValue([
      ...entries,
      { user_id: 'u-max', username: 'Max', total_xp: 8, level: 1 },
    ])

    render(<Leaderboard refreshTrigger={0} />)

    await waitFor(() => {
      expect(screen.getByLabelText(/rank 1: max/i)).toBeInTheDocument()
    })
    expect(screen.getByLabelText(/rank 2: alice/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Er wird für immer unsere 1 bleiben')).toBeInTheDocument()
  })

  it('groups the XP figures by the active locale', async () => {
    localStorageMock.setItem('locale', 'en')

    render(<Leaderboard refreshTrigger={0} />)

    await waitFor(() => {
      const alice = screen.getByLabelText(/rank 1: alice/i)
      expect(within(alice).getByText('1,320')).toBeInTheDocument()
    })
  })

  it('surfaces a failed poll, clears the spinner and keeps polling (AC-3)', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })

    render(<Leaderboard refreshTrigger={0} />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(mockedGetLeaderboard).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('status', { name: /loading/i })).not.toBeInTheDocument()

    mockedGetLeaderboard.mockRejectedValueOnce(new Error('Network down'))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(LEADERBOARD_POLL_MS)
    })

    // The panel is permanently mounted: a failure must be visible, not an
    // unhandled rejection, and it must not hang the spinner forever.
    expect(screen.getByRole('alert')).toHaveTextContent('Bestenliste konnte nicht geladen werden.')
    expect(screen.queryByRole('status', { name: /loading/i })).not.toBeInTheDocument()
    // Last good data survives the failed refresh.
    expect(screen.getByLabelText(/rank 1: alice/i)).toBeInTheDocument()

    mockedGetLeaderboard.mockResolvedValue(entries)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(LEADERBOARD_POLL_MS)
    })

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(mockedGetLeaderboard).toHaveBeenCalledTimes(3)
  })

  it('refetches when the refresh trigger changes', async () => {
    const { rerender } = render(<Leaderboard refreshTrigger={0} />)
    await waitFor(() => expect(mockedGetLeaderboard).toHaveBeenCalledTimes(1))

    rerender(<Leaderboard refreshTrigger={1} />)

    await waitFor(() => expect(mockedGetLeaderboard).toHaveBeenCalledTimes(2))
  })

  describe('US-44 — own entry without a backend request', () => {
    it('shows the session numbers of the own row without a second request', async () => {
      // The /answer payload already wrote the new economy into the session, so
      // the panel renders it from there. No extra round-trip may be needed for
      // the viewer's own row to move.
      mockUseAuth.mockReturnValue(authValue({ user: session({ total_xp: 2000, level: 9 }) }))

      render(<Leaderboard refreshTrigger={0} />)

      const alice = await screen.findByLabelText(/rank 1: alice/i)
      expect(within(alice).getByText('2.000')).toBeInTheDocument()
      expect(within(alice).getByText('9')).toBeInTheDocument()
      expect(mockedGetLeaderboard).toHaveBeenCalledTimes(1)
    })

    it('re-sorts the own row by the local XP instead of its backend position', async () => {
      // The backend ranked Alice first; a local 300 puts her behind Bob (476)
      // and in front of Charlie (252) — the overlay has to move the row.
      mockUseAuth.mockReturnValue(authValue({ user: session({ total_xp: 300, level: 3 }) }))

      render(<Leaderboard refreshTrigger={0} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/rank 2: alice/i)).toBeInTheDocument()
      })
      expect(screen.getByLabelText(/rank 1: bob/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/rank 3: charlie/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/rank 4: dave/i)).toBeInTheDocument()
    })

    it('does not let an in-flight poll overwrite the session numbers', async () => {
      // The race US-44 must survive: refreshTrigger fires a request, the answer
      // lands while it is still open, and the stale payload resolves last.
      let resolveBoard: (rows: LeaderboardEntry[]) => void = () => {}
      mockedGetLeaderboard.mockImplementation(
        () => new Promise<LeaderboardEntry[]>((resolve) => { resolveBoard = resolve }),
      )

      const { rerender } = render(<Leaderboard refreshTrigger={0} />)
      await waitFor(() => expect(mockedGetLeaderboard).toHaveBeenCalledTimes(1))

      mockUseAuth.mockReturnValue(authValue({ user: session({ total_xp: 2000, level: 9 }) }))
      rerender(<Leaderboard refreshTrigger={0} />)

      await act(async () => {
        resolveBoard(entries)
      })

      const alice = await screen.findByLabelText(/rank 1: alice/i)
      expect(within(alice).getByText('2.000')).toBeInTheDocument()
      expect(within(alice).getByText('9')).toBeInTheDocument()
    })

    it('leaves every other row on the backend numbers', async () => {
      mockUseAuth.mockReturnValue(authValue({ user: session({ total_xp: 999_999, level: 99 }) }))

      render(<Leaderboard refreshTrigger={0} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/rank 1: alice/i)).toBeInTheDocument()
      })
      const bob = screen.getByLabelText(/rank 2: bob/i)
      expect(within(bob).getByText('476')).toBeInTheDocument()
      expect(within(bob).getByText('4')).toBeInTheDocument()
      expect(screen.getByLabelText(/rank 3: charlie/i)).toBeInTheDocument()
    })

    it('shows no local row when the board has none for the viewer (AC 5)', async () => {
      // The endpoint is bounded (default limit 50). AC 5: a player below the cut is
      // simply absent — the panel never invents a row for them. Appending one would
      // fabricate a board on a failed first poll and push the real tail past rank 50.
      mockedGetLeaderboard.mockResolvedValue(entries.filter((row) => row.user_id !== 'user-1'))
      mockUseAuth.mockReturnValue(authValue({ user: session({ total_xp: 300, level: 3 }) }))

      render(<Leaderboard refreshTrigger={0} />)

      await waitFor(() => {
        expect(screen.getAllByRole('listitem')).toHaveLength(entries.length - 1)
      })
      // Nobody is highlighted as the viewer and Alice's row is genuinely gone.
      expect(screen.queryByText('(Du)')).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/alice/i)).not.toBeInTheDocument()
    })

    it('keeps a tied neighbour ahead of the viewer instead of reshuffling (AC 8)', async () => {
      // AC 8: overlaying the viewer's own number must not leapfrog an equal-XP peer.
      // The merge keeps wire order and Array.prototype.sort is stable (ES2019), so
      // Bob — tied at 476 and above Alice on the wire — stays rank 1. A naive
      // "local wins, jump to the top" would flip them, and the flip would depend on
      // the incoming order the poll happened to carry.
      mockUseAuth.mockReturnValue(authValue({ user: session({ total_xp: 476, level: 4 }) }))

      render(<Leaderboard refreshTrigger={0} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/rank 1: bob/i)).toBeInTheDocument()
      })
      const alice = screen.getByLabelText(/rank 2: alice/i)
      expect(within(alice).getByText('476')).toBeInTheDocument()
      expect(within(alice).getByText('(Du)')).toBeInTheDocument()
    })

    it('reflects a decreasing session value, not the higher wire number (AC 8)', async () => {
      // Penalty correction: the server lowered the viewer below what the last board
      // carried (wire 1.320). "Session wins" cuts both ways — the overlay must write
      // 500 down, never Math.max its way back to the stale figure (see the docstring
      // in leaderboardMerge).
      mockUseAuth.mockReturnValue(authValue({ user: session({ total_xp: 500, level: 3 }) }))

      render(<Leaderboard refreshTrigger={0} />)

      const alice = await screen.findByLabelText(/rank 1: alice/i)
      expect(within(alice).getByText('500')).toBeInTheDocument()
      expect(within(alice).queryByText('1.320')).not.toBeInTheDocument()
    })

    it('renders no local row for a player without an id', async () => {
      // A guest has no account on the server, so there is nothing to identify a
      // local row with: the board is the backend board, unmodified.
      mockUseAuth.mockReturnValue(authValue({ user: null, isGuest: true }))

      render(<Leaderboard refreshTrigger={0} />)

      await waitFor(() => {
        expect(screen.getAllByRole('listitem')).toHaveLength(entries.length)
      })
      expect(screen.queryByText('(Du)')).not.toBeInTheDocument()
      expect(screen.getByLabelText(/rank 1: alice/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/rank 4: dave/i)).toBeInTheDocument()
    })

    it('keeps Max on rank 1 while the local numbers move the row behind him', async () => {
      mockedGetLeaderboard.mockResolvedValue([...entries, { user_id: 'u-max', username: 'Max', total_xp: 8, level: 1 }])
      mockUseAuth.mockReturnValue(authValue({ user: session({ total_xp: 5000, level: 20 }) }))

      render(<Leaderboard refreshTrigger={0} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/rank 1: max/i)).toBeInTheDocument()
      })
      expect(screen.getByLabelText('Er wird für immer unsere 1 bleiben')).toBeInTheDocument()

      const alice = screen.getByLabelText(/rank 2: alice/i)
      expect(within(alice).getByText('5.000')).toBeInTheDocument()
    })
  })
})
