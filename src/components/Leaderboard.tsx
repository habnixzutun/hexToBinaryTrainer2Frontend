import { useEffect, useState } from 'react';
import { api, type LeaderboardEntry } from '../services/api.ts';

interface Props {
    currentUsername: string;
}

export default function Leaderboard({ currentUsername }: Props) {
    const [data, setData] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshData = async () => {
        setLoading(true);
        const result = await api.getLeaderboard();
        const array = Object.values(result);
        // Sortierung nach Punkten (absteigend)
        const sorted = [...array].sort((a, b) => b.points - a.points);
        setData(sorted);
        setLoading(false);
    };

    useEffect(() => {
        refreshData();
        // Optional: Alle 30 Sekunden automatisch aktualisieren
        const interval = setInterval(refreshData, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="mt-8 bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    Bestenliste
                    {loading && <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>}
                </h3>
                <button
                    onClick={refreshData}
                    className="text-slate-400 hover:text-white transition-colors text-2xl"
                    title="Aktualisieren"
                >
                    ⟳
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="border-b border-slate-600 text-slate-400 text-sm">
                        <th className="py-2 px-4">Platz</th>
                        <th className="py-2 px-4">Name</th>
                        <th className="py-2 px-4 text-center">✅</th>
                        <th className="py-2 px-4 text-center">❌</th>
                        <th className="py-2 px-4 text-right">Punkte ✨</th>
                    </tr>
                    </thead>
                    <tbody>
                    {data.map((entry, idx) => {
                        const isMe = entry.name === currentUsername;
                        const rankIcon = idx === 0 ? '🏆' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;

                        return (
                            <tr
                                key={entry.name}
                                className={`border-b border-slate-700/50 transition-colors ${
                                    isMe ? 'bg-blue-500/20 border-l-4 border-blue-500' : 'hover:bg-slate-700/30'
                                }`}
                            >
                                <td className="py-3 px-4 font-bold">{rankIcon}</td>
                                <td className="py-3 px-4">
                    <span className={isMe ? 'text-blue-400 font-bold' : 'text-slate-200'}>
                      {entry.name} {isMe && "(Du)"}
                    </span>
                                </td>
                                <td className="py-3 px-4 text-center text-green-400/80">{entry.correct}</td>
                                <td className="py-3 px-4 text-center text-red-400/80">{entry.wrong}</td>
                                <td className={`py-3 px-4 text-right font-bold ${isMe ? 'text-blue-400' : 'text-yellow-400'}`}>
                                    {entry.points.toLocaleString()}
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}