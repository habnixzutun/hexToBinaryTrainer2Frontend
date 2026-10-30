import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ArrowRight } from 'lucide-react';
import { type GameAnswerResponse } from '../services/api.ts';
import { bitsForBytes, bytesForBits, tierGates } from '../constants/gameModes.ts';
import { useAnswerSubmission } from '../hooks/useAnswerSubmission.ts';
import { useI18n } from '../i18n/useI18n.ts';
import { flashAccent } from '../utils/flashAccent.ts';
import AnswerFeedback, { QUESTION_DELAY_MS, WRONG_FEEDBACK_MS } from './AnswerFeedback.tsx';
import TierLockBadge from './TierLockBadge.tsx';
import AppFooter from './AppFooter.tsx';

interface Props {
    onUpdate: () => void;
    /** Receives the raw /answer payload so the server numbers stay authoritative. */
    onGameResult?: (result: GameAnswerResponse) => void;
    /** Guest mode: count the answer locally instead of calling the backend. */
    onGuestAnswer?: ((isCorrect: boolean) => void) | undefined;
    bytes?: number;
    onBytesChange?: (bytes: number) => void;
    /**
     * Level from the profile. `undefined` renders every tier selectable — an
     * isolated component test, or a guest (no profile, no gating: the server
     * never sees their answers).
     */
    playerLevel?: number | undefined;
}

/** Accessible description for a locked tier (US-39 AC-2). */
const lockHintId = (bytes: number): string => `unicode-byte-lock-${bytes}`;

/** The tier a round was generated for — a stale round is detectable by key. */
const roundKey = (bytes: number): string => `unicode:${bytes}`;

interface Round {
    readonly key: string;
    /**
     * Monotonic, so focus and transitions can follow every round even when two
     * rounds in a row land on the same code point.
     */
    readonly index: number;
    readonly question: string;
    readonly char: string;
    readonly correctAnswer: string;
}

/** Code point ranges per UTF-8 sequence length, in bytes. */
const RANGES: Readonly<Record<number, readonly [number, number]>> = {
    1: [0x0000, 0x007F], 2: [0x0080, 0x07FF],
    3: [0x0800, 0xFFFF], 4: [0x10000, 0x10FFFF],
};

const encodeToUTF8Binary = (cp: number): string => {
    if (cp <= 0x7F) return cp.toString(2).padStart(8, '0');
    if (cp <= 0x7FF) { const b = cp.toString(2).padStart(11, '0'); return `110${b.slice(0, 5)}10${b.slice(5)}`; }
    if (cp <= 0xFFFF) { const b = cp.toString(2).padStart(16, '0'); return `1110${b.slice(0, 4)}10${b.slice(4, 10)}10${b.slice(10)}`; }
    const b = cp.toString(2).padStart(21, '0');
    return `11110${b.slice(0, 3)}10${b.slice(3, 9)}10${b.slice(9, 15)}10${b.slice(15)}`;
};

/**
 * The dice live at module scope: the component body stays pure, which is what
 * lets a new round be generated during render instead of from an effect.
 */
const createRound = (bytes: number, index: number): Round => {
    const [min, max] = RANGES[bytes] ?? [0, 0x7F];
    const cp = Math.floor(Math.random() * (max - min + 1)) + min;
    return {
        key: roundKey(bytes),
        index,
        question: `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`,
        char: String.fromCodePoint(cp),
        correctAnswer: encodeToUTF8Binary(cp),
    };
};

export default function UnicodeTrainer({ onUpdate, onGameResult, onGuestAnswer, bytes: externalBytes, onBytesChange, playerLevel }: Props) {
    const [internalBytes, setInternalBytes] = useState(1);
    const bytes = externalBytes ?? internalBytes;
    const setBytes = onBytesChange ?? setInternalBytes;
    const { t } = useI18n();
    const [round, setRound] = useState<Round>(() => createRound(bytes, 0));
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
    // A 403 means our unlock view drifted from the server's — pull the profile
    // so the tier list catches up instead of dead-ending on the hint (AC-4).
    const { submit, isSubmitting, errorMessage, cooldownMs, clearError } = useAnswerSubmission(onUpdate);
    const inputRef = useRef<HTMLInputElement>(null);

    // The selector counts bytes, the gate speaks bits (OQ-7) — one translation,
    // in the shared module, on the way in.
    const byteTiers = tierGates('unicode', playerLevel ?? null).map((gate) => ({
        bytes: bytesForBits(gate.bitWidth),
        minLevel: gate.minLevel,
        isUnlocked: gate.isUnlocked,
    }));

    // Changing tier is changing round. Adjusting during render (React's prev-
    // value pattern) puts the new code point in the same commit as the tab click;
    // an effect would paint the stale one once more, and the compiler rejects
    // setState in an effect body outright.
    const key = roundKey(bytes);
    if (round.key !== key) {
        setRound(createRound(bytes, round.index + 1));
        setUserAnswer('');
        setFeedback('none');
    }

    // The caret follows the round: a fresh question and a finished submission
    // both hand focus back to the input.
    const focusToken = isSubmitting ? null : round.index;
    useEffect(() => {
        if (focusToken === null) return;
        inputRef.current?.focus();
    }, [focusToken]);

    const startNextRound = (): void => {
        setRound(createRound(bytes, round.index + 1));
        setUserAnswer('');
        setFeedback('none');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setUserAnswer(e.target.value.replace(/[^01]/g, ''));
        if (errorMessage !== null) clearError();
    };

    const handleCheck = async (): Promise<void> => {
        if (isSubmitting || cooldownMs !== null || !userAnswer.trim()) return;

        const isCorrect = userAnswer.trim().toUpperCase() === round.correctAnswer.toUpperCase();

        // Feedback is optimistic locally; the economy numbers that follow are
        // not — they come back from the server untouched.
        setFeedback(isCorrect ? 'correct' : 'wrong');
        flashAccent(isCorrect ? 'correct' : 'wrong');

        if (onGuestAnswer !== undefined) {
            // Guest mode: counted in memory, no request and no cooldown to arm.
            onGuestAnswer(isCorrect);
        } else {
            // OQ-7: the UI counts bytes, the wire always carries bits.
            const result = await submit('unicode', bitsForBytes(bytes), isCorrect);
            if (result === null) return;

            if (onGameResult !== undefined) {
                onGameResult(result);
            } else {
                onUpdate();
            }
        }

        if (isCorrect) {
            setTimeout(startNextRound, QUESTION_DELAY_MS);
        } else {
            setTimeout(() => setFeedback('none'), WRONG_FEEDBACK_MS);
        }
    };

    const isNegative = errorMessage !== null || feedback === 'wrong';
    const feedbackText = errorMessage ?? (feedback === 'wrong' ? t.wrong : feedback === 'correct' ? t.correctAnswer : null);
    const isBlocked = isSubmitting || cooldownMs !== null || !userAnswer.trim();

    return (
        <div className="flex flex-col h-full" role="region" aria-label="Unicode trainer">
            {/* Top bar - byte selector — only visible on lg+ */}
            <div
                className="hidden lg:flex items-center border-b border-outline-faint h-16 px-4 sm:px-6 shrink-0 gap-1"
                role="tablist"
                aria-label="Byte selection"
            >
                {byteTiers.map(({ bytes: b, minLevel, isUnlocked: unlocked }) => (
                    <button
                        key={b}
                        // A locked tab keeps no handler at all: neither pointer
                        // nor keyboard activation can select it (AC-2).
                        onClick={unlocked ? () => setBytes(b) : undefined}
                        role="tab"
                        aria-selected={bytes === b}
                        aria-disabled={unlocked ? undefined : 'true'}
                        aria-label={`${b} ${b === 1 ? t.byte : t.bytes}`}
                        aria-describedby={unlocked ? undefined : lockHintId(b)}
                        className={`px-4 h-full text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap flex items-center gap-1 ${
                            bytes === b
                                ? 'text-on-surface border-accent'
                                : 'text-on-surface-faint border-transparent hover:text-on-surface-dim'
                        } ${unlocked ? '' : 'opacity-50'}`}
                    >
                        {b} {b === 1 ? t.byte : t.bytes}
                        {!unlocked && (
                            <TierLockBadge minLevel={minLevel} hintId={lockHintId(b)} hint={t.lockedUntilLevel(minLevel)} />
                        )}
                    </button>
                ))}
                <div className="ml-auto shrink-0">
                    <span className="text-sm text-on-surface-faint font-mono" aria-label="Current mode">
                        {t.unicodeModeLabel}
                    </span>
                </div>
            </div>

            {/* Question + answer area */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-4 gap-4">
                <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-8 w-full max-w-3xl">
                    {/* Left: Unicode codepoint */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <label className="text-sm font-semibold uppercase tracking-widest text-on-surface-faint mb-4" htmlFor="unicode-value">
                            Unicode
                        </label>
                        <div
                            id="unicode-value"
                            className="flex-1 flex flex-col items-center justify-center rounded-lg border border-outline bg-surface-alt min-h-36 px-4 sm:px-6 py-8 gap-4"
                            aria-live="polite"
                            aria-atomic="true"
                        >
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={round.question}
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 8 }}
                                    transition={{ duration: 0.15 }}
                                    className="flex flex-col items-center gap-3"
                                >
                                    <span className="font-mono text-2xl sm:text-3xl md:text-4xl tracking-widest text-on-surface select-none">
                                        {round.question}
                                    </span>
                                    <span className="text-4xl sm:text-5xl select-none" aria-label={`Character: ${round.char}`}>
                                        {round.char}
                                    </span>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Arrow - hide on small screens */}
                    <div className="hidden md:flex items-center justify-center pt-10 shrink-0">
                        <ArrowRight strokeWidth={1.5} size={32} className="text-on-surface-subtle" aria-hidden="true" />
                    </div>

                    {/* Right: UTF-8 binary input */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <label className="text-sm font-semibold uppercase tracking-widest text-on-surface-faint mb-4" htmlFor="utf8-input">
                            UTF-8 Binary
                        </label>
                        <div className={`flex-1 flex items-center justify-center rounded-lg border min-h-36 px-4 sm:px-6 py-8 transition-colors ${
                            isNegative ? 'border-error-text/60 bg-error-muted' :
                            feedback === 'correct' ? 'border-accent/60 bg-accent-muted' :
                            'border-outline bg-surface-alt focus-within:border-accent'
                        }`}>
                            <input
                                id="utf8-input"
                                ref={inputRef}
                                type="text"
                                autoComplete="off"
                                autoFocus
                                value={userAnswer}
                                onChange={handleInputChange}
                                onKeyDown={e => e.key === 'Enter' && handleCheck()}
                                placeholder={t.unicodePlaceholder}
                                aria-label="UTF-8 binary answer"
                                aria-describedby="utf8-help"
                                className="w-full bg-transparent text-xl sm:text-2xl font-mono text-on-surface placeholder-on-surface-subtle focus:outline-none text-center tracking-wider leading-snug"
                            />
                        </div>
                        <span id="utf8-help" className="sr-only">
                            {typeof t.srUtf8Binary === 'string' ? t.srUtf8Binary : 'Enter the UTF-8 binary representation using 0s and 1s'}
                        </span>
                    </div>
                </div>

                {/* Feedback + Check button below boxes */}
                <div className="flex flex-col items-center gap-3 w-full max-w-3xl">
                    <AnswerFeedback message={feedbackText} negative={isNegative} />
                    <motion.button
                        onClick={handleCheck}
                        disabled={isBlocked}
                        whileTap={{ scale: 0.98 }}
                        aria-label={feedback === 'wrong' ? 'Check answer (incorrect)' : 'Check answer'}
                        className={`w-full flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-lg text-lg font-semibold transition-all duration-200 ${
                            isBlocked
                                ? 'text-on-surface-subtle bg-surface-raised cursor-not-allowed'
                                : feedback === 'wrong'
                                    ? 'text-white bg-error-text hover:bg-error-text/90 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-error-text focus-visible:ring-offset-2 focus-visible:ring-offset-surface'
                                    : 'text-emerald-100 bg-emerald-800 hover:bg-emerald-700 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface'
                        }`}
                    >
                        {feedback === 'wrong'
                            ? <><X strokeWidth={2} size={20} aria-hidden="true" /> {t.wrong}</>
                            : <><Check strokeWidth={2} size={20} aria-hidden="true" /> {t.check}</>
                        }
                    </motion.button>
                </div>
            </div>

            <AppFooter />
        </div>
    );
}
