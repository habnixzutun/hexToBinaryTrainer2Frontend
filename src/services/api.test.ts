import { api } from './api'

// Mock global fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock console.error for getLeaderboard error case
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

describe('api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterAll(() => {
    mockConsoleError.mockRestore()
  })

  describe('getUser', () => {
    it('returns user data on successful response', async () => {
      // Arrange
      const mockUser = { name: 'Alice', correct: 10, incorrect: 2, points: 100 }
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockUser,
      })

      // Act
      const result = await api.getUser('Alice')

      // Assert
      expect(result).toEqual(mockUser)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/user',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Alice' }),
        })
      )
    })

    it('returns default user on HTTP error (e.g., 404 for new user)', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      })

      // Act
      const result = await api.getUser('NewUser')

      // Assert
      expect(result).toEqual({
        name: 'NewUser',
        correct: 0,
        incorrect: 0,
        points: 0,
      })
    })

    it('returns default user on network error', async () => {
      // Arrange
      mockFetch.mockRejectedValue(new Error('Network error'))

      // Act
      const result = await api.getUser('Alice')

      // Assert
      expect(result).toEqual({
        name: 'Alice',
        correct: 0,
        incorrect: 0,
        points: 0,
      })
    })
  })

  describe('getLeaderboard', () => {
    it('returns entries array on successful response', async () => {
      // Arrange
      const mockEntries = [
        { name: 'Alice', correct: 10, incorrect: 2, points: 100 },
        { name: 'Bob', correct: 8, incorrect: 3, points: 80 },
      ]
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ entries: mockEntries }),
      })

      // Act
      const result = await api.getLeaderboard()

      // Assert
      expect(result).toEqual(mockEntries)
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/leaderboard')
    })

    it('returns empty array and logs error on HTTP error', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      })

      // Act
      const result = await api.getLeaderboard()

      // Assert
      expect(result).toEqual([])
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Leaderboard konnte nicht geladen werden:',
        expect.any(Error)
      )
    })

    it('returns empty array and logs error on network error', async () => {
      // Arrange
      const networkError = new Error('Network error')
      mockFetch.mockRejectedValue(networkError)

      // Act
      const result = await api.getLeaderboard()

      // Assert
      expect(result).toEqual([])
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Leaderboard konnte nicht geladen werden:',
        networkError
      )
    })
  })

  describe('updateUserCorrect', () => {
    it('sends correct payload and returns parsed response', async () => {
      // Arrange
      const mockResponse = {
        message: 'Correct answer recorded',
        user: { name: 'Alice', correct: 11, incorrect: 2, points: 110 },
      }
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      // Act
      const result = await api.updateUserCorrect('Alice', 8)

      // Assert
      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/correct',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Alice', bits: 8 }),
        })
      )
    })
  })

  describe('updateUserIncorrect', () => {
    it('sends correct payload and returns parsed response', async () => {
      // Arrange
      const mockResponse = {
        message: 'Incorrect answer recorded',
        user: { name: 'Alice', correct: 10, incorrect: 3, points: 100 },
      }
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      // Act
      const result = await api.updateUserIncorrect('Alice', 16)

      // Assert
      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/incorrect',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Alice', bits: 16 }),
        })
      )
    })
  })
})
