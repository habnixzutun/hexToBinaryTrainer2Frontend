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
            <div className="flex items-center justify-between h-16 px-5 border-b border-outline-faint shrink-0">
                <span className="text-sm font-semibold uppercase tracking-widest text-on-surface-faint">
                    {t.leaderboardTitle}
                </span>
                {loading && <span className="w-2 h-2 rounded-full bg-accent animate-ping" />}
            </div>

            {/* Column headers */}
            <div className="flex items-center px-5 py-3 shrink-0">
                <span className="w-8 shrink-0" />
                <span className="flex-1 text-xs font-semibold uppercase tracking-widest text-on-surface-faint">{t.name}</span>
                <span className="w-10 text-xs font-semibold uppercase tracking-widest text-on-surface-faint text-right">✓</span>
                <span className="w-10 text-xs font-semibold uppercase tracking-widest text-on-surface-faint text-right">✗</span>
                <span className="w-16 text-xs font-semibold uppercase tracking-widest text-on-surface-faint text-right">PTS</span>
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
                            className={`flex items-center px-5 py-3.5 border-b border-outline-faint transition-colors ${
                                isMe ? 'bg-accent-muted' : 'hover:bg-surface-alt'
                            }`}
                        >
                            {/* Rank */}
                            <span className="w-8 shrink-0 text-base">
                                {idx in MEDALS
                                    ? <span>{MEDALS[idx]}</span>
                                    : <span className="text-on-surface-faint font-mono text-sm">{idx + 1}</span>
                                }
                            </span>

                            {/* Name */}
                            <span className={`flex-1 text-base font-medium truncate ${
                                isMe ? 'text-accent' : 'text-on-surface-dim'
                            }`}>
                                {entry.name}
                                {isMe && <span className="ml-1.5 text-on-surface-faint font-normal text-sm">{t.me}</span>}
                            </span>

                            {/* Correct */}
                            <span className="w-10 text-sm font-mono text-on-surface-faint text-right">
                                {entry.correct}
                            </span>

                            {/* Incorrect */}
                            <span className="w-10 text-sm font-mono text-on-surface-faint text-right">
                                {entry.incorrect}
                            </span>

                            {/* Points */}
                            <div className="w-16 flex items-center justify-end gap-1">
                                <Zap
                                    strokeWidth={1.5}
                                    size={13}
                                    className={isMe ? 'text-accent' : 'text-amber-500/60'}
                                />
                                <span className={`text-base font-bold font-mono ${
                                    isMe ? 'text-accent' : 'text-on-surface-dim'
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
