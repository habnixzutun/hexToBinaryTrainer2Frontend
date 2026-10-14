import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { api, type UserType } from '../services/api.ts';
import { useI18n } from '../i18n/useI18n.ts';

type Mode = 'HexToBin' | 'HexToDec' | 'BinToHex' | 'BinToDec' | 'DecToHex' | 'DecToBin';

interface Props {
    user: UserType;
    onUpdate: (user: UserType) => void;
}

export default function HexBinTrainer({ user, onUpdate }: Props) {
    const modes: Mode[] = ['HexToBin', 'HexToDec', 'BinToHex', 'BinToDec', 'DecToHex', 'DecToBin'];
    const { t } = useI18n();

    const [activeMode, setActiveMode] = useState<Mode>('HexToBin');
    const [bits, setBits] = useState(8);
    const [question, setQuestion] = useState('');
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
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
            const msg = e instanceof Error ? e.message : 'Fehler';
            throw new Error(msg);
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

    const [fromLabel, toLabel] = activeMode.split('To') as [string, string];

    return (
        <div className="flex flex-col h-full">
            {/* Top bar */}
            <div className="flex items-center border-b border-neutral-800/60 h-16 px-6 shrink-0 gap-1">
                {modes.map((m) => (
                    <button
                        key={m}
                        onClick={() => setActiveMode(m)}
                        className={`px-3 h-full text-sm font-medium transition-colors border-b-2 -mb-px ${
                            activeMode === m
                                ? 'text-white border-emerald-500'
                                : 'text-neutral-500 border-transparent hover:text-neutral-300'
                        }`}
                    >
                        {m}
                    </button>
                ))}

                {/* Bits stepper */}
                <div className="ml-auto flex items-center gap-2 shrink-0">
                    <span className="text-sm text-neutral-500 uppercase tracking-wider">{t.bits}</span>
                    <div className="flex items-center">
                        <button
                            onClick={() => adjustBits(-4)}
                            className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-neutral-200 transition-colors"
                        >
                            <ChevronLeft strokeWidth={2} size={16} />
                        </button>
                        <span className="w-8 text-center text-base font-mono text-neutral-300">{bits}</span>
                        <button
                            onClick={() => adjustBits(4)}
                            className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-neutral-200 transition-colors"
                        >
                            <ChevronRight strokeWidth={2} size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Two-column question area */}
            <div className="flex-1 flex items-center justify-center px-8 gap-0">
                <div className="flex items-stretch gap-8 w-full max-w-3xl">

                    {/* Left: source value */}
                    <div className="flex-1 flex flex-col">
                        <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500 mb-4">
                            {fromLabel}
                        </p>
                        <div className="flex-1 flex items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950 min-h-36 px-6 py-8">
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={question}
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 8 }}
                                    transition={{ duration: 0.15 }}
                                    className="font-mono text-4xl tracking-widest text-white select-none break-all text-center leading-snug"
                                >
                                    {question}
                                </motion.span>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center justify-center pt-10 shrink-0">
                        <ArrowRight strokeWidth={1.5} size={32} className="text-neutral-600" />
                    </div>

                    {/* Right: answer input */}
                    <div className="flex-1 flex flex-col">
                        <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500 mb-4">
                            {toLabel}
                        </p>
                        <div className={`flex-1 flex items-center justify-center rounded-lg border min-h-36 px-6 py-8 transition-colors ${
                            feedback === 'wrong' ? 'border-red-500/60 bg-red-500/5' :
                            feedback === 'correct' ? 'border-emerald-500/60 bg-emerald-500/5' :
                            'border-neutral-800 bg-neutral-950 focus-within:border-neutral-700'
                        }`}>
                            <input
                                id="game-input-field"
                                name="binary-input-unique"
                                ref={inputRef}
                                type="text"
                                autoComplete="one-time-code"
                                autoFocus
                                disabled={isSubmitting}
                                value={userAnswer}
                                onChange={handleInputChange}
                                onKeyDown={e => e.key === 'Enter' && handleCheck()}
                                placeholder={t.inputPlaceholder(toLabel ?? '')}
                                className="w-full bg-transparent text-2xl font-mono text-white placeholder-neutral-700 focus:outline-none text-center tracking-widest leading-snug"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom bar: feedback + submit */}
            <div className="h-16 px-8 border-t border-neutral-800/60 flex items-center justify-between shrink-0">
                <AnimatePresence>
                    {feedback === 'wrong' && (
                        <motion.p
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-base text-red-500/80 font-mono"
                        >
                            {t.tryAgain}
                        </motion.p>
                    )}
                </AnimatePresence>
                <motion.button
                    onClick={handleCheck}
                    disabled={isSubmitting || !userAnswer.trim()}
                    whileTap={{ scale: 0.95 }}
                    className={`ml-auto flex items-center gap-2 px-5 py-2.5 rounded-md text-base font-semibold transition-all ${
                        !userAnswer.trim() || isSubmitting
                            ? 'text-neutral-600 bg-neutral-900 cursor-not-allowed'
                            : feedback === 'wrong'
                                ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20'
                                : 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                    }`}
                >
                    {feedback === 'wrong'
                        ? <><X strokeWidth={2.5} size={18} /> Falsch</>
                        : <><Check strokeWidth={2.5} size={18} /> Prüfen</>
                    }
                </motion.button>
            </div>
        </div>
    );
}
