import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ArrowRight } from 'lucide-react';
import { type GameAnswerResponse } from '../services/api.ts';
import { modeForDirection, tierGates, type HexBinDirection } from '../constants/gameModes.ts';
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
    activeMode?: HexBinDirection;
    bits?: number;
    onBitsChange?: (bits: number) => void;
    /**
     * Level from the profile. Omitted renders every tier selectable — only
     * isolated component tests do that; in the app the level is always known.
     */
    playerLevel?: number;
}

/** Accessible description for a locked tier (US-39 AC-2). */
const lockHintId = (bits: number): string => `hex-bit-lock-${bits}`;

/** The tier a round was generated for — a stale round is detectable by key. */
const roundKey = (mode: HexBinDirection, bits: number): string => `${mode}:${bits}`;

interface Round {
    readonly key: string;
    /**
     * Monotonic, so focus and transitions can follow every round even when two
     * rounds in a row land on the same value (a real possibility on 4 bits).
     */
    readonly index: number;
    readonly question: string;
    readonly correctAnswer: string;
}

/**
 * The dice live at module scope: the component body stays pure, which is what
 * lets a new round be generated during render instead of from an effect.
 */
const createRound = (mode: HexBinDirection, bits: number, index: number): Round => {
    const max = Math.pow(2, bits) - 1;
    const min = Math.pow(2, bits - 4) - 1;
    const v = Math.floor(Math.random() * (max - min + 1) + min);
    const hex = v.toString(16).toUpperCase();
    const bin = v.toString(2).padStart(bits, '0');
    const dec = v.toString(10);
    const pairs: Record<HexBinDirection, [string, string]> = {
        HexToBin: [hex, bin], HexToDec: [hex, dec],
        BinToHex: [bin, hex], BinToDec: [bin, dec],
        DecToHex: [dec, hex], DecToBin: [dec, bin],
    };
    const [question, correctAnswer] = pairs[mode];
    return { key: roundKey(mode, bits), index, question, correctAnswer };
};

export default function HexBinTrainer({ onUpdate, onGameResult, activeMode: externalMode, bits: externalBits, onBitsChange, playerLevel }: Props) {
    const { t } = useI18n();

    const [internalMode] = useState<HexBinDirection>('HexToBin');
    const activeMode = externalMode ?? internalMode;

    const [internalBits, setInternalBits] = useState(8);
    const bits = externalBits ?? internalBits;
    const setBits = onBitsChange ?? setInternalBits;

    const [round, setRound] = useState<Round>(() => createRound(activeMode, bits, 0));
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
    // A 403 means our unlock view drifted from the server's — pull the profile
    // so the tier list catches up instead of dead-ending on the hint (AC-4).
    const { submit, isSubmitting, errorMessage, cooldownMs, clearError } = useAnswerSubmission(onUpdate);
    const inputRef = useRef<HTMLInputElement>(null);

    const tiers = tierGates(modeForDirection(activeMode), playerLevel ?? null);

    // Changing tier is changing round. Adjusting during render (React's prev-
    // value pattern) puts the new question in the same commit as the tab click;
    // an effect would paint the stale question once more, and the compiler
    // rejects setState in an effect body outright.
    const key = roundKey(activeMode, bits);
    if (round.key !== key) {
        setRound(createRound(activeMode, bits, round.index + 1));
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
        setRound(createRound(activeMode, bits, round.index + 1));
        setUserAnswer('');
        setFeedback('none');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const targetFormat = activeMode.split('To')[1];
        const raw = e.target.value;
        const FILTERS: Partial<Record<string, RegExp>> = {
            Bin: /[^01]/g, Dec: /[^0-9]/g, Hex: /[^0-9a-fA-F]/g,
        };
        const pattern = targetFormat !== undefined ? FILTERS[targetFormat] : undefined;
        setUserAnswer(pattern !== undefined ? raw.replace(pattern, '') : raw);
        if (errorMessage !== null) clearError();
    };

    const handleCheck = async (): Promise<void> => {
        if (isSubmitting || cooldownMs !== null || !userAnswer.trim()) return;

        const normalize = (s: string): string => s.trim().toUpperCase().replace(/^0+/, '');
        const isCorrect = normalize(userAnswer) === normalize(round.correctAnswer);

        // Feedback is optimistic locally; the economy numbers that follow are
        // not — they come back from the server untouched.
        setFeedback(isCorrect ? 'correct' : 'wrong');
        flashAccent(isCorrect ? 'correct' : 'wrong');

        const result = await submit(modeForDirection(activeMode), bits, isCorrect);
        if (result === null) return;

        if (onGameResult !== undefined) {
            onGameResult(result);
        } else {
            onUpdate();
        }

        if (isCorrect) {
            setTimeout(startNextRound, QUESTION_DELAY_MS);
        } else {
            setTimeout(() => setFeedback('none'), WRONG_FEEDBACK_MS);
        }
    };

    const [fromLabel, toLabel] = activeMode.split('To') as [string, string];

    // One message slot: a server error replaces the local verdict instead of
    // stacking a second alert next to it.
    const isNegative = errorMessage !== null || feedback === 'wrong';
    const feedbackText = errorMessage ?? (feedback === 'wrong' ? t.wrong : feedback === 'correct' ? t.correctAnswer : null);
    const isBlocked = isSubmitting || cooldownMs !== null || !userAnswer.trim();

    return (
        <div className="flex flex-col h-full" role="region" aria-label="Hex/Binary trainer">
            {/* Top bar - bit selector — only visible on lg+ */}
            <div
                className="hidden lg:flex items-center border-b border-outline-faint h-16 px-4 sm:px-6 shrink-0 gap-1"
                role="tablist"
                aria-label="Bit selection"
            >
                {tiers.map(({ bitWidth: b, minLevel, isUnlocked: unlocked }) => (
                    <button
                        key={b}
                        // A locked tab keeps no handler at all: neither pointer
                        // nor keyboard activation can select it (AC-2).
                        onClick={unlocked ? () => setBits(b) : undefined}
                        role="tab"
                        aria-selected={bits === b}
                        aria-disabled={unlocked ? undefined : 'true'}
                        aria-label={`${b} ${t.bits}`}
                        aria-describedby={unlocked ? undefined : lockHintId(b)}
                        className={`px-4 h-full text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap flex items-center gap-1 ${
                            bits === b
                                ? 'text-on-surface border-accent'
                                : 'text-on-surface-faint border-transparent hover:text-on-surface-dim'
                        } ${unlocked ? '' : 'opacity-50'}`}
                    >
                        {b} {t.bits}
                        {!unlocked && (
                            <TierLockBadge minLevel={minLevel} hintId={lockHintId(b)} hint={t.lockedUntilLevel(minLevel)} />
                        )}
                    </button>
                ))}
                <div className="ml-auto shrink-0">
                    <span className="text-sm text-on-surface-faint font-mono" aria-label="Current mode">
                        {t[`mode${activeMode}` as keyof typeof t] as string}
                    </span>
                </div>
            </div>

            {/* Question + answer area */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-4 gap-4">
                <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-8 w-full max-w-3xl">
                    {/* Left: source value */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <label className="text-sm font-semibold uppercase tracking-widest text-on-surface-faint mb-4" htmlFor="source-value">
                            {fromLabel}
                        </label>
                        <div
                            id="source-value"
                            className="flex-1 flex items-center justify-center rounded-lg border border-outline bg-surface-alt min-h-36 px-4 sm:px-6 py-8"
                            aria-live="polite"
                            aria-atomic="true"
                        >
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={round.question}
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 8 }}
                                    transition={{ duration: 0.15 }}
                                    className="font-mono text-2xl sm:text-3xl md:text-4xl tracking-widest text-on-surface select-none break-all text-center leading-snug"
                                >
                                    {round.question}
                                </motion.span>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Arrow - hide on small screens */}
                    <div className="hidden md:flex items-center justify-center pt-10 shrink-0">
                        <ArrowRight strokeWidth={1.5} size={32} className="text-on-surface-subtle" aria-hidden="true" />
                    </div>

                    {/* Right: answer input */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <label className="text-sm font-semibold uppercase tracking-widest text-on-surface-faint mb-4" htmlFor="answer-input">
                            {toLabel}
                        </label>
                        <div className={`flex-1 flex items-center justify-center rounded-lg border min-h-36 px-4 sm:px-6 py-8 transition-colors ${
                            isNegative ? 'border-error-text/60 bg-error-muted' :
                            feedback === 'correct' ? 'border-accent/60 bg-accent-muted' :
                            'border-outline bg-surface-alt focus-within:border-accent'
                        }`}>
                            <input
                                id="answer-input"
                                ref={inputRef}
                                type="text"
                                autoComplete="off"
                                autoFocus
                                disabled={isSubmitting}
                                value={userAnswer}
                                onChange={handleInputChange}
                                onKeyDown={e => e.key === 'Enter' && handleCheck()}
                                placeholder={t.inputPlaceholder(toLabel)}
                                aria-label={`${toLabel} answer`}
                                aria-describedby="input-help"
                                className="w-full bg-transparent text-xl sm:text-2xl font-mono text-on-surface placeholder-on-surface-subtle focus:outline-none text-center tracking-widest leading-snug"
                            />
                        </div>
                        <span id="input-help" className="sr-only">
                            {typeof t.srAnswerFormat === 'function' ? t.srAnswerFormat(toLabel) : `Enter your answer in ${toLabel} format`}
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
                                    : 'text-accent-muted bg-accent hover:bg-accent-bright active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface'
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
