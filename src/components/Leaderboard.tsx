import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Zap, Award, Info } from 'lucide-react';
import { gameApi, type LeaderboardEntry } from '../services/api.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useI18n } from '../i18n/useI18n.ts';

interface Props {
    refreshTrigger: number;
}

/** The panel is permanently mounted, so a slow backend must not starve it. */
export const LEADERBOARD_POLL_MS = 30_000;

// Medal icons for top 3 ranks using Lucide SVG icons (accessible, scalable)
const MEDAL_ICONS: Record<number, { icon: typeof Award; color: string }> = {
    0: { icon: Award, color: 'text-yellow-500' },
    1: { icon: Award, color: 'text-gray-400' },
    2: { icon: Award, color: 'text-amber-600' },
};

/** House lore: our eternal number one outranks his XP while he is on the board. */
const ETERNAL_NUMBER_ONE = 'Max';
const ETERNAL_TOOLTIP = 'Er wird für immer unsere 1 bleiben';

/**
 * Order by total XP, then lift Max to the top when he would otherwise sit
 * behind somebody else. Both figures are returned immutably: the caller needs
 * to know whether the promotion happened, not just the new order.
 */
function rankEntries(rows: readonly LeaderboardEntry[]): { ranked: LeaderboardEntry[]; promoted: boolean } {
    const sorted = [...rows].sort((a, b) => b.total_xp - a.total_xp);
    const maxIdx = sorted.findIndex((row) => row.username === ETERNAL_NUMBER_ONE);

    if (maxIdx <= 0) {
        return { ranked: sorted, promoted: false };
    }

    const maxRow = sorted[maxIdx];
    if (maxRow === undefined) {
        return { ranked: sorted, promoted: false };
    }

    return {
        ranked: [maxRow, ...sorted.filter((_, index) => index !== maxIdx)],
        promoted: true,
    };
}

export default function Leaderboard({ refreshTrigger }: Props) {
    const { user } = useAuth();
    const { t, locale } = useI18n();
    const [data, setData] = useState<LeaderboardEntry[]>([]);
    const [promoted, setPromoted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);

    const refreshData = useCallback(async (): Promise<void> => {
        setLoading(true);
        try {
            const result = await gameApi.getLeaderboard();
            const { ranked, promoted: isPromoted } = rankEntries(result);
            setData(ranked);
            setPromoted(isPromoted);
            setFailed(false);
        } catch {
            // The panel outlives a single failed poll: keep the last good rows
            // on screen and say what happened instead of rejecting silently.
            setFailed(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Every setState here lands after an await, so nothing cascades in the
        // effect body itself.
        refreshData();
    }, [refreshTrigger, refreshData]);

    useEffect(() => {
        const interval = setInterval(refreshData, LEADERBOARD_POLL_MS);
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

            {failed && (
                <p className="px-5 py-2 text-xs text-error-text shrink-0" role="alert">
                    {t.leaderboardError}
                </p>
            )}

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
                <span className="w-10 text-xs font-semibold uppercase tracking-widest text-on-surface-faint text-right" role="columnheader">
                    {t.levelLabel}
                </span>
                <span className="w-16 text-xs font-semibold uppercase tracking-widest text-on-surface-faint text-right" role="columnheader">
                    {t.xp}
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
                    const showEternalTooltip = promoted && idx === 0;
                    const xpLabel = entry.total_xp.toLocaleString(locale);

                    return (
                        <motion.div
                            key={entry.user_id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: Math.min(idx * 0.04, 0.3) }}
                            role="listitem"
                            aria-label={`Rank ${idx + 1}: ${entry.username}, ${xpLabel} ${t.xp}`}
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
                                    <span title={ETERNAL_TOOLTIP} className="ml-1.5 inline-flex align-middle">
                                        <Info size={12} className="text-on-surface-faint" aria-label={ETERNAL_TOOLTIP} />
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

                            {/* Level */}
                            <span className="w-10 text-sm font-mono text-on-surface-faint text-right" aria-label={`${entry.level} ${t.levelLabel}`}>
                                {entry.level}
                            </span>

                            {/* XP */}
                            <div className="w-16 flex items-center justify-end gap-1" aria-label={`${xpLabel} ${t.xp}`}>
                                <Zap
                                    strokeWidth={1.5}
                                    size={13}
                                    className={isMe ? 'text-accent' : 'text-amber-500/60'}
                                    aria-hidden="true"
                                />
                                <span className={`text-base font-bold font-mono ${
                                    isMe ? 'text-accent' : 'text-on-surface-dim'
                                }`}>
                                    {xpLabel}
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
