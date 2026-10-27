/**
 * WelcomeScreen reset-password URL handling tests.
 *
 * Verifies that the reset-password token is stripped from the URL on mount
 * and when navigating back to login. A lingering token in the URL must never
 * cause the reset-password view to reappear after a page reload (which can
 * be triggered e.g. by a failed login attempt).
 */

import { userEvent } from '@testing-library/user-event'
import { render, screen } from '../../src/test-utils.tsx'
import WelcomeScreen from '../../src/components/WelcomeScreen.tsx'
import { authValue } from '../helpers/auth.ts'

const mockUseAuth = vi.hoisted(() => vi.fn())
vi.mock('../../src/contexts/AuthContext.tsx', () => ({ useAuth: mockUseAuth }))

const mockResetPassword = vi.hoisted(() => vi.fn())
const mockVerifyEmail = vi.hoisted(() => vi.fn())
vi.mock('../../src/services/authApi.ts', () => ({
    resetPassword: mockResetPassword,
    verifyEmail: mockVerifyEmail,
}))

const RESET_PATH = '/trainer/reset-password?token=reset-token-abc'

describe('WelcomeScreen reset-password URL handling', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockUseAuth.mockReturnValue(authValue({ user: null }))
        mockVerifyEmail.mockResolvedValue({ message: 'ok' })
        window.history.replaceState({}, '', '/')
    })

    it('shows the reset-password form and cleans the token from the URL on mount', async () => {
        window.history.replaceState({}, '', RESET_PATH)

        render(<WelcomeScreen />)

        // The heading uses authResetPasswordTitle = "Neues Passwort"
        expect(await screen.findByRole('heading', { name: 'Neues Passwort' })).toBeInTheDocument()
        // URL must be cleaned immediately so a reload cannot bounce back here
        expect(window.location.search).toBe('')
        expect(window.location.pathname).not.toContain('reset-password')
    })

    it('cleans the URL after successful reset and navigating back to login', async () => {
        mockResetPassword.mockResolvedValue({ message: 'Password reset.' })
        window.history.replaceState({}, '', RESET_PATH)
        const user = userEvent.setup()

        render(<WelcomeScreen />)

        // Use placeholder queries — the heading and the input share the
        // text "Neues Passwort", so getByLabelText would be ambiguous.
        await user.type(screen.getByPlaceholderText('Neues Passwort'), 'Test1234!')
        await user.type(screen.getByPlaceholderText('Neues Passwort bestätigen'), 'Test1234!')
        await user.click(screen.getByRole('button', { name: /passwort zurücksetzen/i }))

        // authResetPasswordSuccess = "Dein Passwort wurde erfolgreich zurückgesetzt."
        expect(await screen.findByText(/passwort wurde erfolgreich zurückgesetzt/i)).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: /zurück zur anmeldung/i }))

        expect(screen.getByRole('heading', { name: 'Willkommen zurück' })).toBeInTheDocument()
        expect(window.location.search).toBe('')
        expect(window.location.pathname).not.toContain('token=')
    })

    it('does not re-open the reset-password view after a remount (page reload)', async () => {
        mockResetPassword.mockResolvedValue({ message: 'Password reset.' })
        window.history.replaceState({}, '', RESET_PATH)
        const user = userEvent.setup()

        const { unmount } = render(<WelcomeScreen />)

        await user.type(screen.getByPlaceholderText('Neues Passwort'), 'Test1234!')
        await user.type(screen.getByPlaceholderText('Neues Passwort bestätigen'), 'Test1234!')
        await user.click(screen.getByRole('button', { name: /passwort zurücksetzen/i }))

        await screen.findByText(/passwort wurde erfolgreich zurückgesetzt/i)
        await user.click(screen.getByRole('button', { name: /zurück zur anmeldung/i }))

        // At this point the URL must be clean. Simulate a full page reload
        // (which is what triggered the original bug: a failed login reloads
        // the page and the lazy-init would re-read the token from the URL).
        expect(window.location.pathname).not.toContain('reset-password')

        unmount()
        render(<WelcomeScreen />)

        expect(screen.getByRole('heading', { name: 'Willkommen zurück' })).toBeInTheDocument()
        // "Neues Passwort" is the reset-password heading — must NOT be present
        expect(screen.queryByRole('heading', { name: 'Neues Passwort' })).not.toBeInTheDocument()
    })

    it('shows login form when URL has no reset-password token', () => {
        window.history.replaceState({}, '', '/trainer/')

        render(<WelcomeScreen />)

        expect(screen.getByRole('heading', { name: 'Willkommen zurück' })).toBeInTheDocument()
    })
})
