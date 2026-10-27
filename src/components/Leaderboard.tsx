import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Zap, Award, Info } from 'lucide-react';
import { gameApi, type LeaderboardEntry } from '../services/api.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useI18n } from '../i18n/useI18n.ts';

interface Props {
    refreshTrigger: number;
}

// Medal icons for top 3 ranks using Lucide SVG icons (accessible, scalable)
const MEDAL_ICONS: Record<number, { icon: typeof Award; color: string }> = {
    0: { icon: Award, color: 'text-yellow-500' },
    1: { icon: Award, color: 'text-gray-400' },
    2: { icon: Award, color: 'text-amber-600' },
};

export default function Leaderboard({ refreshTrigger }: Props) {
    const { user } = useAuth();
    const [data, setData] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEternalMax, setIsEternalMax] = useState(false);
    const { t } = useI18n();

    const refreshData = useCallback(async (): Promise<void> => {
        setLoading(true);
        const result = await gameApi.getLeaderboard();
        const sorted = [...result].sort((a, b) => b.points - a.points);
        const maxIdx = sorted.findIndex((u) => u.username === 'Max');
        let eternal = false;
        if (maxIdx > 0) {
            const [maxEntry] = sorted.splice(maxIdx, 1);
            if (maxEntry) {
                sorted.unshift(maxEntry);
            }
            eternal = true;
        }
        setData(sorted);
        setIsEternalMax(eternal);
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
        <div className="h-full flex flex-col" role="region" aria-label="Leaderboard">
            {/* Title row — sits below the settings toolbar, separated by its own line */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-outline-faint shrink-0">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-on-surface-faint">
                    {t.leaderboardTitle}
                </h2>
                {loading && (
                    <span
                        className="w-2 h-2 rounded-full bg-accent animate-ping"
                        aria-label="Loading"
                        role="status"
                    />
                )}
            </div>

            {/* Column headers */}
            <div className="flex items-center px-5 py-3 shrink-0" role="row" aria-label="Leaderboard columns">
                <span className="w-8 shrink-0" role="columnheader" aria-label="Rank" />
                <span className="flex-1 text-xs font-semibold uppercase tracking-widest text-on-surface-faint" role="columnheader">
                    {t.name}
                </span>
                <span className="w-10 text-xs font-semibold uppercase tracking-widest text-on-surface-faint text-right" role="columnheader" aria-label="Correct answers">
                    <span aria-hidden="true">✓</span>
                </span>
                <span className="w-10 text-xs font-semibold uppercase tracking-widest text-on-surface-faint text-right" role="columnheader" aria-label="Wrong answers">
                    <span aria-hidden="true">✗</span>
                </span>
                <span className="w-16 text-xs font-semibold uppercase tracking-widest text-on-surface-faint text-right" role="columnheader">
                    PTS
                </span>
            </div>

            {/* Rows */}
            <div
                className="flex-1 overflow-y-auto"
                role="list"
                aria-label="Leaderboard rankings"
                aria-live="polite"
                aria-atomic="false"
            >
                {data.map((entry, idx) => {
                    const isMe = entry.username === user?.username;
                    const showEternalTooltip = isEternalMax && idx === 0;

                    return (
                        <motion.div
                            key={entry.user_id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: Math.min(idx * 0.04, 0.3) }}
                            role="listitem"
                            aria-label={`Rank ${idx + 1}: ${entry.username}, ${entry.points} points`}
                            className={`flex items-center px-5 py-3.5 border-b border-outline-faint transition-colors ${
                                isMe ? 'bg-accent-muted' : 'hover:bg-surface-alt'
                            }`}
                        >
                            {/* Rank */}
                            <span className="w-8 shrink-0 text-base" aria-label={`Rank ${idx + 1}`}>
                                {idx in MEDAL_ICONS
                                    ? (() => {
                                        const MedalIcon = MEDAL_ICONS[idx]!.icon;
                                        return (
                                            <MedalIcon
                                                size={18}
                                                className={MEDAL_ICONS[idx]!.color}
                                                aria-label={`Medal: rank ${idx + 1}`}
                                            />
                                        );
                                    })()
                                    : <span className="text-on-surface-faint font-mono text-sm">{idx + 1}</span>
                                }
                            </span>

                            {/* Name */}
                            <span className={`flex-1 text-base font-medium truncate ${
                                isMe ? 'text-accent' : 'text-on-surface-dim'
                            }`}>
                                {entry.username}
                                {isMe && <span className="ml-1.5 text-on-surface-faint font-normal text-sm">{t.me}</span>}
                                {showEternalTooltip && (
                                    <span title="Er wird für immer unsere 1 bleiben" className="ml-1.5 inline-flex align-middle">
                                        <Info size={12} className="text-on-surface-faint" aria-label="Er wird für immer unsere 1 bleiben" />
                                    </span>
                                )}
                            </span>

                            {/* Correct */}
                            <span className="w-10 text-sm font-mono text-on-surface-faint text-right" aria-label={`${entry.correct_count} correct`}>
                                {entry.correct_count}
                            </span>

                            {/* Incorrect */}
                            <span className="w-10 text-sm font-mono text-on-surface-faint text-right" aria-label={`${entry.incorrect_count} wrong`}>
                                {entry.incorrect_count}
                            </span>

                            {/* Points */}
                            <div className="w-16 flex items-center justify-end gap-1" aria-label={`${entry.points} points`}>
                                <Zap
                                    strokeWidth={1.5}
                                    size={13}
                                    className={isMe ? 'text-accent' : 'text-amber-500/60'}
                                    aria-hidden="true"
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
