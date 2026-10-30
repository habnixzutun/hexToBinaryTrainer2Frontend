import { motion } from 'framer-motion';
import TierLockBadge from './TierLockBadge.tsx';

/** A tier the player cannot pick yet, plus the copy explaining why. */
export interface LockedOption {
    value: number;
    minLevel: number;
    hint: string;
}

interface Props {
    /** Read-only: the shared width tables are frozen constants. */
    options: readonly number[];
    value: number;
    onChange: (v: number) => void;
    label: string;
    singularLabel: string;
    /**
     * The subset of `options` still locked (US-39). The caller decides which
     * tiers are gated — this widget stays generic and renders what it is told.
     */
    lockedOptions?: readonly LockedOption[];
}

/** Accessible description for a locked option (US-39 AC-2). */
const lockHintId = (option: number): string => `selector-lock-${option}`;

export default function BitByteSelector({
    options,
    value,
    onChange,
    label,
    singularLabel,
    lockedOptions,
}: Props) {
    return (
        <div className="mt-2">
            <p className="px-2 mb-2 text-xs font-semibold uppercase tracking-widest text-on-surface-faint">
                {label}
            </p>
            <div className="flex items-center gap-1 px-2">
                {options.map((b) => {
                    const locked = lockedOptions?.find((option) => option.value === b);
                    return (
                        <motion.button
                            key={b}
                            // A locked option carries no handler: pointer and
                            // keyboard activation both stay inert (AC-2).
                            onClick={locked ? undefined : () => onChange(b)}
                            aria-label={`${b} ${b === 1 && singularLabel ? singularLabel : label}`}
                            aria-pressed={value === b}
                            aria-disabled={locked ? 'true' : undefined}
                            aria-describedby={locked ? lockHintId(b) : undefined}
                            className={`flex-1 h-8 rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1 ${
                                value === b
                                    ? 'bg-emerald-800 text-emerald-100'
                                    : 'bg-surface-alt text-on-surface-faint hover:text-on-surface-dim'
                            } ${locked ? 'opacity-50' : ''}`}
                        >
                            {b}
                            {locked !== undefined && (
                                <TierLockBadge
                                    minLevel={locked.minLevel}
                                    hintId={lockHintId(b)}
                                    hint={locked.hint}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
