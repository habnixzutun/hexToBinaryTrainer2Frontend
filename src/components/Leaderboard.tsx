import { useEffect, useState } from 'react';
import { api, type UserType } from '../services/api.ts';

interface Props {
    currentUser: UserType;
    refreshTrigger: number;
}

export default function Leaderboard({ currentUser, refreshTrigger }: Props) {
    const [data, setData] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshData = async () => {
        setLoading(true);
        const result = await api.getLeaderboard();
        // Sortierung nach Punkten
        const sorted = result.sort((a, b) => b.points - a.points);
        setData(sorted);
        setLoading(false);
    };

    useEffect(() => {
        refreshData();
    }, [refreshTrigger]); // Lädt neu, wenn refreshTrigger sich ändert

    // Optionales Polling alle 30 Sekunden
    useEffect(() => {
        const interval = setInterval(refreshData, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="mt-8 bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 relative">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    Bestenliste
                    {loading && <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>}
                </h3>
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
                        const isMe = entry.name === currentUser.name;
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
                                <td className="py-3 px-4 text-center text-red-400/80">{entry.incorrect}</td>
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