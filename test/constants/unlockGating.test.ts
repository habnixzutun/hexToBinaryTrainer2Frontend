import { describe, it, expect } from 'vitest'
import {
    BIT_WIDTHS_BY_MODE,
    CONVERSION_BIT_WIDTHS,
    CONVERSION_UNLOCK_CAP,
    GAME_MODES,
    UNLOCK_SEED,
    UNICODE_BYTE_OPTIONS,
    UNICODE_UNLOCK_CAP,
    bytesForBits,
    isUnlocked,
    lockedLevelsFor,
    minLevelFor,
    tierGates,
    type GameMode,
} from '../../src/constants/gameModes.ts'

/**
 * US-39: the D-2 unlock seed, mirrored 1:1 from the server's frozen config
 * (`src/services/game_config.py`). A tier opens exactly at `min_level` and is
 * still locked one level below it — the boundary is inclusive, and all sixteen
 * tiers are pinned here. The mode/units the gate reads live in gameModes.test.ts.
 */
describe('unlock gating (US-39, D-2 seed)', () => {
    const CONVERSION_MODES: readonly GameMode[] = ['hex_to_bin', 'hex_to_dec', 'bin_to_dec']

    /** Conversion tiers in bits -> the level that opens them. */
    const CONVERSION_SEED: Readonly<Record<number, number>> = { 4: 1, 8: 4, 16: 8, 32: 13 }
    /** Unicode tiers in bits -> the level that opens them. */
    const UNICODE_SEED: Readonly<Record<number, number>> = { 8: 1, 16: 2, 24: 3, 32: 4 }

    type SeedRow = [GameMode, number, number]

    const seedRows: readonly SeedRow[] = [
        ...CONVERSION_MODES.flatMap((mode): readonly SeedRow[] =>
            Object.entries(CONVERSION_SEED).map(
                ([width, minLevel]) => [mode, Number(width), minLevel] as SeedRow
            )
        ),
        ...Object.entries(UNICODE_SEED).map(
            ([width, minLevel]) => ['unicode', Number(width), minLevel] as SeedRow
        ),
    ]

    it('holds exactly the sixteen tiers of the seed', () => {
        expect(seedRows).toHaveLength(16)
        expect(UNLOCK_SEED).toHaveLength(16)
    })

    it.each(seedRows)('%s at %i bits belongs to level %i', (mode, bitWidth, minLevel) => {
        expect(minLevelFor(mode, bitWidth)).toBe(minLevel)
    })

    it.each(seedRows)(
        'keeps %s at %i bits locked below min_level and open at it',
        (mode, bitWidth, minLevel) => {
            expect(isUnlocked(minLevel - 1, mode, bitWidth)).toBe(false)
            expect(isUnlocked(minLevel, mode, bitWidth)).toBe(true)
        }
    )

    it('publishes the binding caps of the ladder', () => {
        expect(CONVERSION_UNLOCK_CAP).toBe(13)
        expect(UNICODE_UNLOCK_CAP).toBe(4)
        expect(minLevelFor('hex_to_bin', 32)).toBe(CONVERSION_UNLOCK_CAP)
        expect(minLevelFor('unicode', 32)).toBe(UNICODE_UNLOCK_CAP)
    })

    it('flattens the seed without drifting from the lookup', () => {
        for (const rule of UNLOCK_SEED) {
            expect(rule.min_level).toBe(minLevelFor(rule.mode, rule.bit_width))
            expect(BIT_WIDTHS_BY_MODE[rule.mode]).toContain(rule.bit_width)
        }
        for (const mode of GAME_MODES) {
            const rows = UNLOCK_SEED.filter((rule) => rule.mode === mode)
            expect(rows.map((rule) => rule.bit_width)).toEqual([...BIT_WIDTHS_BY_MODE[mode]])
        }
    })

    it('throws on a tier the mode never has (a client bug must be loud)', () => {
        expect(() => minLevelFor('unicode', 4)).toThrow(RangeError)
        expect(() => minLevelFor('hex_to_bin', 24)).toThrow(RangeError)
        expect(() => minLevelFor('bin_to_dec', 12)).toThrow(RangeError)
    })

    describe('tierGates', () => {
        it('gates nothing while no profile is loaded', () => {
            for (const mode of GAME_MODES) {
                const gates = tierGates(mode, null)
                expect(gates.every((gate) => gate.isUnlocked)).toBe(true)
                expect(gates.map((gate) => gate.bitWidth)).toEqual([...BIT_WIDTHS_BY_MODE[mode]])
            }
        })

        const conversionMatrix: ReadonlyArray<[number, number[]]> = [
            [1, [4]],
            [3, [4]],
            [4, [4, 8]],
            [7, [4, 8]],
            [8, [4, 8, 16]],
            [12, [4, 8, 16]],
            [13, [4, 8, 16, 32]],
        ]

        it.each(conversionMatrix)(
            'opens the conversion tiers %j for a level-%i player',
            (level, open) => {
                const gates = tierGates('hex_to_bin', level)
                expect(gates.filter((gate) => gate.isUnlocked).map((gate) => gate.bitWidth)).toEqual(open)
            }
        )

        const unicodeMatrix: ReadonlyArray<[number, number[]]> = [
            [1, [8]],
            [2, [8, 16]],
            [3, [8, 16, 24]],
            [4, [8, 16, 24, 32]],
            [9, [8, 16, 24, 32]],
        ]

        it.each(unicodeMatrix)('opens the unicode tiers %j for a level-%i player', (level, open) => {
            const gates = tierGates('unicode', level)
            expect(gates.filter((gate) => gate.isUnlocked).map((gate) => gate.bitWidth)).toEqual(open)
        })

        it('gives every conversion mode the same ladder', () => {
            for (const mode of CONVERSION_MODES) {
                expect(tierGates(mode, 5)).toEqual(tierGates('hex_to_bin', 5))
            }
        })

        it('carries the min_level of every gate so the UI can name it', () => {
            for (const mode of GAME_MODES) {
                for (const gate of tierGates(mode, 1)) {
                    expect(gate.minLevel).toBe(minLevelFor(mode, gate.bitWidth))
                }
            }
        })

        it('never revokes: a higher level sees a superset of tiers', () => {
            for (const mode of GAME_MODES) {
                let opened: readonly number[] = []
                for (let level = 1; level <= CONVERSION_UNLOCK_CAP + 1; level += 1) {
                    const next = tierGates(mode, level)
                        .filter((gate) => gate.isUnlocked)
                        .map((gate) => gate.bitWidth)
                    expect(next.length).toBeGreaterThanOrEqual(opened.length)
                    for (const bitWidth of opened) {
                        expect(next).toContain(bitWidth)
                    }
                    opened = next
                }
            }
        })
    })

    describe('lockedLevelsFor (the shape the selectors consume)', () => {
        it('names the still-locked tiers with the level that opens them', () => {
            expect(lockedLevelsFor('hex_to_bin', 1)).toEqual({ 8: 4, 16: 8, 32: 13 })
            expect(lockedLevelsFor('unicode', 1)).toEqual({ 16: 2, 24: 3, 32: 4 })
        })

        it('translates the wire width into the selector unit', () => {
            expect(lockedLevelsFor('unicode', 1, bytesForBits)).toEqual({ 2: 2, 3: 3, 4: 4 })
        })

        it('is empty once everything is open', () => {
            expect(lockedLevelsFor('hex_to_bin', CONVERSION_UNLOCK_CAP)).toEqual({})
            expect(lockedLevelsFor('unicode', UNICODE_UNLOCK_CAP)).toEqual({})
            expect(lockedLevelsFor('hex_to_bin', null)).toEqual({})
        })

        it('only ever names options the mode actually offers', () => {
            for (const option of Object.keys(lockedLevelsFor('unicode', 1, bytesForBits))) {
                expect(UNICODE_BYTE_OPTIONS).toContain(Number(option))
            }
            for (const option of Object.keys(lockedLevelsFor('hex_to_bin', 1))) {
                expect(CONVERSION_BIT_WIDTHS).toContain(Number(option))
            }
        })
    })
})
