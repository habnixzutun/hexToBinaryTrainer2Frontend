import { describe, it, expect } from 'vitest'
import {
    BITS_PER_BYTE,
    BIT_WIDTHS_BY_MODE,
    CONVERSION_BIT_WIDTHS,
    DIRECTION_TO_MODE,
    GAME_MODES,
    HEX_BIN_MODES,
    UNICODE_BIT_WIDTHS,
    UNICODE_BYTE_OPTIONS,
    bytesForBits,
    bitsForBytes,
    modeForDirection,
    type GameMode,
} from '../../src/constants/gameModes.ts'

/**
 * US-38 AC-1: the direction -> mode mapper and the per-mode wire widths are the
 * single source of truth for everything the answer endpoint accepts.
 */
describe('gameModes', () => {
    describe('direction -> mode mapper', () => {
        // Six UI directions collapse onto three backend modes; direction is UI-only.
        const cases: Array<[string, GameMode]> = [
            ['HexToBin', 'hex_to_bin'],
            ['BinToHex', 'hex_to_bin'],
            ['HexToDec', 'hex_to_dec'],
            ['DecToHex', 'hex_to_dec'],
            ['BinToDec', 'bin_to_dec'],
            ['DecToBin', 'bin_to_dec'],
        ]

        it.each(cases)('maps the %s direction to %s', (direction, expected) => {
            expect(modeForDirection(direction as (typeof HEX_BIN_MODES)[number])).toBe(expected)
        })

        it('covers every UI direction exactly once', () => {
            expect(HEX_BIN_MODES).toHaveLength(6)
            expect(Object.keys(DIRECTION_TO_MODE)).toHaveLength(HEX_BIN_MODES.length)
            for (const direction of HEX_BIN_MODES) {
                expect(DIRECTION_TO_MODE[direction]).toBe(modeForDirection(direction))
            }
        })

        it('never invents a mode outside the frozen enum', () => {
            for (const direction of HEX_BIN_MODES) {
                expect(GAME_MODES).toContain(modeForDirection(direction))
            }
        })

        it('lists the four backend modes incl. unicode', () => {
            expect([...GAME_MODES]).toEqual(['hex_to_bin', 'hex_to_dec', 'bin_to_dec', 'unicode'])
        })

        it('awards identical XP for opposite directions (mapper collapses them)', () => {
            expect(modeForDirection('HexToBin')).toBe(modeForDirection('BinToHex'))
            expect(modeForDirection('HexToDec')).toBe(modeForDirection('DecToHex'))
            expect(modeForDirection('BinToDec')).toBe(modeForDirection('DecToBin'))
        })
    })

    describe('bit_width units (OQ-7: bits in every mode)', () => {
        it('uses 4/8/16/32 bits for the conversion modes', () => {
            expect([...CONVERSION_BIT_WIDTHS]).toEqual([4, 8, 16, 32])
        })

        it('uses 8/16/24/32 bits for unicode — 1..4 bytes, never byte counts', () => {
            expect([...UNICODE_BIT_WIDTHS]).toEqual([8, 16, 24, 32])
        })

        it.each([
            [1, 8],
            [2, 16],
            [3, 24],
            [4, 32],
        ])('sends %i byte(s) as bit_width %i (the x8 arithmetic survived)', (bytes, bits) => {
            expect(bitsForBytes(bytes)).toBe(bits)
        })

        it('maps byte options one-to-one onto the unicode wire widths', () => {
            expect(UNICODE_BYTE_OPTIONS.map(bitsForBytes)).toEqual([...UNICODE_BIT_WIDTHS])
        })

        it('inverts cleanly for display copy', () => {
            for (const bytes of UNICODE_BYTE_OPTIONS) {
                expect(bytesForBits(bitsForBytes(bytes))).toBe(bytes)
            }
        })

        it('defines one byte as eight bits', () => {
            expect(BITS_PER_BYTE).toBe(8)
        })

        it('exposes the per-mode width table used by the upcoming gate', () => {
            expect([...BIT_WIDTHS_BY_MODE.hex_to_bin]).toEqual([...CONVERSION_BIT_WIDTHS])
            expect([...BIT_WIDTHS_BY_MODE.hex_to_dec]).toEqual([...CONVERSION_BIT_WIDTHS])
            expect([...BIT_WIDTHS_BY_MODE.bin_to_dec]).toEqual([...CONVERSION_BIT_WIDTHS])
            expect([...BIT_WIDTHS_BY_MODE.unicode]).toEqual([...UNICODE_BIT_WIDTHS])
        })

        it('rejects byte counts on the unicode wire (4 bits is not a unicode width)', () => {
            expect(UNICODE_BIT_WIDTHS).not.toContain(4)
        })
    })
})
