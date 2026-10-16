import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ArrowRight } from 'lucide-react';
import { api, type UserType } from '../services/api.ts';
import { useI18n } from '../i18n/useI18n.ts';
import AppFooter from './AppFooter.tsx';

type Mode = 'HexToBin' | 'HexToDec' | 'BinToHex' | 'BinToDec' | 'DecToHex' | 'DecToBin';

const BIT_OPTIONS = [4, 8, 16, 32];

interface Props {
    user: UserType;
    onUpdate: (user: UserType) => void;
    activeMode?: Mode;
    bits?: number;
    onBitsChange?: (bits: number) => void;
}

export default function HexBinTrainer({ user, onUpdate, activeMode: externalMode, bits: externalBits, onBitsChange }: Props) {
    const { t } = useI18n();

    const [internalMode] = useState<Mode>('HexToBin');
    const activeMode = externalMode ?? internalMode;

    const [internalBits, setInternalBits] = useState(8);
    const bits = externalBits ?? internalBits;
    const setBits = onBitsChange ?? setInternalBits;

    const [question, setQuestion] = useState('');
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong' | 'error'>('none');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const generateQuestion = useCallback((): void => {
        const max = Math.pow(2, bits) - 1;
        const min = Math.pow(2, bits - 4) - 1;
        const v = Math.floor(Math.random() * (max - min + 1) + min);
        const hex = v.toString(16).toUpperCase();
        const bin = v.toString(2).padStart(bits, '0');
        const dec = v.toString(10);
        const qa: Record<Mode, [string, string]> = {
            HexToBin: [hex, bin], HexToDec: [hex, dec],
            BinToHex: [bin, hex], BinToDec: [bin, dec],
            DecToHex: [dec, hex], DecToBin: [dec, bin],
        };
        const [q, a] = qa[activeMode];
        setQuestion(q);
        setCorrectAnswer(a);
        setUserAnswer('');
        setFeedback('none');
        setTimeout(() => inputRef.current?.focus(), 0);
    }, [activeMode, bits]);

    useEffect(() => { generateQuestion(); }, [generateQuestion]);

    useEffect(() => {
        if (!isSubmitting) inputRef.current?.focus();
    }, [isSubmitting]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const targetFormat = activeMode.split('To')[1];
        const raw = e.target.value;
        const FILTERS: Partial<Record<string, RegExp>> = {
            Bin: /[^01]/g, Dec: /[^0-9]/g, Hex: /[^0-9a-fA-F]/g,
        };
        const pattern = targetFormat !== undefined ? FILTERS[targetFormat] : undefined;
        setUserAnswer(pattern !== undefined ? raw.replace(pattern, '') : raw);
    };

    const handleCheck = async (): Promise<void> => {
        if (isSubmitting || !userAnswer.trim()) return;
        setIsSubmitting(true);
        const normalize = (s: string) => s.trim().toUpperCase().replace(/^0+/, '');
        const isCorrect = normalize(userAnswer) === normalize(correctAnswer);
        try {
            if (isCorrect) {
                setFeedback('correct');
                const res = await api.updateUserCorrect(user.name, bits);
                onUpdate(res.user);
                setTimeout(generateQuestion, 600);
            } else {
                setFeedback('wrong');
                const res = await api.updateUserIncorrect(user.name, bits);
                onUpdate(res.user);
                setTimeout(() => setFeedback('none'), 1000);
            }
        } catch (e: unknown) {
            console.error('API error:', e);
            setFeedback('error');
            setTimeout(() => setFeedback('none'), 2000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const [fromLabel, toLabel] = activeMode.split('To') as [string, string];

    return (
        <div className="flex flex-col h-full" role="region" aria-label="Hex/Binary trainer">
            {/* Top bar - bit selector — only visible on lg+ */}
            <div
                className="hidden lg:flex items-center border-b border-outline-faint h-16 px-4 sm:px-6 shrink-0 gap-1"
                role="tablist"
                aria-label="Bit selection"
            >
                {BIT_OPTIONS.map((b) => (
                    <button
                        key={b}
                        onClick={() => setBits(b)}
                        role="tab"
                        aria-selected={bits === b}
                        aria-label={`${b} ${t.bits}`}
                        className={`px-4 h-full text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                            bits === b
                                ? 'text-on-surface border-accent'
                                : 'text-on-surface-faint border-transparent hover:text-on-surface-dim'
                        }`}
                    >
                        {b} {t.bits}
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
                                    key={question}
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 8 }}
                                    transition={{ duration: 0.15 }}
                                    className="font-mono text-2xl sm:text-3xl md:text-4xl tracking-widest text-on-surface select-none break-all text-center leading-snug"
                                >
                                    {question}
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
                            feedback === 'wrong' ? 'border-error-text/60 bg-error-muted' :
                            feedback === 'correct' ? 'border-accent/60 bg-accent-muted' :
                            feedback === 'error' ? 'border-error-text/60 bg-error-muted' :
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
                    <AnimatePresence>
                        {feedback === 'wrong' && (
                            <motion.p
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-base text-error-text font-mono"
                                role="alert"
                                aria-live="assertive"
                            >
                                {t.wrong}
                            </motion.p>
                        )}
                        {feedback === 'correct' && (
                            <motion.p
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-base text-accent font-mono"
                                role="status"
                                aria-live="polite"
                            >
                                <Check size={18} strokeWidth={2.5} className="inline mr-1" aria-hidden="true" />
                                {t.correctAnswer}
                            </motion.p>
                        )}
                        {feedback === 'error' && (
                            <motion.p
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-base text-error-text font-mono"
                                role="alert"
                                aria-live="assertive"
                            >
                                <X size={18} strokeWidth={2.5} className="inline mr-1" aria-hidden="true" />
                                {t.errorSaving}
                            </motion.p>
                        )}
                    </AnimatePresence>
                    <motion.button
                        onClick={handleCheck}
                        disabled={isSubmitting || !userAnswer.trim()}
                        whileTap={{ scale: 0.98 }}
                        aria-label={feedback === 'wrong' ? 'Check answer (incorrect)' : 'Check answer'}
                        className={`w-full flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-lg text-lg font-semibold transition-all duration-200 ${
                            !userAnswer.trim() || isSubmitting
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
