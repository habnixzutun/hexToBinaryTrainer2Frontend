import { Lock } from 'lucide-react';

interface Props {
    /** Level that opens the tier — the number the badge has to surface. */
    minLevel: number;
    /** Id of the hidden hint element; the caller wires it via `aria-describedby`. */
    hintId: string;
    /** Localized lock copy, e.g. `Unlocks at level 13.` */
    hint: string;
}

/**
 * The lock affordance of a gated tier option.
 *
 * Deliberately invisible to the accessible *name*: the option's own label stays
 * verbatim so tests and screen-reader users hear the tier first. The level
 * travels as the accessible description instead, from the element this fragment
 * renders with `hintId`.
 */
export default function TierLockBadge({ minLevel, hintId, hint }: Props) {
    return (
        <>
            <span
                aria-hidden="true"
                className="inline-flex items-center gap-0.5 text-[10px] font-semibold uppercase tracking-wider"
            >
                <Lock strokeWidth={2} size={10} />
                {minLevel}
            </span>
            <span id={hintId} className="sr-only">
                {hint}
            </span>
        </>
    );
}
