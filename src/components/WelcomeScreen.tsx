import { useState } from 'react';

interface Props {
    onJoin: (name: string) => void;
}

export default function WelcomeScreen({ onJoin }: Props) {
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim().length >= 2) {
            onJoin(name.trim());
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
                <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">
                    IT-TRAINER
                </h1>
                <p className="text-slate-400 mb-8">Gib deinen Namen ein, um dein Training zu starten und in die Bestenliste einzusteigen.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        autoFocus
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Dein Username..."
                        className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-6 py-4 text-white text-xl focus:outline-none focus:border-blue-500 transition-colors text-center"
                    />
                    <button
                        type="submit"
                        disabled={name.trim().length < 2}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-bold py-4 rounded-xl text-xl transition-all active:scale-95 shadow-lg shadow-blue-900/20"
                    >
                        Los geht's!
                    </button>
                </form>
            </div>
        </div>
    );
}