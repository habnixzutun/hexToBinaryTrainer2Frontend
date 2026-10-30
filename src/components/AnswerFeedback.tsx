import { AnimatePresence, motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

/** How long a solved question stays on screen before the next one is dealt. */
export const QUESTION_DELAY_MS = 600;
/** How long a wrong verdict stays visible before the input is usable again. */
export const WRONG_FEEDBACK_MS = 1000;

interface Props {
    /** Copy to show; `null` leaves the slot empty. */
    message: string | null;
    /** A wrong or failed submit is assertive; a correct one is polite. */
    negative: boolean;
}

/**
 * The one feedback slot every trainer shares.
 *
 * Single slot means single `role="alert"`: when the server rejects an answer,
 * its reason replaces the local verdict instead of stacking beside it — two
 * alerts at once read as two events to a screen reader.
 */
export default function AnswerFeedback({ message, negative }: Props) {
    return (
        <AnimatePresence mode="wait">
            {message !== null && (
                <motion.p
                    key={message}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`text-base font-mono ${negative ? 'text-error-text' : 'text-accent'}`}
                    role={negative ? 'alert' : 'status'}
                    aria-live={negative ? 'assertive' : 'polite'}
                >
                    {negative
                        ? <><X size={18} strokeWidth={2.5} className="inline mr-1" aria-hidden="true" />{message}</>
                        : <><Check size={18} strokeWidth={2.5} className="inline mr-1" aria-hidden="true" />{message}</>
                    }
                </motion.p>
            )}
        </AnimatePresence>
    );
}
