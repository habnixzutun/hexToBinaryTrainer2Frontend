import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { api, type UserType } from '../services/api.ts';
import { useI18n } from '../i18n/useI18n.ts';

interface Props {
    currentUser: UserType;
    refreshTrigger: number;
}

const MEDALS: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' };

export default function Leaderboard({ currentUser, refreshTrigger }: Props) {
    const [data, setData] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useI18n();

    const refreshData = useCallback(async (): Promise<void> => {
        setLoading(true);
        const result = await api.getLeaderboard();
        setData([...result].sort((a, b) => b.points - a.points));
        setLoading(false);
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        refreshData();
    }, [refreshTrigger, refreshData]);

    useEffect(() => {
        const interval = setInterval(refreshData, 30000);
        return () => clearInterval(interval);
    }, [refreshData]);

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between h-14 px-4 border-b border-neutral-800/60 shrink-0">
                <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                    {t.leaderboardTitle}
                </span>
                {loading && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />}
            </div>

            {/* Column headers */}
            <div className="flex items-center px-4 py-2 shrink-0">
                <span className="w-7 shrink-0" />
                <span className="flex-1 text-xs font-semibold uppercase tracking-widest text-neutral-500">{t.name}</span>
                <span className="w-10 text-xs font-semibold uppercase tracking-widest text-neutral-500 text-right">✓</span>
                <span className="w-10 text-xs font-semibold uppercase tracking-widest text-neutral-500 text-right">✗</span>
                <span className="w-14 text-xs font-semibold uppercase tracking-widest text-neutral-500 text-right">PTS</span>
            </div>

            {/* Rows */}
            <div className="flex-1 overflow-y-auto">
                {data.map((entry, idx) => {
                    const isMe = entry.name === currentUser.name;

                    return (
                        <motion.div
                            key={entry.name}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.04 }}
                            className={`flex items-center px-4 py-3 border-b border-neutral-800/30 transition-colors ${
                                isMe ? 'bg-emerald-500/5' : 'hover:bg-neutral-900/60'
                            }`}
                        >
                            {/* Rank */}
                            <span className="w-7 shrink-0 text-sm">
                                {idx in MEDALS
                                    ? <span>{MEDALS[idx]}</span>
                                    : <span className="text-neutral-500 font-mono text-xs">{idx + 1}</span>
                                }
                            </span>

                            {/* Name */}
                            <span className={`flex-1 text-sm font-medium truncate ${
                                isMe ? 'text-emerald-400' : 'text-neutral-300'
                            }`}>
                                {entry.name}
                                {isMe && <span className="ml-1 text-neutral-500 font-normal text-xs">{t.me}</span>}
                            </span>

                            {/* Correct */}
                            <span className="w-10 text-xs font-mono text-neutral-400 text-right">
                                {entry.correct}
                            </span>

                            {/* Incorrect */}
                            <span className="w-10 text-xs font-mono text-neutral-400 text-right">
                                {entry.incorrect}
                            </span>

                            {/* Points */}
                            <div className="w-14 flex items-center justify-end gap-1">
                                <Zap
                                    strokeWidth={1.5}
                                    size={11}
                                    className={isMe ? 'text-emerald-500' : 'text-amber-500/60'}
                                />
                                <span className={`text-sm font-bold font-mono ${
                                    isMe ? 'text-emerald-400' : 'text-neutral-300'
                                }`}>
                                    {entry.points.toLocaleString()}
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
