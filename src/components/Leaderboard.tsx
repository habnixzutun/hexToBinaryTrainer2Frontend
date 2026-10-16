import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Zap, Award } from 'lucide-react';
import { api, type UserType } from '../services/api.ts';
import { useI18n } from '../i18n/useI18n.ts';

interface Props {
    currentUser: UserType;
    refreshTrigger: number;
}

// Medal icons for top 3 ranks using Lucide SVG icons (accessible, scalable)
const MEDAL_ICONS: Record<number, { icon: typeof Award; color: string }> = {
    0: { icon: Award, color: 'text-yellow-500' },
    1: { icon: Award, color: 'text-gray-400' },
    2: { icon: Award, color: 'text-amber-600' },
};

export default function Leaderboard({ currentUser, refreshTrigger }: Props) {
    const [data, setData] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEternalMax, setIsEternalMax] = useState(false);
    const { t } = useI18n();

    const refreshData = useCallback(async (): Promise<void> => {
        setLoading(true);
        const result = await api.getLeaderboard();
        const sorted = [...result].sort((a, b) => b.points - a.points);
        const maxIdx = sorted.findIndex((u) => u.name === 'Max');
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
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-5 border-b border-outline-faint shrink-0">
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
                    const isMe = entry.name === currentUser.name;
                    const showEternalTooltip = isEternalMax && idx === 0;

                    return (
                        <motion.div
                            key={entry.name}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: Math.min(idx * 0.04, 0.3) }}
                            role="listitem"
                            aria-label={`Rank ${idx + 1}: ${entry.name}, ${entry.points} points`}
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
                            <span className={`flex-1 text-base font-medium truncate relative group ${
                                isMe ? 'text-accent' : 'text-on-surface-dim'
                            }`}>
                                {entry.name}
                                {isMe && <span className="ml-1.5 text-on-surface-faint font-normal text-sm">{t.me}</span>}
                                {showEternalTooltip && (
                                    <span className="absolute left-0 bottom-full mb-1.5 px-2.5 py-1 rounded bg-surface-raised text-xs text-on-surface-dim whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-outline-faint shadow-lg z-10">
                                        Er wird für immer unsere 1 bleiben
                                    </span>
                                )}
                            </span>

                            {/* Correct */}
                            <span className="w-10 text-sm font-mono text-on-surface-faint text-right" aria-label={`${entry.correct} correct`}>
                                {entry.correct}
                            </span>

                            {/* Incorrect */}
                            <span className="w-10 text-sm font-mono text-on-surface-faint text-right" aria-label={`${entry.incorrect} wrong`}>
                                {entry.incorrect}
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
