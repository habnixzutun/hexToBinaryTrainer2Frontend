import { render, screen, fireEvent } from '../../src/test-utils.tsx';
import { describe, it, expect } from 'vitest';
import AppFooter from '../../src/components/AppFooter.tsx';

describe('AppFooter', () => {
    it('renders the copyright notice', () => {
        render(<AppFooter />);
        expect(screen.getByText(/2026 HexToBinaryTrainer v2\.0/)).toBeInTheDocument();
    });

    it('renders the GitHub link with correct href and opens in new tab', () => {
        render(<AppFooter />);
        const link = screen.getByRole('link', { name: /github repository/i });
        expect(link).toHaveAttribute('href', 'https://github.com/habnixzutun/hexToBinaryTrainer2Frontend');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders all three tech badge labels', () => {
        render(<AppFooter />);
        expect(screen.getByText('REACT')).toBeInTheDocument();
        expect(screen.getByText('VITE')).toBeInTheDocument();
        expect(screen.getByText('TS')).toBeInTheDocument();
    });

    it('renders Impressum and Datenschutz buttons', () => {
        render(<AppFooter />);
        expect(screen.getByRole('button', { name: /impressum/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /datenschutz|datenschutzerklärung|privacy/i })).toBeInTheDocument();
    });

    it('legal nav has an accessible label', () => {
        render(<AppFooter />);
        expect(screen.getByRole('navigation', { name: /legal/i })).toBeInTheDocument();
    });

    it('has a contentinfo landmark', () => {
        render(<AppFooter />);
        expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    describe('Impressum modal', () => {
        it('is not visible initially', () => {
            render(<AppFooter />);
            expect(screen.queryByRole('dialog', { name: /impressum/i })).not.toBeInTheDocument();
        });

        it('opens when the Impressum button is clicked', () => {
            render(<AppFooter />);
            fireEvent.click(screen.getByRole('button', { name: /impressum/i }));
            expect(screen.getByRole('dialog', { name: /impressum/i })).toBeInTheDocument();
        });

        it('closes when the close button inside the modal is clicked', () => {
            render(<AppFooter />);
            fireEvent.click(screen.getByRole('button', { name: /impressum/i }));
            const closeBtn = screen.getByRole('button', { name: /schließen|close/i });
            fireEvent.click(closeBtn);
            expect(screen.queryByRole('dialog', { name: /impressum/i })).not.toBeInTheDocument();
        });

        it('closes on Escape key press', () => {
            render(<AppFooter />);
            fireEvent.click(screen.getByRole('button', { name: /impressum/i }));
            fireEvent.keyDown(document, { key: 'Escape' });
            expect(screen.queryByRole('dialog', { name: /impressum/i })).not.toBeInTheDocument();
        });

        it('shows mock impressum content', () => {
            render(<AppFooter />);
            fireEvent.click(screen.getByRole('button', { name: /impressum/i }));
            expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
        });
    });

    describe('Datenschutz modal', () => {
        it('is not visible initially', () => {
            render(<AppFooter />);
            expect(screen.queryByRole('dialog', { name: /datenschutz|privacy/i })).not.toBeInTheDocument();
        });

        it('opens when the Datenschutz button is clicked', () => {
            render(<AppFooter />);
            fireEvent.click(screen.getByRole('button', { name: /datenschutz|datenschutzerklärung|privacy/i }));
            expect(screen.getByRole('dialog', { name: /datenschutz|privacy/i })).toBeInTheDocument();
        });

        it('closes when the close button inside the modal is clicked', () => {
            render(<AppFooter />);
            fireEvent.click(screen.getByRole('button', { name: /datenschutz|datenschutzerklärung|privacy/i }));
            const closeBtn = screen.getByRole('button', { name: /schließen|close/i });
            fireEvent.click(closeBtn);
            expect(screen.queryByRole('dialog', { name: /datenschutz|privacy/i })).not.toBeInTheDocument();
        });

        it('closes on Escape key press', () => {
            render(<AppFooter />);
            fireEvent.click(screen.getByRole('button', { name: /datenschutz|datenschutzerklärung|privacy/i }));
            fireEvent.keyDown(document, { key: 'Escape' });
            expect(screen.queryByRole('dialog', { name: /datenschutz|privacy/i })).not.toBeInTheDocument();
        });

        it('shows mock datenschutz content', () => {
            render(<AppFooter />);
            fireEvent.click(screen.getByRole('button', { name: /datenschutz|datenschutzerklärung|privacy/i }));
            expect(screen.getByRole('heading', { name: /cookies/i })).toBeInTheDocument();
        });
    });
});
