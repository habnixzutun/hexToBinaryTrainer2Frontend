/**
 * US-44: the viewer's own row on the public leaderboard, without a round-trip.
 *
 * The panel polls the board every 30 s, so a player who just answered would
 * otherwise watch their own number sit stale for up to half a minute. It does not
 * have to: the session already holds the authoritative economy for that ONE row —
 * `applyGameResult` copies the /answer payload straight into it, and `/api/user/me`
 * is the same server truth. So the local update is not an optimistic guess; it is
 * server data that simply reached the client through the cheaper door.
 *
 * The rules this function exists to keep:
 *
 * - **Only the viewer.** Every other row is returned as the very same object the
 *   backend sent. The server is the truth for everybody else, and a local guess
 *   about someone else's XP is exactly the divergence US-38 removed.
 * - **Both economy fields, or neither.** `level` is derived from `total_xp` by the
 *   D-1 curve, so mixing a local level with a backend XP would print a pair no
 *   server response could ever produce. They move together, up or down.
 * - **The name stays on the server.** Only `level` and `total_xp` are overlaid; a
 *   rename travels through `/me`, not through the board.
 * - **No row, no rank (AC 5).** The endpoint is bounded (default limit 50), so a
 *   player below the cut is simply absent. Absence is honoured — no row is invented
 *   here. Appending one would (a) flash a fabricated one-line board on first paint,
 *   before any poll has resolved, (b) strand the player alone at rank 1 the day the
 *   first poll fails, and (c) push real players past the limit into a fake rank 51+
 *   that the server never returned. The next poll either carries their row or it
 *   does not; both are the server's call, not ours.
 * - **Guests see nothing of the kind.** Without an id there is nothing to
 *   identify a local row with, so the input is handed straight back.
 * - **Session wins, even when stale (AC 6 / AC 8).** A tab that has not yet pulled
 *   `/me` masks a corrected server value with its older, too-high number — most
 *   visibly after a penalty lowered the account elsewhere. That is accepted: the
 *   overlay must move in BOTH directions (see the decreasing-value test), and a
 *   `Math.max(local, backend)` "offensive fix" would make a penalty correction
 *   invisible forever — an AC-6 violation. Do not "fix" this; the 30 s poll and the
 *   next `/me` are what eventually reconcile the stale tab.
 * - **Pure.** No mutation of the fetched array or its rows, which is what makes it
 *   safe to call on every render: a poll that lands late can only ever re-run the
 *   merge, never overwrite the numbers the session already knows.
 */

import type { LeaderboardEntry } from '../services/api.ts';
import type { UserMeResponse } from '../services/authApi.ts';

/**
 * Overlay the viewer's own entry onto the rows the board sent.
 *
 * @param entries the backend rows, in whatever order they arrived
 * @param user the signed-in session, or null for a guest / anonymous visitor
 * @returns the same rows with the viewer's economy taken from `user`. When the
 *          board carries no row for the viewer, the rows are returned unchanged —
 *          nothing is appended (AC 5). The input reference itself is handed back
 *          untouched whenever there is nothing to overlay.
 */
export function mergeOwnEntry(
    entries: readonly LeaderboardEntry[],
    user: UserMeResponse | null,
): readonly LeaderboardEntry[] {
    if (user === null) {
        return entries;
    }

    const ownsRow = entries.some((entry) => entry.user_id === user.id);

    if (!ownsRow) {
        return entries;
    }

    return entries.map((entry) =>
        entry.user_id === user.id
            ? { ...entry, total_xp: user.total_xp, level: user.level }
            : entry,
    );
}
