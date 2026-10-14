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
    const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
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
                const res = await api.updateUserCorrect(user.name, bytes + 8);
                onUpdate(res.user);
                setTimeout(generateQuestion, 600);
            } else {
                setFeedback('wrong');
                const res = await api.updateUserIncorrect(user.name, bytes * 8);
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

    const byteOptions = [1, 2, 3, 4];

    return (
        <div className="flex flex-col h-full">
            {/* Top bar */}
            <div className="flex items-center border-b border-neutral-800/60 h-16 px-6 shrink-0 gap-1">
                {byteOptions.map(b => (
                    <button
                        key={b}
                        onClick={() => setBytes(b)}
                        className={`px-4 h-full text-sm font-medium transition-colors border-b-2 -mb-px ${
                            bytes === b
                                ? 'text-white border-emerald-500'
                                : 'text-neutral-500 border-transparent hover:text-neutral-300'
                        }`}
                    >
                        {b} {b === 1 ? 'Byte' : 'Bytes'}
                    </button>
                ))}
                <div className="ml-auto">
                    <span className="text-sm text-neutral-500 font-mono">{t.unicodeModeLabel}</span>
                </div>
            </div>

            {/* Two-column layout */}
            <div className="flex-1 flex items-center justify-center px-8 gap-0">
                <div className="flex items-stretch gap-8 w-full max-w-3xl">

                    {/* Left: Unicode codepoint */}
                    <div className="flex-1 flex flex-col">
                        <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500 mb-4">
                            Unicode
                        </p>
                        <div className="flex-1 flex flex-col items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950 min-h-36 px-6 py-8 gap-4">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={question}
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 8 }}
                                    transition={{ duration: 0.15 }}
                                    className="flex flex-col items-center gap-3"
                                >
                                    <span className="font-mono text-4xl tracking-widest text-white select-none">
                                        {question}
                                    </span>
                                    <span className="text-5xl select-none">{char}</span>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center justify-center pt-10 shrink-0">
                        <ArrowRight strokeWidth={1.5} size={32} className="text-neutral-600" />
                    </div>

                    {/* Right: UTF-8 binary input */}
                    <div className="flex-1 flex flex-col">
                        <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500 mb-4">
                            UTF-8 Binary
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
                                value={userAnswer}
                                onChange={handleInputChange}
                                onKeyDown={e => e.key === 'Enter' && handleCheck()}
                                placeholder={t.unicodePlaceholder}
                                className="w-full bg-transparent text-2xl font-mono text-white placeholder-neutral-700 focus:outline-none text-center tracking-wider leading-snug"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom bar: UTF-8 reference + submit */}
            <div className="h-16 px-8 border-t border-neutral-800/60 flex items-center gap-4 shrink-0">
                <p className="text-xs font-mono text-neutral-600 hidden lg:block">
                    1B: 0xxxxxxx &nbsp; 2B: 110xxxxx 10xxxxxx &nbsp; 3B: 1110xxxx 10xxxxxx 10xxxxxx &nbsp; 4B: 11110xxx 10xxxxxx×3
                </p>

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
