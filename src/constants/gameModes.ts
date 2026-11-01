/**
 * Frozen mode contract for POST /api/game/answer (Sprint 4, OQ-7).
 *
 * `bit_width` is measured in BITS in every mode. The unicode trainer keeps
 * bytes as its UI unit (1..4) and converts here, so the x8 arithmetic exists
 * exactly once instead of being duplicated per component.
 *
 * Direction is a UI-only concept: the six hex/bin directions collapse onto three
 * backend modes because opposite directions award identical XP.
 */

export const BITS_PER_BYTE = 8;

/** Backend modes the answer endpoint accepts (D-2 seed). */
export type GameMode = 'hex_to_bin' | 'hex_to_dec' | 'bin_to_dec' | 'unicode';

/** UI directions of the hex/bin trainer — the label decides which way to convert. */
export type HexBinDirection =
    | 'HexToBin'
    | 'HexToDec'
    | 'BinToHex'
    | 'BinToDec'
    | 'DecToHex'
    | 'DecToBin';

export const GAME_MODES: readonly GameMode[] = [
    'hex_to_bin',
    'hex_to_dec',
    'bin_to_dec',
    'unicode',
];

export const HEX_BIN_MODES: readonly HexBinDirection[] = [
    'HexToBin',
    'HexToDec',
    'BinToHex',
    'BinToDec',
    'DecToHex',
    'DecToBin',
];

export const DIRECTION_TO_MODE: Readonly<Record<HexBinDirection, GameMode>> = {
    HexToBin: 'hex_to_bin',
    BinToHex: 'hex_to_bin',
    HexToDec: 'hex_to_dec',
    DecToHex: 'hex_to_dec',
    BinToDec: 'bin_to_dec',
    DecToBin: 'bin_to_dec',
};

/** Conversion tiers, in bits. */
export const CONVERSION_BIT_WIDTHS: readonly number[] = [4, 8, 16, 32];

/** Unicode tiers, in bytes — the UI unit, never the wire unit. */
export const UNICODE_BYTE_OPTIONS: readonly number[] = [1, 2, 3, 4];

export const bitsForBytes = (bytes: number): number => bytes * BITS_PER_BYTE;

/** Inverse of {@link bitsForBytes}, for display copy that thinks in bytes. */
export const bytesForBits = (bits: number): number => bits / BITS_PER_BYTE;

export const UNICODE_BIT_WIDTHS: readonly number[] = UNICODE_BYTE_OPTIONS.map(bitsForBytes);

/** Per-mode wire widths; US-39 reads this table for level gating. */
export const BIT_WIDTHS_BY_MODE: Readonly<Record<GameMode, readonly number[]>> = {
    hex_to_bin: CONVERSION_BIT_WIDTHS,
    hex_to_dec: CONVERSION_BIT_WIDTHS,
    bin_to_dec: CONVERSION_BIT_WIDTHS,
    unicode: UNICODE_BIT_WIDTHS,
};

export const modeForDirection = (direction: HexBinDirection): GameMode =>
    DIRECTION_TO_MODE[direction];

// ==================== Unlock gating (US-39, D-2 seed) ====================

/** Binding caps of the D-2 ladder: nothing opens above these levels. */
export const CONVERSION_UNLOCK_CAP = 13;
export const UNICODE_UNLOCK_CAP = 4;

/** Frontend copy of the server's frozen seed (`game_config.py`). */
const MIN_LEVEL_BY_MODE: Readonly<Record<GameMode, Readonly<Record<number, number>>>> = {
    hex_to_bin: { 4: 1, 8: 4, 16: 8, 32: CONVERSION_UNLOCK_CAP },
    hex_to_dec: { 4: 1, 8: 4, 16: 8, 32: CONVERSION_UNLOCK_CAP },
    bin_to_dec: { 4: 1, 8: 4, 16: 8, 32: CONVERSION_UNLOCK_CAP },
    unicode: { 8: 1, 16: 2, 24: 3, 32: UNICODE_UNLOCK_CAP },
};

/** One row of the seed — the shape `newly_unlocked` travels in. */
export interface UnlockRule {
    readonly mode: GameMode;
    readonly bit_width: number;
    readonly min_level: number;
}

/** A tier plus the level that opens it. */
export interface TierGate {
    readonly bitWidth: number;
    readonly minLevel: number;
    readonly isUnlocked: boolean;
}

export const UNLOCK_SEED: readonly UnlockRule[] = GAME_MODES.flatMap((mode) =>
    BIT_WIDTHS_BY_MODE[mode].map((bitWidth) => ({
        mode,
        bit_width: bitWidth,
        min_level: minLevelFor(mode, bitWidth),
    }))
);

/**
 * Unlocks are a pure function of level — no unlock-state table, and because the
 * XP floor (OQ-4) stops `level` from ever dropping, a tier can never be revoked.
 *
 * @throws RangeError on a tier the mode never has (a client bug must be loud,
 *         not silently render as "unlocked from level 0").
 */
export function minLevelFor(mode: GameMode, bitWidth: number): number {
    const minLevel: number | undefined = MIN_LEVEL_BY_MODE[mode][bitWidth];
    if (minLevel === undefined) {
        throw new RangeError(`No unlock rule for ${mode} at ${bitWidth} bits (D-2 seed)`);
    }
    return minLevel;
}

export const isUnlocked = (level: number, mode: GameMode, bitWidth: number): boolean =>
    level >= minLevelFor(mode, bitWidth);

/**
 * Every tier of a mode with its gate.
 *
 * @param playerLevel - `null` while no profile is loaded: nothing is gated, and
 *        the server's 403 remains the real boundary (US-31/UN-05).
 */
export const tierGates = (mode: GameMode, playerLevel: number | null): readonly TierGate[] =>
    BIT_WIDTHS_BY_MODE[mode].map((bitWidth) => {
        const minLevel = minLevelFor(mode, bitWidth);
        return {
            bitWidth,
            minLevel,
            isUnlocked: playerLevel === null || playerLevel >= minLevel,
        };
    });

/**
 * The tier a session opens on: the lowest one the profile already owns (US-46).
 *
 * Derived from the seed rather than hardcoded, so the preselected tier can never
 * drift into a locked one — a level-1 account that opened on 8 bits had its very
 * first answer rejected by the server gate with 403.
 *
 * Deliberately *not* the newest unlocked tier: auto-promoting would override a
 * choice the player already made, and the plan pins the default to slot 1 for
 * every level (AC 3). A level-13 player therefore still starts at 4 bits and
 * climbs on their own.
 *
 * Slot 1 opens at level 1 in every mode of the seed, so a profile the ladder can
 * actually hold always finds an unlocked tier and the throw stays unreachable.
 *
 * @param playerLevel - `null` while no profile is loaded (guest), which shares
 *        {@link tierGates}' "nothing is gated" reading and lands on slot 1.
 * @param gates - the gate list to pick from; defaults to the live seed for this
 *        mode/level. Injectable so a test can hand in a *perturbed* ladder (one
 *        where slot 1 is not the first unlocked tier) and prove the result tracks
 *        the gates rather than a constant `BIT_WIDTHS_BY_MODE[mode][0]` — the
 *        seed as shipped makes every default slot 1, so the real ladder alone
 *        cannot distinguish "reads the level" from "ignores the level".
 * @throws RangeError when the mode offers no unlocked tier — same loud failure
 *         as {@link minLevelFor}, because a silent default here would repaint
 *         the 403 trap this function exists to close.
 */
export function defaultTierFor(
    mode: GameMode,
    playerLevel: number | null,
    gates: readonly TierGate[] = tierGates(mode, playerLevel)
): number {
    const firstOpen: TierGate | undefined = gates.find((gate) => gate.isUnlocked)
    if (firstOpen === undefined) {
        throw new RangeError(`No unlocked tier for ${mode} at level ${playerLevel} (D-2 seed)`)
    }
    return firstOpen.bitWidth
}

/**
 * `option value → min_level` for every still-locked tier, shaped for the generic
 * selectors. `toOptionValue` translates a wire width into the selector's unit —
 * identity for the bit selectors, {@link bytesForBits} for the byte selector.
 */
export function lockedLevelsFor(
    mode: GameMode,
    playerLevel: number | null,
    toOptionValue: (bitWidth: number) => number = (bitWidth) => bitWidth
): Readonly<Record<number, number>> {
    return Object.fromEntries(
        tierGates(mode, playerLevel)
            .filter((gate) => !gate.isUnlocked)
            .map((gate) => [toOptionValue(gate.bitWidth), gate.minLevel])
    );
}
