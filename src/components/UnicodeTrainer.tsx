import {useState, useEffect, useCallback, useRef} from 'react';
import type { Score } from '../types.tsx';
import {api, type UserType} from "../services/api.ts";

interface Props {
    user: UserType;
    onUpdate: (user: UserType) => void;
}

export default function UnicodeTrainer({ user, onUpdate }: Props) {
    const [bytes, setBytes] = useState(1);
    const [question, setQuestion] = useState('');
    const [char, setChar] = useState('');
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [userAnswer, setUserAnswer] = useState('');
    const [score, setScore] = useState<Score>({ correct: 0, wrong: 0, points: 0 });
    const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Ref für das Input-Feld, um den Fokus programmatisch zu setzen
    const inputRef = useRef<HTMLInputElement>(null);

    // --- Kern-Logik: UTF-8 Encoding ---
    const encodeToUTF8Binary = (codePoint: number): string => {
        let binary = "";
        if (codePoint <= 0x7F) {
            binary = codePoint.toString(2).padStart(8, '0');
        } else if (codePoint <= 0x7FF) {
            const b = codePoint.toString(2).padStart(11, '0');
            binary = `110${b.slice(0, 5)}10${b.slice(5)}`;
        } else if (codePoint <= 0xFFFF) {
            const b = codePoint.toString(2).padStart(16, '0');
            binary = `1110${b.slice(0, 4)}10${b.slice(4, 10)}10${b.slice(10)}`;
        } else {
            const b = codePoint.toString(2).padStart(21, '0');
            binary = `11110${b.slice(0, 3)}10${b.slice(3, 9)}10${b.slice(9, 15)}10${b.slice(15)}`;
        }
        return binary;
    };

    const generateQuestion = useCallback(() => {
        let min = 0, max = 0;

        // Ranges für die gewählte Byte-Anzahl festlegen
        switch (bytes) {
            case 1: min = 0x0000; max = 0x007F; break;
            case 2: min = 0x0080; max = 0x07FF; break;
            case 3: min = 0x0800; max = 0xFFFF; break;
            case 4: min = 0x10000; max = 0x10FFFF; break;
        }

        const randomCP = Math.floor(Math.random() * (max - min + 1)) + min;

        setQuestion(`U+${randomCP.toString(16).toUpperCase().padStart(4, '0')}`);
        setChar(String.fromCodePoint(randomCP));
        setCorrectAnswer(encodeToUTF8Binary(randomCP));
        setUserAnswer('');
        setFeedback('none');

        // Optional: Fokus auch beim Wechseln des Modus/Generieren der Frage setzen
        setTimeout(() => inputRef.current?.focus(), 0);
    }, [bytes]);

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
        val = val.replace(/[^01]/g, ''); // Nur 0 und 1

        setUserAnswer(val);
    };


    const handleCheck = async () => {
        if (isSubmitting || !userAnswer.trim()) return;
        setIsSubmitting(true);

        const isCorrect = userAnswer.trim().toUpperCase() === correctAnswer.toUpperCase();

        try {
            if (isCorrect) {
                setFeedback('correct');
                const res = await api.updateUserCorrect(user.name, bytes + 8);
                onUpdate(res.user); // State in App.tsx updaten
                setTimeout(generateQuestion, 600);
            } else {
                setFeedback('wrong');
                const res = await api.updateUserIncorrect(user.name, bytes * 8);
                onUpdate(res.user); // State in App.tsx updaten
                setTimeout(() => setFeedback('none'), 1000);
            }
        } catch (e) {
            console.error("Fehler beim Senden ans Backend", e);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="transition-opacity duration-300">
            <div className="flex mb-6">
         <span className="px-4 py-2 rounded-lg font-medium text-sm bg-indigo-600 text-white shadow-md">
            Unicode → UTF-8 Binary
         </span>
            </div>

            <div className={`bg-slate-800 p-6 md:p-8 rounded-xl shadow-lg border-2 transition-colors duration-300 ${
                feedback === 'correct' ? 'border-green-500' :
                    feedback === 'wrong' ? 'border-red-500' : 'border-slate-700'
            }`}>

                {/* Config & Stats (Konsistent zum Hex-Trainer) */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-slate-900/50 p-4 rounded-lg">
                    <div className="flex items-center gap-4">
                        <span className="font-semibold text-slate-400">Bytes:</span>
                        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
                            <button onClick={() => setBytes(b => Math.max(1, b - 1))} className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-700 text-indigo-400 font-bold text-xl">-</button>
                            <span className="w-10 text-center font-mono text-lg text-white">{bytes}</span>
                            <button onClick={() => setBytes(b => Math.min(4, b + 1))} className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-700 text-indigo-400 font-bold text-xl">+</button>
                        </div>
                    </div>

                    <div className="flex gap-6 text-lg font-mono bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                        <div className="flex flex-col items-center">
                            <span className="text-xs text-slate-500 uppercase">Richtig</span>
                            <span className="text-green-400 font-bold">{user.correct}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-xs text-slate-500 uppercase">Falsch</span>
                            {/* Wichtig: Hier 'incorrect' gemäß Backend-Model nutzen */}
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
                        UTF-8 Binär-Maske bilden
                    </div>
                    <div className="flex flex-col items-center gap-2 mb-10">
                        <div className="text-5xl md:text-7xl font-mono tracking-wider text-white select-none">
                            {question}
                        </div>
                        <div className="text-6xl mt-2 drop-shadow-lg h-20 flex items-center">
                            {char}
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <div className="flex justify-center gap-3 w-full max-w-lg">
                            <input
                                type="text"
                                ref={inputRef}
                                autoFocus
                                value={userAnswer}
                                onChange={handleInputChange}
                                onKeyDown={e => e.key === 'Enter' && handleCheck()}
                                placeholder="z.B. 1110xxxx 10xxxxxx..."
                                className={`bg-slate-900 border-2 rounded-lg px-6 py-4 text-xl md:text-2xl font-mono text-white focus:outline-none w-full text-center shadow-inner transition-colors ${
                                    feedback === 'wrong' ? 'border-red-500 bg-red-900/10' : 'border-slate-600 focus:border-indigo-500'
                                }`}
                            />
                            <button
                                onClick={handleCheck}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg text-2xl font-bold transition-all active:scale-95 shadow-lg"
                            >
                                ✓
                            </button>
                        </div>

                        {feedback === 'wrong' && (
                            <div className="text-red-400 text-sm font-mono flex flex-col gap-1">
                                <span>Versuch's nochmal!</span>
                                <span className="text-slate-500 text-xs">(Tipp: Achte auf die korrekten Start-Bits je Byte)</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Info Bereich für den Lernfaktor */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-500 font-mono">
                <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                    <p className="text-slate-400 mb-1 font-bold">UTF-8 Regeln:</p>
                    <ul>
                        <li>1 Byte: 0xxxxxxx</li>
                        <li>2 Byte: 110xxxxx 10xxxxxx</li>
                    </ul>
                </div>
                <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                    <p className="text-slate-400 mb-1 font-bold">UTF-8 Regeln:</p>
                    <ul>
                        <li>3 Byte: 1110xxxx 10xxxxxx 10xxxxxx</li>
                        <li>4 Byte: 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}