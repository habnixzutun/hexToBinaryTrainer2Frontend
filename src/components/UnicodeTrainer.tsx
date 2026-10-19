import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ArrowRight } from 'lucide-react';
import { gameApi } from '../services/api.ts';
import { useI18n } from '../i18n/useI18n.ts';
import AppFooter from './AppFooter.tsx';

interface Props {
    onUpdate: () => void;
    bytes?: number;
    onBytesChange?: (bytes: number) => void;
}

export default function UnicodeTrainer({ onUpdate, bytes: externalBytes, onBytesChange }: Props) {
    const [internalBytes, setInternalBytes] = useState(1);
    const bytes = externalBytes ?? internalBytes;
    const setBytes = onBytesChange ?? setInternalBytes;
    const { t } = useI18n();
    const [question, setQuestion] = useState('');
    const [char, setChar] = useState('');
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong' | 'error'>('none');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const encodeToUTF8Binary = (cp: number): string => {
        if (cp <= 0x7F) return cp.toString(2).padStart(8, '0');
        if (cp <= 0x7FF) { const b = cp.toString(2).padStart(11,'0'); return `110${b.slice(0,5)}10${b.slice(5)}`; }
        if (cp <= 0xFFFF) { const b = cp.toString(2).padStart(16,'0'); return `1110${b.slice(0,4)}10${b.slice(4,10)}10${b.slice(10)}`; }
        const b = cp.toString(2).padStart(21,'0');
        return `11110${b.slice(0,3)}10${b.slice(3,9)}10${b.slice(9,15)}10${b.slice(15)}`;
    };

    const generateQuestion = useCallback((): void => {
        const ranges: Record<number, [number, number]> = {
            1: [0x0000, 0x007F], 2: [0x0080, 0x07FF],
            3: [0x0800, 0xFFFF], 4: [0x10000, 0x10FFFF],
        };
        const [min, max] = ranges[bytes] ?? [0, 0x7F];
        const cp = Math.floor(Math.random() * (max - min + 1)) + min;
        setQuestion(`U+${cp.toString(16).toUpperCase().padStart(4, '0')}`);
        setChar(String.fromCodePoint(cp));
        setCorrectAnswer(encodeToUTF8Binary(cp));
        setUserAnswer('');
        setFeedback('none');
        setTimeout(() => inputRef.current?.focus(), 0);
    }, [bytes]);

    useEffect(() => { generateQuestion(); }, [generateQuestion]);
    useEffect(() => { if (!isSubmitting) inputRef.current?.focus(); }, [isSubmitting]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setUserAnswer(e.target.value.replace(/[^01]/g, ''));
    };

    const handleCheck = async (): Promise<void> => {
        if (isSubmitting || !userAnswer.trim()) return;
        setIsSubmitting(true);
        const isCorrect = userAnswer.trim().toUpperCase() === correctAnswer.toUpperCase();
        try {
            if (isCorrect) {
                setFeedback('correct');
                await gameApi.submitCorrect(bytes * 8);
                onUpdate();
                setTimeout(generateQuestion, 600);
            } else {
                setFeedback('wrong');
                await gameApi.submitIncorrect(bytes * 8);
                onUpdate();
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

    const byteOptions = [1, 2, 3, 4];

    return (
        <div className="flex flex-col h-full" role="region" aria-label="Unicode trainer">
            {/* Top bar - byte selector — only visible on lg+ */}
            <div
                className="hidden lg:flex items-center border-b border-outline-faint h-16 px-4 sm:px-6 shrink-0 gap-1"
                role="tablist"
                aria-label="Byte selection"
            >
                {byteOptions.map(b => (
                    <button
                        key={b}
                        onClick={() => setBytes(b)}
                        role="tab"
                        aria-selected={bytes === b}
                        aria-label={`${b} ${b === 1 ? t.byte : t.bytes}`}
                        className={`px-4 h-full text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                            bytes === b
                                ? 'text-on-surface border-accent'
                                : 'text-on-surface-faint border-transparent hover:text-on-surface-dim'
                        }`}
                    >
                        {b} {b === 1 ? t.byte : t.bytes}
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
                                    key={question}
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 8 }}
                                    transition={{ duration: 0.15 }}
                                    className="flex flex-col items-center gap-3"
                                >
                                    <span className="font-mono text-2xl sm:text-3xl md:text-4xl tracking-widest text-on-surface select-none">
                                        {question}
                                    </span>
                                    <span className="text-4xl sm:text-5xl select-none" aria-label={`Character: ${char}`}>
                                        {char}
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
                            feedback === 'wrong' ? 'border-error-text/60 bg-error-muted' :
                            feedback === 'correct' ? 'border-accent/60 bg-accent-muted' :
                            feedback === 'error' ? 'border-error-text/60 bg-error-muted' :
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
