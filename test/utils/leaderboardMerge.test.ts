import { mergeOwnEntry } from '../../src/utils/leaderboardMerge.ts'
import type { LeaderboardEntry } from '../../src/services/api.ts'
import type { UserMeResponse } from '../../src/services/authApi.ts'
import { testUser } from '../helpers/auth.ts'

/**
 * US-44: the overlay merges two different sources of truth for one row.
 *
 * The backend rows arrive in the board's total order (`total_xp DESC`, then the
 * tiebreaks the server documents) and carry exactly the four V2 fields. The
 * session carries the same two economy fields for ONE player — the viewer — and
 * it is always fresher, because a /answer payload writes it before the next poll
 * can even start.
 *
 * Deliberately unsorted and missing the viewer's expected rank: a helper that
 * sorted here would duplicate the panel's ranking rule (the "Max" promotion),
 * and a helper that trusted the incoming order would hide the fact that the
 * overlay moves its own row.
 */
const backendRows: LeaderboardEntry[] = [
  { user_id: 'u-2', username: 'Bob', total_xp: 476, level: 4 },
  { user_id: 'user-1', username: 'Alice', total_xp: 1320, level: 6 },
  { user_id: 'u-3', username: 'Charlie', total_xp: 252, level: 3 },
]

/** The signed-in player, by default the owner of the `user-1` row above. */
const session = (overrides: Partial<UserMeResponse> = {}): UserMeResponse => ({
  ...testUser,
  username: 'Alice',
  total_xp: 1320,
  level: 6,
  ...overrides,
})

describe('mergeOwnEntry', () => {
  it('overlays the viewer total_xp from the session instead of the wire', () => {
    // Arrange
    const fresher = session({ total_xp: 2000 })

    // Act
    const merged = mergeOwnEntry(backendRows, fresher)

    // Assert
    expect(merged.find((row) => row.user_id === 'user-1')?.total_xp).toBe(2000)
  })

  it('overlays level and total_xp as one pair, never one of the two', () => {
    // A row whose local level is paired with the backend XP contradicts the D-1
    // curve the whole economy is built on, so both fields move together.
    const merged = mergeOwnEntry(backendRows, session({ total_xp: 2000, level: 9 }))

    expect(merged.find((row) => row.user_id === 'user-1')).toEqual({
      user_id: 'user-1',
      username: 'Alice',
      total_xp: 2000,
      level: 9,
    })
  })

  it('keeps the display name of a row the backend sent', () => {
    // Only the two economy fields come from the session: the name a rename has
    // not told the server yet must not appear as somebody else's row.
    const merged = mergeOwnEntry(backendRows, session({ username: 'Alice (neu)', total_xp: 2000 }))

    expect(merged.find((row) => row.user_id === 'user-1')?.username).toBe('Alice')
  })

  it('leaves every other player on the backend numbers', () => {
    // Act: a local economy that dwarfs the whole board.
    const merged = mergeOwnEntry(backendRows, session({ total_xp: 999_999, level: 99 }))

    // Assert: nobody but the viewer moved.
    expect(merged.filter((row) => row.user_id !== 'user-1')).toEqual(
      backendRows.filter((row) => row.user_id !== 'user-1'),
    )
  })

  it('keeps exactly one row per player id', () => {
    const merged = mergeOwnEntry(backendRows, session({ total_xp: 2000 }))

    expect(merged.filter((row) => row.user_id === 'user-1')).toHaveLength(1)
    expect(merged).toHaveLength(backendRows.length)
  })

  it('returns the rows unchanged when the viewer is not in the top N (AC 5)', () => {
    // The limit of the endpoint (default 50) means a low-XP player is simply
    // absent. AC 5: absence is honoured, never papered over with an invented row —
    // appending would fabricate a board on a failed first poll and push the real
    // tail past the server's cut. The reference comes straight back, nothing copied.
    const merged = mergeOwnEntry(backendRows, session({ id: 'u-new', username: 'Neu', total_xp: 10, level: 1 }))

    expect(merged).toBe(backendRows)
    expect(merged).toHaveLength(backendRows.length)
    expect(merged.some((row) => row.user_id === 'u-new')).toBe(false)
  })

  it('returns an empty board when nothing has been served yet (AC 5)', () => {
    // First paint before any poll resolves: no rows, so no viewer row either. An
    // appended row here would flash a made-up one-line board with the viewer alone
    // at rank 1.
    expect(mergeOwnEntry([], session({ total_xp: 42, level: 1 }))).toEqual([])
  })

  it('returns the backend rows untouched for a guest', () => {
    // A guest has no id, so there is nothing to identify a local row with — and
    // the same reference back documents that no copy was made for them.
    expect(mergeOwnEntry(backendRows, null)).toBe(backendRows)
  })

  it('never mutates the rows it was given', () => {
    // Arrange: a deep copy of the input, taken before the call.
    const snapshot = JSON.parse(JSON.stringify(backendRows)) as LeaderboardEntry[]

    // Act
    mergeOwnEntry(backendRows, session({ total_xp: 999_999, level: 99 }))

    // Assert: the fetch result the panel keeps in state is still the wire result.
    expect(backendRows).toEqual(snapshot)
  })
})
