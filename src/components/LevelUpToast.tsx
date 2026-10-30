import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { useI18n } from '../i18n/useI18n.ts';
import type { UnlockEntry } from '../services/api.ts';

/**
 * Long enough to read a two-line unlock list, short enough that it never sits
 * on top of the next question. Bounded on purpose: an endless toast trains the
 * player to ignore it.
 */
export const TOAST_AUTO_DISMISS_MS = 5_000;

interface Props {
    /** The level the last /answer reached — the server decides this number. */
    level: number;
    /** `newly_unlocked` of that answer. Empty means: say nothing. */
    unlocks: readonly UnlockEntry[];
    onDismiss: () => void;
}

/**
 * Level-up notice.
 *
 * A level-up on its own is not news — the HUD already shows the new level. This
 * component only earns its pixels when the server actually opened something.
 */
export default function LevelUpToast({ level, unlocks, onDismiss }: Props) {
    const { t } = useI18n();
    const hasUnlocks = unlocks.length > 0;

    useEffect(() => {
        if (!hasUnlocks) return;
        const timer = setTimeout(onDismiss, TOAST_AUTO_DISMISS_MS);
        return () => clearTimeout(timer);
    }, [hasUnlocks, onDismiss]);

    if (!hasUnlocks) return null;

    return (
        <motion.div
            role="status"
            aria-label={t.levelUpToast(level)}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 right-4 z-50 w-72 rounded-lg border border-outline bg-surface-raised shadow-lg"
        >
            <div className="flex items-start gap-2 p-3">
                <Sparkles strokeWidth={1.5} size={16} className="text-amber-500 mt-0.5 shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface">{t.levelUpToast(level)}</p>
                    <ul className="mt-2 space-y-1">
                        {unlocks.map((unlock) => (
                            <li
                                key={`${unlock.mode}-${unlock.bit_width}`}
                                aria-label={`${t.modeNames[unlock.mode]}, ${unlock.bit_width} ${t.bits}`}
                                className="flex items-center justify-between gap-2 text-xs font-mono text-on-surface-dim"
                            >
                                <span className="truncate">{t.modeNames[unlock.mode]}</span>
                                <span className="shrink-0">{unlock.bit_width} {t.bits}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <button
                    onClick={onDismiss}
                    aria-label={t.dismissNotice}
                    className="shrink-0 p-1 rounded text-on-surface-faint hover:text-on-surface-dim focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised"
                >
                    <X size={14} aria-hidden="true" />
                </button>
            </div>
        </motion.div>
    );
}
