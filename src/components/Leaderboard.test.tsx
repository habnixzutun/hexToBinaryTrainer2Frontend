import { render, screen, waitFor } from '../test-utils'
import Leaderboard from './Leaderboard'

// Mock the api module
vi.mock('../services/api', () => ({
  api: {
    getLeaderboard: vi.fn().mockResolvedValue([
      { name: 'Alice', correct: 10, incorrect: 2, points: 100 },
      { name: 'Bob', correct: 8, incorrect: 3, points: 80 },
      { name: 'Charlie', correct: 6, incorrect: 4, points: 60 },
      { name: 'Dave', correct: 4, incorrect: 5, points: 40 },
    ]),
  },
}))

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

const currentUser = { name: 'Alice', correct: 10, incorrect: 2, points: 100 }

describe('Leaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  it('renders medal icons for top 3 ranks instead of emojis', async () => {
    render(<Leaderboard currentUser={currentUser} refreshTrigger={0} />)

    await waitFor(() => {
      // Top 3 should have SVG icons, not emoji text
      expect(screen.queryByText('🥇')).not.toBeInTheDocument()
      expect(screen.queryByText('🥈')).not.toBeInTheDocument()
      expect(screen.queryByText('🥉')).not.toBeInTheDocument()
    })

    // Check that rank labels are accessible (full aria-label includes name and points)
    const rank1 = screen.getByLabelText(/rank 1: alice/i)
    const rank2 = screen.getByLabelText(/rank 2: bob/i)
    const rank3 = screen.getByLabelText(/rank 3: charlie/i)

    expect(rank1).toBeInTheDocument()
    expect(rank2).toBeInTheDocument()
    expect(rank3).toBeInTheDocument()
  })

  it('renders numeric ranks for positions below 3', async () => {
    render(<Leaderboard currentUser={currentUser} refreshTrigger={0} />)

    await waitFor(() => {
      // Rank 4 should show numeric "4" (Dave is at rank 4)
      const rank4 = screen.getByLabelText(/rank 4: dave/i)
      expect(rank4).toBeInTheDocument()
    })
  })
})
