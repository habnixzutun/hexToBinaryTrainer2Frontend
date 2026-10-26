import { render, screen, fireEvent, waitFor } from '../../src/test-utils.tsx';
import { describe, it, expect, beforeEach } from 'vitest';
import { CookieBanner, COOKIE_CONSENT_KEY } from '../../src/components/CookieBanner';

describe('CookieBanner', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('renders the banner when no consent has been given', () => {
        render(<CookieBanner />);
        expect(screen.getByRole('dialog', { name: /cookie/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /verstanden|got it/i })).toBeInTheDocument();
    });

    it('does not render when consent is already stored', () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
        render(<CookieBanner />);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('stores consent in localStorage and unmounts after the exit animation', async () => {
        render(<CookieBanner />);
        const acceptButton = screen.getByRole('button', { name: /verstanden|got it/i });
        expect(localStorage.getItem(COOKIE_CONSENT_KEY)).toBeNull();

        fireEvent.click(acceptButton);

        // Consent is persisted immediately
        expect(localStorage.getItem(COOKIE_CONSENT_KEY)).toBe('accepted');

        // Banner is still in the DOM while the slide-out animation plays
        expect(screen.queryByRole('dialog')).toBeInTheDocument();

        // After the animation duration, the banner unmounts
        await waitFor(
            () => {
                expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
            },
            { timeout: 500 },
        );
    });

    it('focuses the accept button on mount for keyboard users', () => {
        render(<CookieBanner />);
        const acceptButton = screen.getByRole('button', { name: /verstanden|got it/i });
        expect(document.activeElement).toBe(acceptButton);
    });
});
