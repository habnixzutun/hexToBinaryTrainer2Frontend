import { useState, useEffect, useCallback, useRef } from 'react';
import { api, type UserType } from '../services/api.ts';

type Mode = 'HexToBin' | 'HexToDec' | 'BinToHex' | 'BinToDec' | 'DecToHex' | 'DecToBin';

interface Props {
    user: UserType;
    onUpdate: (user: UserType) => void;
}

export default function HexBinTrainer({ user, onUpdate }: Props) {
    const modes: Mode[] = ['HexToBin', 'HexToDec', 'BinToHex', 'BinToDec', 'DecToHex', 'DecToBin'];

    const [activeMode, setActiveMode] = useState<Mode>('HexToBin');
    const [bits, setBits] = useState(8);
    const [question, setQuestion] = useState('');
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Ref für das Input-Feld, um den Fokus programmatisch zu setzen
    const inputRef = useRef<HTMLInputElement>(null);

    const generateQuestion = useCallback(() => {
        const max = Math.pow(2, bits) - 1;
        const min = Math.pow(2, bits - 4) - 1;
        const randomVal = Math.floor(Math.random() * (max - min + 1) + min);
        let q = '', a = '';

        switch (activeMode) {
            case 'HexToBin': q = randomVal.toString(16).toUpperCase(); a = randomVal.toString(2).padStart(bits, '0'); break;
            case 'HexToDec': q = randomVal.toString(16).toUpperCase(); a = randomVal.toString(10); break;
            case 'BinToHex': q = randomVal.toString(2).padStart(bits, '0'); a = randomVal.toString(16).toUpperCase(); break;
            case 'BinToDec': q = randomVal.toString(2).padStart(bits, '0'); a = randomVal.toString(10); break;
            case 'DecToHex': q = randomVal.toString(10); a = randomVal.toString(16).toUpperCase(); break;
            case 'DecToBin': q = randomVal.toString(10); a = randomVal.toString(2).padStart(bits, '0'); break;
        }
        setQuestion(q); setCorrectAnswer(a); setUserAnswer(''); setFeedback('none');

        // Optional: Fokus auch beim Wechseln des Modus/Generieren der Frage setzen
        setTimeout(() => inputRef.current?.focus(), 0);
    }, [activeMode, bits]);

    useEffect(() => { generateQuestion(); }, [generateQuestion]);

    // Effekt, um den Fokus zurückzuholen, wenn isSubmitting wieder false wird
    useEffect(() => {
        if (!isSubmitting && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isSubmitting]);

    // Filtert die Eingabe basierend auf dem aktiven Modus
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        const targetFormat = activeMode.split('To')[1]; // 'Bin', 'Dec', oder 'Hex'

        if (targetFormat === 'Bin') {
            val = val.replace(/[^01]/g, ''); // Nur 0 und 1
        } else if (targetFormat === 'Dec') {
            val = val.replace(/[^0-9]/g, ''); // Nur 0-9
        } else if (targetFormat === 'Hex') {
            val = val.replace(/[^0-9a-fA-F]/g, ''); // Nur 0-9, a-f, A-F
        }

        setUserAnswer(val);
    };

    const handleCheck = async () => {
        if (isSubmitting || !userAnswer.trim()) return;
        setIsSubmitting(true);
        const normalize = (str: string) =>
            str.trim().toUpperCase().replace(/^0+/, '');

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
        } catch (e) {
            console.error("Fehler beim Senden ans Backend", e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const adjustBits = (delta: number) => {
        setBits(prev => {
            const next = prev + delta;
            return next >= 4 && next <= 32 ? next : prev;
        });
    };

    return (
        <div className="transition-opacity duration-300">
            <div className="flex flex-wrap gap-2 mb-6">
                {modes.map(m => (
                    <button
                        key={m}
                        onClick={() => setActiveMode(m)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                            activeMode === m ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                    >
                        {m}
                    </button>
                ))}
            </div>

            <div className={`bg-slate-800 p-6 md:p-8 rounded-xl shadow-lg border-2 transition-colors duration-300 ${
                feedback === 'correct' ? 'border-green-500' :
                    feedback === 'wrong' ? 'border-red-500' : 'border-slate-700'
            }`}>

                {/* Config & Stats */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-slate-900/50 p-4 rounded-lg">
                    <div className="flex items-center gap-4">
                        <span className="font-semibold text-slate-400">Bits:</span>
                        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
                            <button onClick={() => adjustBits(-4)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-700 text-indigo-400 font-bold text-xl">-</button>
                            <span className="w-10 text-center font-mono text-lg text-white">{bits}</span>
                            <button onClick={() => adjustBits(4)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-700 text-indigo-400 font-bold text-xl">+</button>
                        </div>
                    </div>

                    <div className="flex gap-6 text-lg font-mono bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                        <div className="flex flex-col items-center">
                            <span className="text-xs text-slate-500 uppercase">Richtig</span>
                            <span className="text-green-400 font-bold">{user.correct}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-xs text-slate-500 uppercase">Falsch</span>
                            <span className="text-red-400 font-bold">{user.incorrect}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-xs text-slate-500 uppercase">Score</span>
                            <span className="text-yellow-400 font-bold">{user.points}</span>
                        </div>
                    </div>
                </div>

                {/* Spielbereich */}
                <div className="text-center py-4">
                    <div className="text-slate-500 text-sm mb-2 uppercase tracking-widest font-semibold">
                        Übersetze {activeMode.split('To')[0]}
                    </div>
                    <div className="text-5xl md:text-7xl font-mono tracking-wider text-white mb-10 break-all select-none">
                        {question}
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex justify-center gap-3 w-full max-w-md">
                            <input
                                id="game-input-field" // ID für die Barrierefreiheit
                                name="binary-input-unique" // Name gegen Autofill-Verwirrung
                                ref={inputRef}
                                type="text"
                                autoComplete="one-time-code" // Trick: Chrome denkt, es sei ein SMS-Code und lässt Kreditkarten in Ruhe
                                autoFocus
                                disabled={isSubmitting}
                                value={userAnswer}
                                onChange={handleInputChange}
                                onKeyDown={e => e.key === 'Enter' && handleCheck()}
                                placeholder={`${activeMode.split('To')[1]} eingeben...`}
                                className={`bg-slate-900 border-2 rounded-lg px-6 py-4 text-2xl font-mono text-white focus:outline-none w-full text-center shadow-inner transition-colors ${
                                    feedback === 'wrong' ? 'border-red-500 bg-red-900/10' : 'border-slate-600 focus:border-indigo-500'
                                }`}
                            />
                            <button
                                onClick={handleCheck}
                                disabled={isSubmitting || !userAnswer.trim()}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg text-2xl font-bold transition-all active:scale-95 shadow-lg disabled:opacity-50"
                            >
                                ✓
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}