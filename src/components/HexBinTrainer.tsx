import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { api, type UserType } from '../services/api.ts';
import { useI18n } from '../i18n/useI18n.ts';

type Mode = 'HexToBin' | 'HexToDec' | 'BinToHex' | 'BinToDec' | 'DecToHex' | 'DecToBin';

const ALL_MODES: Mode[] = ['HexToBin', 'HexToDec', 'BinToHex', 'BinToDec', 'DecToHex', 'DecToBin'];

interface Props {
    user: UserType;
    onUpdate: (user: UserType) => void;
    activeMode?: Mode;
    onModeChange?: (mode: Mode) => void;
}

export default function HexBinTrainer({ user, onUpdate, activeMode: externalMode, onModeChange }: Props) {
    const { t } = useI18n();

    const [internalMode, setInternalMode] = useState<Mode>('HexToBin');
    const activeMode = externalMode ?? internalMode;

    const [bits, setBits] = useState(8);
    const [question, setQuestion] = useState('');
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong' | 'error'>('none');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const tabListRef = useRef<HTMLDivElement>(null);

    // Check if tab bar can scroll right and show gradient hint
    useEffect(() => {
        const tabList = tabListRef.current;
        if (!tabList) return;

        const checkScroll = () => {
            const { scrollLeft, scrollWidth, clientWidth } = tabList;
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
        };

        checkScroll();
        tabList.addEventListener('scroll', checkScroll);
        window.addEventListener('resize', checkScroll);

        return () => {
            tabList.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
        };
    }, []);

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

    const adjustBits = (delta: number): void => {
        setBits(prev => {
            const next = prev + delta;
            return next >= 4 && next <= 32 ? next : prev;
        });
    };

    const handleModeChange = (mode: Mode): void => {
        if (onModeChange) {
            onModeChange(mode);
        } else {
            setInternalMode(mode);
        }
    };

    const [fromLabel, toLabel] = activeMode.split('To') as [string, string];

    return (
        <div className="flex flex-col h-full" role="region" aria-label="Hex/Binary trainer">
            {/* Top bar - mode selector and bits stepper — only visible on lg+ */}
            <div
                ref={tabListRef}
                className={`hidden lg:flex items-center border-b border-outline-faint h-16 px-4 sm:px-6 shrink-0 gap-1 overflow-x-auto ${
                    canScrollRight ? 'mask-r-fade' : ''
                }`}
                role="tablist"
                aria-label="Conversion modes"
            >
                {ALL_MODES.map((m) => (
                    <button
                        key={m}
                        onClick={() => handleModeChange(m)}
                        role="tab"
                        aria-selected={activeMode === m}
                        aria-label={`${m.split('To')[0]} to ${m.split('To')[1]}`}
                        className={`px-3 h-full text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                            activeMode === m
                                ? 'text-on-surface border-accent'
                                : 'text-on-surface-faint border-transparent hover:text-on-surface-dim'
                        }`}
                    >
                        {t[`mode${m}` as keyof typeof t] as string}
                    </button>
                ))}

                {/* Bits stepper */}
                <div className="ml-auto flex items-center gap-2 shrink-0">
                    <span className="text-sm text-on-surface-faint uppercase tracking-wider" id="bits-label">{t.bits}</span>
                    <div className="flex items-center" role="group" aria-labelledby="bits-label">
                        <button
                            onClick={() => adjustBits(-4)}
                            aria-label={`Decrease bits by 4, currently ${bits}`}
                            disabled={bits <= 4}
                            className="w-11 h-11 flex items-center justify-center text-on-surface-faint hover:text-on-surface-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft strokeWidth={2} size={16} aria-hidden="true" />
                        </button>
                        <span className="w-8 text-center text-base font-mono text-on-surface-dim" aria-live="polite" aria-atomic="true">
                            {bits}
                        </span>
                        <button
                            onClick={() => adjustBits(4)}
                            aria-label={`Increase bits by 4, currently ${bits}`}
                            disabled={bits >= 32}
                            className="w-11 h-11 flex items-center justify-center text-on-surface-faint hover:text-on-surface-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight strokeWidth={2} size={16} aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Two-column question area - responsive */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-4 gap-0">
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
            </div>

            {/* Bottom bar: feedback + submit */}
            <div className="h-16 px-4 sm:px-8 border-t border-outline-faint flex items-center justify-between shrink-0 gap-4">
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
                                {t.wrong}
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
                                <Check size={18} strokeWidth={2.5} className="inline mr-1" aria-hidden="true" />
                                {t.correctAnswer}
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
                                <X size={18} strokeWidth={2.5} className="inline mr-1" aria-hidden="true" />
                                {t.errorSaving}
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
                        ? <><X strokeWidth={2.5} size={18} aria-hidden="true" /> {t.wrong}</>
                        : <><Check strokeWidth={2.5} size={18} aria-hidden="true" /> {t.check}</>
                    }
                </motion.button>
            </div>
        </div>
    );
}
