import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
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
            <div className="flex items-center gap-0 border-b border-neutral-800/60 h-14 px-6 shrink-0">
                {byteOptions.map(b => (
                    <button
                        key={b}
                        onClick={() => setBytes(b)}
                        className={`px-3 h-full text-sm font-medium transition-colors border-b-2 -mb-px ${
                            bytes === b
                                ? 'text-white border-emerald-500'
                                : 'text-neutral-500 border-transparent hover:text-neutral-300'
                        }`}
                    >
                        {b} {b === 1 ? 'Byte' : 'Bytes'}
                    </button>
                ))}
                <div className="ml-auto">
                    <span className="text-xs text-neutral-500 font-mono">{t.unicodeModeLabel}</span>
                </div>
            </div>

            {/* Question */}
            <div className="flex-1 flex flex-col items-center justify-center px-12 gap-8">
                <div className="text-center">
                    <p className="text-xs text-neutral-500 uppercase tracking-widest mb-6">
                        {t.unicodeTaskLabel}
                    </p>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={question}
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            transition={{ duration: 0.15 }}
                            className="flex flex-col items-center gap-3"
                        >
                            <span className="font-mono text-5xl tracking-widest text-white select-none">{question}</span>
                            <span className="text-4xl select-none">{char}</span>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Input */}
                <div className="flex flex-col items-center gap-3 w-full max-w-md">
                    <div className="flex items-center gap-2 w-full">
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
                                value={userAnswer}
                                onChange={handleInputChange}
                                onKeyDown={e => e.key === 'Enter' && handleCheck()}
                                placeholder={t.unicodePlaceholder}
                                className="w-full bg-transparent py-2 text-lg font-mono text-white placeholder-neutral-600 focus:outline-none text-center"
                            />
                        </div>
                        <motion.button
                            onClick={handleCheck}
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

                    <AnimatePresence>
                        {feedback === 'wrong' && (
                            <motion.p
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-sm text-red-500/80 font-mono"
                            >
                                {t.tryAgain} <span className="text-neutral-500">{t.tryAgainHint}</span>
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>

                {/* UTF-8 reference */}
                <div className="text-xs font-mono text-neutral-500 space-y-0.5 text-center">
                    <p>1B: 0xxxxxxx &nbsp;&nbsp; 2B: 110xxxxx 10xxxxxx</p>
                    <p>3B: 1110xxxx 10xxxxxx 10xxxxxx &nbsp;&nbsp; 4B: 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx</p>
                </div>
            </div>
        </div>
    );
}
