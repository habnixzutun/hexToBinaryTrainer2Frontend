import { describe, it, expect } from 'vitest'
import {
    BIT_WIDTHS_BY_MODE,
    CONVERSION_BIT_WIDTHS,
    CONVERSION_UNLOCK_CAP,
    GAME_MODES,
    UNICODE_BIT_WIDTHS,
    defaultTierFor,
    isUnlocked,
    tierGates,
    type GameMode,
    type TierGate,
} from '../../src/constants/gameModes.ts'

/**
 * US-46 AC 1/AC 3: the tier a session opens on.
 *
 * The default is the *lowest* tier the profile has unlocked — which for every
 * conversion mode is slot 1 (4 bits) from level 1 upward, and for unicode is
 * slot 1 (8 bits == 1 byte). The story title says "erster freigeschalteter
 * Tier", and the plan settles the one real ambiguity in AC 3 explicitly: a
 * level-13 player still starts at 4 bits, because auto-promoting to the newest
 * tier would override a choice the player already made (risk table: "Default is
 * deliberately always slot 1").
 *
 * What the helper buys despite being constant today: the default is *derived*
 * from the frozen D-2 seed instead of hardcoded, so it cannot drift into a
 * locked tier if the seed ever moves. That invariant is the point of every
 * "never locked" test below — and it is what stops the first answer of a fresh
 * level-1 account from hitting the server gate with 403.
 */
describe('defaultTierFor (US-46, first unlocked tier)', () => {
    const CONVERSION_MODES: readonly GameMode[] = ['hex_to_bin', 'hex_to_dec', 'bin_to_dec']

    /** Every level the ladder spans, plus the cap and life beyond it. */
    const EVERY_LEVEL: readonly number[] = [1, 2, 3, 4, 5, 7, 8, 12, 13, 14, 99]

    /**
     * AC 1's formula, written out independently of the implementation so the
     * suite can pin the *definition* of the default and not just its current
     * value. Oracle over `tierGates`, which unlockGating.test.ts already owns.
     */
    const firstOpenTier = (mode: GameMode, level: number | null): number => {
        const open = tierGates(mode, level).find((gate) => gate.isUnlocked)
        if (open === undefined) {
            throw new Error(`no unlocked tier for ${mode} at level ${level}`)
        }
        return open.bitWidth
    }

    describe('conversion modes always open on 4 bits', () => {
        it.each(EVERY_LEVEL)('level %i starts at 4 bits', (level) => {
            for (const mode of CONVERSION_MODES) {
                expect(defaultTierFor(mode, level)).toBe(4)
            }
        })

        it('gives all three conversion modes the same opening tier', () => {
            const tiers = CONVERSION_MODES.map((mode) => defaultTierFor(mode, 7))
            expect(tiers).toEqual([4, 4, 4])
        })

        /**
         * The AC-3 case that a "highest unlocked tier" reading would get wrong.
         * Named loudly so a future refactor that "obviously" wants to open on
         * the newest tier has to break this on purpose and re-argue the AC.
         */
        it('does not jump to the newest tier: level 13 still starts at 4 bits', () => {
            expect(defaultTierFor('hex_to_bin', CONVERSION_UNLOCK_CAP)).toBe(4)
            expect(defaultTierFor('hex_to_bin', CONVERSION_UNLOCK_CAP)).not.toBe(32)
        })
    })

    describe('unicode opens on 1 byte (8 bits), unchanged by US-46', () => {
        it.each([1, 2, 3, 4, 9])('level %i starts at 8 bits', (level) => {
            expect(defaultTierFor('unicode', level)).toBe(8)
        })

        it('agrees with the byte the trainer displays for slot 1', () => {
            // The UI counts bytes; the wire counts bits. Slot 1 stays 1 byte.
            expect(defaultTierFor('unicode', 1)).toBe(UNICODE_BIT_WIDTHS[0])
        })
    })

    describe('guest / no profile (AC 1)', () => {
        it('falls back to slot 1 for a guest, like the ungated tier list does', () => {
            expect(defaultTierFor('hex_to_bin', null)).toBe(4)
            expect(defaultTierFor('unicode', null)).toBe(8)
        })

        it('matches the first unlocked gate of the ungated tier list', () => {
            for (const mode of GAME_MODES) {
                expect(defaultTierFor(mode, null)).toBe(firstOpenTier(mode, null))
            }
        })
    })

    describe('totality — the default is a value the trainer can actually submit', () => {
        // Domain is levels 1-13+ and the guest (null), per AC 1. A level below 1
        // cannot occur (the XP floor stops `level` from ever dropping), so no
        // test pins it: doing so would buy defensive dead code.
        it('only ever names a tier the mode actually offers', () => {
            for (const mode of GAME_MODES) {
                for (const level of [...EVERY_LEVEL, null]) {
                    expect(BIT_WIDTHS_BY_MODE[mode], `${mode} at level ${level}`).toContain(
                        defaultTierFor(mode, level)
                    )
                }
            }
        })

        it('never opens on a locked tier, for any level the seed spans', () => {
            for (const mode of GAME_MODES) {
                for (let level = 1; level <= CONVERSION_UNLOCK_CAP + 1; level += 1) {
                    const tier = defaultTierFor(mode, level)
                    expect(
                        isUnlocked(level, mode, tier),
                        `${mode} at ${tier} bits is locked for level ${level}`
                    ).toBe(true)
                }
            }
        })

        it('opens on the tier the gate list marks unlocked first (AC 1 formula)', () => {
            for (const mode of GAME_MODES) {
                for (const level of [...EVERY_LEVEL, null]) {
                    expect(defaultTierFor(mode, level), `${mode} at level ${level}`).toBe(
                        firstOpenTier(mode, level)
                    )
                }
            }
        })

        it('stays on the mode it was asked about', () => {
            expect(defaultTierFor('hex_to_bin', 1)).not.toBe(defaultTierFor('unicode', 1))
            expect(CONVERSION_BIT_WIDTHS[0]).toBe(4)
        })
    })

    /**
     * Review REQUEST 1 — kill the `playerLevel`-ignoring mutant.
     *
     * The shipped seed opens slot 1 for every level, so on the real ladder
     * `defaultTierFor(mode, level)` is a constant and a body replaced by
     * `void playerLevel; return BIT_WIDTHS_BY_MODE[mode][0]` passes every test
     * above. The perturbation below hands in a ladder where slot 1 is *not* the
     * first unlocked tier — only a function that actually reads the gate list
     * survives it. The injected `gates` argument exists solely for this: the
     * production call sites still go through the live seed.
     */
    describe('seed perturbation — the default tracks the gate list, not slot 1', () => {
        /** Build gates from a custom `bitWidth → min_level` seed at a level. */
        const gatesFromSeed = (
            seed: Readonly<Record<number, number>>,
            level: number
        ): readonly TierGate[] =>
            Object.entries(seed).map(([width, minLevel]) => ({
                bitWidth: Number(width),
                minLevel,
                isUnlocked: level >= minLevel,
            }))

        /** A ladder that opens 8 bits before 4 bits — the shipped seed never does. */
        const INVERTED_SEED: Readonly<Record<number, number>> = { 4: 3, 8: 1, 16: 8, 32: 13 }

        it('returns the first unlocked tier, not slot 1, when slot 1 is still locked', () => {
            // Level 1: only 8 bits is open under the inverted seed. The constant
            // mutant would answer 4 (slot 1) and is caught here.
            const gates = gatesFromSeed(INVERTED_SEED, 1)
            expect(defaultTierFor('hex_to_bin', 1, gates)).toBe(8)
            expect(defaultTierFor('hex_to_bin', 1, gates)).not.toBe(CONVERSION_BIT_WIDTHS[0])
        })

        it('moves with the level once the perturbed slot 1 unlocks', () => {
            // Same seed, higher level: 4 bits is now open and is the lowest, so the
            // answer flips from 8 to 4. A level-ignoring mutant returns one value
            // for both calls and cannot reproduce this difference.
            expect(defaultTierFor('hex_to_bin', 1, gatesFromSeed(INVERTED_SEED, 1))).toBe(8)
            expect(defaultTierFor('hex_to_bin', 3, gatesFromSeed(INVERTED_SEED, 3))).toBe(4)
        })

        it('defaults to the live seed when no gate list is injected', () => {
            // The injection is optional: without it the function reads the real
            // ladder, so every conversion level still opens on 4 bits (AC 1/AC 3).
            for (const level of EVERY_LEVEL) {
                expect(defaultTierFor('hex_to_bin', level)).toBe(4)
            }
        })
    })

    /**
     * Review REQUEST 2 — cover the throw branch at gameModes.ts:171.
     *
     * The XP floor keeps a real profile at level ≥ 1, so slot 1 is always open and
     * the throw is unreachable through the live seed; it fires only on an
     * out-of-domain level (or an all-locked gate list). Pinning it here keeps the
     * "client bug must be loud" contract from silently regressing to a default.
     */
    describe('throws when the mode offers no unlocked tier', () => {
        it.each([0, -1, -99])(
            'raises RangeError for an out-of-domain level %i (below slot 1)',
            (level) => {
                expect(() => defaultTierFor('hex_to_bin', level)).toThrow(RangeError)
            }
        )

        it('names the mode and level in the error so the loud failure is debuggable', () => {
            expect(() => defaultTierFor('hex_to_bin', 0)).toThrow(/hex_to_bin/)
            expect(() => defaultTierFor('hex_to_bin', 0)).toThrow(/\(D-2 seed\)/)
        })

        it('throws on an injected ladder whose every tier is locked', () => {
            const allLocked: readonly TierGate[] = [
                { bitWidth: 4, minLevel: 5, isUnlocked: false },
                { bitWidth: 8, minLevel: 9, isUnlocked: false },
            ]
            expect(() => defaultTierFor('hex_to_bin', 1, allLocked)).toThrow(RangeError)
        })

        it('never throws for a guest, which shares the ungated reading', () => {
            expect(() => defaultTierFor('hex_to_bin', null)).not.toThrow()
            expect(() => defaultTierFor('unicode', null)).not.toThrow()
        })
    })
})
