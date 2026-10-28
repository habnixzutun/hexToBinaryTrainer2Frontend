import type { ReactElement, ReactNode } from 'react';
import { Flame, Trophy, Check, X } from 'lucide-react';
import LevelUpToast from './LevelUpToast.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useI18n } from '../i18n/useI18n.ts';

/** Two decimals are plenty for a bar a few hundred pixels wide. */
const SCALE_STEPS = 100;

/** The figure the player is allowed to see: never negative, never past the goal. */
function clampProgress(current: number, required: number): number {
    if (!Number.isFinite(current) || !Number.isFinite(required) || required <= 0) return 0;
    return Math.min(Math.max(current, 0), required);
}

/**
 * Fill ratio as a `scaleX` factor — transform only, so the bar animates on the
 * GPU instead of triggering layout on every answer.
 */
function fillScale(current: number, required: number): number {
    if (!Number.isFinite(required) || required <= 0) return 0;
    const ratio = clampProgress(current, required) / required;
    return Math.round(ratio * SCALE_STEPS) / SCALE_STEPS;
}

interface StatProps {
    /** Accessible name; the visible caption is decorative next to it. */
    label: string;
    value: string;
    caption: string;
    icon?: ReactNode;
    valueClassName?: string;
}

function Stat({ label, value, caption, icon, valueClassName }: StatProps): ReactElement {
    return (
        <div className="flex items-baseline gap-1.5" aria-label={label}>
            {icon}
            <span className={`text-base font-bold font-mono leading-none ${valueClassName ?? 'text-on-surface'}`}>
                {value}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-on-surface-faint" aria-hidden="true">
                {caption}
            </span>
        </div>
    );
}

/**
 * The training HUD: level, XP progress toward the next level, and the streak.
 *
 * Every number here is a copy of what the server said — level and counters from
 * `user` (which only /answer and /user/me ever write), the in-level progress
 * from the raw last answer. Progress stays hidden until the server supplied it:
 * a cold start must not invent a bar out of the cached totals.
 */
export default function GameHud(): ReactElement | null {
    const { user, lastAnswer, pendingUnlocks, dismissLevelUp } = useAuth();
    const { t, locale } = useI18n();

    if (user === null) return null;

    const current = lastAnswer?.xp_in_level ?? 0;
    const required = lastAnswer?.xp_required_for_next_level ?? 0;
    const shownCurrent = clampProgress(current, required);

    return (
        <section
            className="shrink-0 flex flex-wrap items-center gap-x-5 gap-y-2 px-4 sm:px-6 py-2.5 border-b border-outline-faint bg-surface"
            aria-label={t.hudLabel}
        >
            <Stat
                label={t.levelLabel}
                value={String(user.level)}
                caption={t.levelLabel}
                icon={<Trophy strokeWidth={1.5} size={14} className="text-amber-500 self-center" aria-hidden="true" />}
            />

            <Stat
                label={t.xp}
                value={user.total_xp.toLocaleString(locale)}
                caption={t.xp}
                valueClassName="text-points"
            />

            {lastAnswer !== null && (
                <div
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuenow={shownCurrent}
                    aria-valuemax={required}
                    aria-label={t.xpProgress(shownCurrent, required)}
                    className="flex-1 min-w-32 h-1.5 rounded-full bg-surface-active overflow-hidden"
                >
                    <div
                        data-hud-fill
                        className="h-full w-full origin-left rounded-full bg-accent transition-transform duration-300 ease-out"
                        style={{ transform: `scaleX(${fillScale(current, required)})` }}
                    />
                </div>
            )}

            <Stat
                label={t.streak}
                value={String(user.current_streak)}
                caption={t.streak}
                icon={<Flame strokeWidth={1.5} size={14} className="text-amber-500 self-center" aria-hidden="true" />}
            />

            <Stat label={t.bestStreak} value={String(user.best_streak)} caption={t.bestStreak} />

            <Stat
                label="Correct answers"
                value={String(user.correct_count)}
                caption="✓"
                icon={<Check strokeWidth={2} size={12} className="text-emerald-600 self-center" aria-hidden="true" />}
            />

            <Stat
                label="Wrong answers"
                value={String(user.incorrect_count)}
                caption="✗"
                icon={<X strokeWidth={2} size={12} className="text-error-text self-center" aria-hidden="true" />}
            />

            <LevelUpToast level={user.level} unlocks={pendingUnlocks} onDismiss={dismissLevelUp} />
        </section>
    );
}
