import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
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

    return (
        <div className="flex flex-col h-full">
            {/* Top bar */}
            <div className="flex items-center gap-0 border-b border-neutral-800/60 h-14 px-6 shrink-0">
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

                {/* Bits stepper — pushed right */}
                <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-neutral-500 uppercase tracking-wider">{t.bits}</span>
                    <div className="flex items-center gap-0">
                        <button
                            onClick={() => adjustBits(-4)}
                            className="w-7 h-7 flex items-center justify-center text-neutral-500 hover:text-neutral-200 transition-colors"
                        >
                            <ChevronLeft strokeWidth={2} size={14} />
                        </button>
                        <span className="w-7 text-center text-sm font-mono text-neutral-300">{bits}</span>
                        <button
                            onClick={() => adjustBits(4)}
                            className="w-7 h-7 flex items-center justify-center text-neutral-500 hover:text-neutral-200 transition-colors"
                        >
                            <ChevronRight strokeWidth={2} size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Question area */}
            <div className="flex-1 flex flex-col items-center justify-center px-12 gap-8">
                <div className="text-center">
                    <p className="text-xs text-neutral-500 uppercase tracking-widest mb-6">
                        {t.translateFrom} {activeMode.split('To')[0]}
                    </p>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={question}
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            transition={{ duration: 0.15 }}
                            className="font-mono text-5xl tracking-widest text-white select-none break-all"
                        >
                            {question}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Input */}
                <div className="flex items-center gap-2 w-full max-w-sm">
                    <div className={`flex-1 border-b-2 transition-colors ${
                        feedback === 'wrong' ? 'border-red-500' :
                        feedback === 'correct' ? 'border-emerald-500' :
                        'border-neutral-700 focus-within:border-neutral-500'
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
                            placeholder={t.inputPlaceholder(activeMode.split('To')[1] ?? '')}
                            className="w-full bg-transparent py-2 text-xl font-mono text-white placeholder-neutral-600 focus:outline-none text-center"
                        />
                    </div>
                    <motion.button
                        onClick={handleCheck}
                        disabled={isSubmitting || !userAnswer.trim()}
                        whileTap={{ scale: 0.93 }}
                        className={`w-9 h-9 rounded-md flex items-center justify-center transition-all shrink-0 ${
                            !userAnswer.trim() || isSubmitting
                                ? 'text-neutral-600'
                                : feedback === 'wrong'
                                    ? 'text-red-500'
                                    : 'text-emerald-500 hover:bg-emerald-500/10'
                        }`}
                    >
                        {feedback === 'wrong'
                            ? <X strokeWidth={2.5} size={18} />
                            : <Check strokeWidth={2.5} size={18} />
                        }
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
