/**
 * Flash the global accent color for visual feedback.
 *
 * Adds a CSS class to the root element that overrides --color-accent
 * with green (correct) or red (wrong), then removes it after the duration.
 */

type FlashType = 'correct' | 'wrong';

const CLASS_MAP: Record<FlashType, string> = {
    correct: 'flash-correct',
    wrong: 'flash-wrong',
};

const DEFAULT_DURATION = 400;

export function flashAccent(type: FlashType, duration = DEFAULT_DURATION): void {
    const root = document.documentElement;
    const cls = CLASS_MAP[type];

    // Remove any existing flash classes first
    root.classList.remove('flash-correct', 'flash-wrong');

    // Force reflow so the class removal takes effect before re-adding
    void root.offsetWidth;

    root.classList.add(cls);
    setTimeout(() => root.classList.remove(cls), duration);
}
