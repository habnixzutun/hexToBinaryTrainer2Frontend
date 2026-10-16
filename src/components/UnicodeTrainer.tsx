import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ArrowRight } from 'lucide-react';
import { api, type UserType } from '../services/api.ts';
import { useI18n } from '../i18n/useI18n.ts';

interface Props {
    user: UserType;
    onUpdate: (user: UserType) => void;
}

export default function UnicodeTrainer({ user, onUpdate }: Props) {
    const [bytes, setBytes] = useState(1);
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
                const res = await api.updateUserCorrect(user.name, bytes * 8);
                onUpdate(res.user);
                setTimeout(generateQuestion, 600);
            } else {
                setFeedback('wrong');
                const res = await api.updateUserIncorrect(user.name, bytes * 8);
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

    const byteOptions = [1, 2, 3, 4];

    return (
        <div className="flex flex-col h-full" role="region" aria-label="Unicode trainer">
            {/* Top bar */}
            <div className="flex items-center border-b border-outline-faint h-16 px-4 sm:px-6 shrink-0 gap-1 overflow-x-auto" role="tablist" aria-label="Byte selection">
                {byteOptions.map(b => (
                    <button
                        key={b}
                        onClick={() => setBytes(b)}
                        role="tab"
                        aria-selected={bytes === b}
                        aria-label={`${b} ${b === 1 ? 'byte' : 'bytes'}`}
                        className={`px-4 h-full text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                            bytes === b
                                ? 'text-on-surface border-accent'
                                : 'text-on-surface-faint border-transparent hover:text-on-surface-dim'
                        }`}
                    >
                        {b} {b === 1 ? 'Byte' : 'Bytes'}
                    </button>
                ))}
                <div className="ml-auto shrink-0">
                    <span className="text-sm text-on-surface-faint font-mono" aria-label="Current mode">
                        {t.unicodeModeLabel}
                    </span>
                </div>
            </div>

            {/* Two-column layout - responsive */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-4 gap-0">
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
                            Enter the UTF-8 binary representation using 0s and 1s
                        </span>
                    </div>
                </div>
            </div>

            {/* Bottom bar: UTF-8 reference + submit */}
            <div className="h-16 px-4 sm:px-8 border-t border-outline-faint flex items-center gap-4 shrink-0">
                <p className="text-xs font-mono text-on-surface-subtle hidden lg:block" aria-label="UTF-8 encoding reference">
                    1B: 0xxxxxxx &nbsp; 2B: 110xxxxx 10xxxxxx &nbsp; 3B: 1110xxxx 10xxxxxx 10xxxxxx &nbsp; 4B: 11110xxx 10xxxxxx×3
                </p>

                <div className="flex-1 min-w-0">
                    <AnimatePresence>
                        {feedback === 'wrong' && (
                            <motion.p
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-base text-error-text font-mono truncate"
                                role="alert"
                                aria-live="assertive"
                            >
                                {t.tryAgain}
                            </motion.p>
                        )}
                        {feedback === 'correct' && (
                            <motion.p
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-base text-accent font-mono truncate"
                                role="status"
                                aria-live="polite"
                            >
                                ✓ Correct!
                            </motion.p>
                        )}
                        {feedback === 'error' && (
                            <motion.p
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-base text-error-text font-mono truncate"
                                role="alert"
                                aria-live="assertive"
                            >
                                Error saving result. Please try again.
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>

                <motion.button
                    onClick={handleCheck}
                    disabled={isSubmitting || !userAnswer.trim()}
                    whileTap={{ scale: 0.95 }}
                    aria-label={feedback === 'wrong' ? 'Check answer (incorrect)' : 'Check answer'}
                    className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-md text-base font-semibold transition-all ${
                        !userAnswer.trim() || isSubmitting
                            ? 'text-on-surface-subtle bg-surface-raised cursor-not-allowed'
                            : feedback === 'wrong'
                                ? 'text-error-text bg-error-muted hover:bg-red-500/20'
                                : 'text-accent bg-accent-muted hover:bg-emerald-500/20'
                    }`}
                >
                    {feedback === 'wrong'
                        ? <><X strokeWidth={2.5} size={18} aria-hidden="true" /> Falsch</>
                        : <><Check strokeWidth={2.5} size={18} aria-hidden="true" /> Prüfen</>
                    }
                </motion.button>
            </div>
        </div>
    );
}
