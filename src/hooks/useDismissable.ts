import { useEffect, useRef, type RefObject } from 'react';

/**
 * Close a popup (menu, dropdown) on a click outside of it or on Escape.
 *
 * Returns a ref for the element that wraps both the trigger button and the
 * popup — clicks inside it never close the popup. On Escape, focus returns to
 * the trigger so keyboard users keep their place (WCAG 2.1, focus order).
 */
export function useDismissable<T extends HTMLElement>(
    isOpen: boolean,
    close: () => void,
    triggerRef: RefObject<HTMLButtonElement | null>,
): RefObject<T | null> {
    const containerRef = useRef<T>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handlePointerDown = (event: MouseEvent): void => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                close();
            }
        };

        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.key === 'Escape') {
                close();
                triggerRef.current?.focus();
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, close, triggerRef]);

    return containerRef;
}
