import { act, render, screen, waitFor, within } from '../../src/test-utils.tsx'
import Leaderboard, { LEADERBOARD_POLL_MS } from '../../src/components/Leaderboard.tsx'
import { gameApi, type LeaderboardEntry } from '../../src/services/api.ts'
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

/** Deliberately unsorted: the panel must order by total_xp, not by server order. */
const entries: LeaderboardEntry[] = [
  { user_id: 'u-2', username: 'Bob', total_xp: 476, level: 4, correct_count: 8, incorrect_count: 3 },
  { user_id: 'u-1', username: 'Alice', total_xp: 1320, level: 6, correct_count: 42, incorrect_count: 5 },
  { user_id: 'u-3', username: 'Charlie', total_xp: 252, level: 3, correct_count: 6, incorrect_count: 4 },
  { user_id: 'u-4', username: 'Dave', total_xp: 100, level: 1, correct_count: 4, incorrect_count: 5 },
]

describe('Leaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    mockUseAuth.mockReturnValue(authValue({ user: { ...testUser, username: 'Alice' } }))
    mockedGetLeaderboard.mockResolvedValue(entries)
  })

  afterEach(() => {
    vi.useRealTimers()
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

  it('exposes XP and level columns and drops the legacy PTS header', async () => {
    render(<Leaderboard refreshTrigger={0} />)

    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: 'XP' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Stufe' })).toBeInTheDocument()
      expect(screen.getByLabelText(/correct answers/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/wrong answers/i)).toBeInTheDocument()
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

  it('keeps Max pinned to rank 1 regardless of his XP', async () => {
    mockedGetLeaderboard.mockResolvedValue([
      ...entries,
      { user_id: 'u-max', username: 'Max', total_xp: 8, level: 1, correct_count: 1, incorrect_count: 0 },
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
})
