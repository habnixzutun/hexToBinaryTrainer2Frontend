import { render, screen, waitFor } from '../../src/test-utils.tsx'
import Leaderboard from '../../src/components/Leaderboard.tsx'
import { authValue, testUser } from '../helpers/auth.ts'

// Mock the game API (shape of GET /api/game/leaderboard entries)
vi.mock('../../src/services/api.ts', () => ({
  gameApi: {
    getLeaderboard: vi.fn().mockResolvedValue([
      { user_id: 'u-1', username: 'Alice', correct_count: 10, incorrect_count: 2, points: 100 },
      { user_id: 'u-2', username: 'Bob', correct_count: 8, incorrect_count: 3, points: 80 },
      { user_id: 'u-3', username: 'Charlie', correct_count: 6, incorrect_count: 4, points: 60 },
      { user_id: 'u-4', username: 'Dave', correct_count: 4, incorrect_count: 5, points: 40 },
    ]),
  },
}))

const mockUseAuth = vi.hoisted(() => vi.fn())
vi.mock('../../src/contexts/AuthContext.tsx', () => ({ useAuth: mockUseAuth }))

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

describe('Leaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    mockUseAuth.mockReturnValue(authValue({ user: { ...testUser, username: 'Alice' } }))
  })

  it('renders medal icons for top 3 ranks instead of emojis', async () => {
    render(<Leaderboard refreshTrigger={0} />)

    await waitFor(() => {
      // Check that rank labels are accessible (full aria-label includes name and points)
      const rank1 = screen.getByLabelText(/rank 1: alice/i)
      const rank2 = screen.getByLabelText(/rank 2: bob/i)
      const rank3 = screen.getByLabelText(/rank 3: charlie/i)

      expect(rank1).toBeInTheDocument()
      expect(rank2).toBeInTheDocument()
      expect(rank3).toBeInTheDocument()

      // Top 3 should have SVG medal icons (Award from lucide-react)
      // Check that each rank container has an SVG element with medal aria-label
      expect(rank1.querySelector('svg[aria-label="Medal: rank 1"]')).toBeInTheDocument()
      expect(rank2.querySelector('svg[aria-label="Medal: rank 2"]')).toBeInTheDocument()
      expect(rank3.querySelector('svg[aria-label="Medal: rank 3"]')).toBeInTheDocument()
    })
  })

  it('renders numeric ranks for positions below 3', async () => {
    render(<Leaderboard refreshTrigger={0} />)

    await waitFor(() => {
      // Rank 4 should show numeric "4" (Dave is at rank 4)
      const rank4 = screen.getByLabelText(/rank 4: dave/i)
      expect(rank4).toBeInTheDocument()
    })
  })

  it('has accessible column headers for correct and wrong answers', async () => {
    render(<Leaderboard refreshTrigger={0} />)

    await waitFor(() => {
      // Column headers should have aria-labels that screen readers can announce
      const correctHeader = screen.getByLabelText(/correct answers/i)
      const wrongHeader = screen.getByLabelText(/wrong answers/i)

      expect(correctHeader).toBeInTheDocument()
      expect(wrongHeader).toBeInTheDocument()

      // The visual characters ✓ and ✗ should be hidden from screen readers (wrapped in aria-hidden spans)
      const correctSpan = correctHeader.querySelector('span[aria-hidden]')
      const wrongSpan = wrongHeader.querySelector('span[aria-hidden]')

      expect(correctSpan).toBeInTheDocument()
      expect(wrongSpan).toBeInTheDocument()
    })
  })
})
