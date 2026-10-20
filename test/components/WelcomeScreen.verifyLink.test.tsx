import { StrictMode } from 'react'
import { userEvent } from '@testing-library/user-event'
import { render, screen, waitFor } from '../../src/test-utils.tsx'
import WelcomeScreen from '../../src/components/WelcomeScreen.tsx'
import { authValue } from '../helpers/auth.ts'

const mockUseAuth = vi.hoisted(() => vi.fn())
vi.mock('../../src/contexts/AuthContext.tsx', () => ({ useAuth: mockUseAuth }))

const mockVerifyEmail = vi.hoisted(() => vi.fn())
vi.mock('../../src/services/authApi.ts', () => ({
    verifyEmail: mockVerifyEmail,
}))

const VERIFY_PATH = '/trainer/verify-email?token=jwt-token-123'

describe('WelcomeScreen verify-email link handling', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockUseAuth.mockReturnValue(authValue({ user: null }))
        window.history.replaceState({}, '', '/')
    })

    it('verifies the token from the URL and shows success', async () => {
        mockVerifyEmail.mockResolvedValue({ message: 'Email verified successfully.' })
        window.history.replaceState({}, '', VERIFY_PATH)

        render(<WelcomeScreen />)

        await waitFor(() => {
            expect(mockVerifyEmail).toHaveBeenCalledWith('jwt-token-123')
        })
        expect(mockVerifyEmail).toHaveBeenCalledTimes(1)
        expect(await screen.findByText('E-Mail bestätigt!')).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Zurück zur Anmeldung' }),
        ).toBeInTheDocument()
    })

    it('shows the verifying state and cleans the URL while the request is in flight', async () => {
        let resolveVerify: (value: { message: string }) => void = () => {}
        mockVerifyEmail.mockReturnValue(
            new Promise<{ message: string }>((resolve) => {
                resolveVerify = resolve
            }),
        )
        window.history.replaceState({}, '', VERIFY_PATH)

        render(<WelcomeScreen />)

        expect(await screen.findByText('E-Mail wird bestätigt...')).toBeInTheDocument()
        // URL cleaned while in flight: a reload must never re-submit the token
        expect(window.location.search).toBe('')
        expect(window.location.pathname).not.toContain('verify-email')

        resolveVerify({ message: 'ok' })
        expect(await screen.findByText('E-Mail bestätigt!')).toBeInTheDocument()
    })

    it('submits the token exactly once under StrictMode double invocation', async () => {
        mockVerifyEmail.mockResolvedValue({ message: 'ok' })
        window.history.replaceState({}, '', VERIFY_PATH)

        render(
            <StrictMode>
                <WelcomeScreen />
            </StrictMode>,
        )

        expect(await screen.findByText('E-Mail bestätigt!')).toBeInTheDocument()
        expect(mockVerifyEmail).toHaveBeenCalledTimes(1)
    })

    it('shows the API error message when verification fails', async () => {
        mockVerifyEmail.mockRejectedValue(
            new Error('Verification token has expired.'),
        )
        window.history.replaceState({}, '', VERIFY_PATH)

        render(<WelcomeScreen />)

        expect(await screen.findByText('Bestätigung fehlgeschlagen')).toBeInTheDocument()
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(
            await screen.findByText('Verification token has expired.'),
        ).toBeInTheDocument()
    })

    it('cleans the token from the URL after processing', async () => {
        mockVerifyEmail.mockResolvedValue({ message: 'ok' })
        window.history.replaceState({}, '', VERIFY_PATH)

        render(<WelcomeScreen />)

        await screen.findByText('E-Mail bestätigt!')
        expect(window.location.search).toBe('')
        expect(window.location.pathname).not.toContain('verify-email')
    })

    it('shows the normal login form when no token is present', () => {
        render(<WelcomeScreen />)

        expect(
            screen.getByRole('heading', { name: 'Willkommen zurück' }),
        ).toBeInTheDocument()
        expect(mockVerifyEmail).not.toHaveBeenCalled()
    })

    it('ignores a token on a non-verify-email path', () => {
        window.history.replaceState({}, '', '/trainer/?token=jwt-token-123')

        render(<WelcomeScreen />)

        expect(
            screen.getByRole('heading', { name: 'Willkommen zurück' }),
        ).toBeInTheDocument()
        expect(mockVerifyEmail).not.toHaveBeenCalled()
    })

    it('returns to the login form via back button after success', async () => {
        mockVerifyEmail.mockResolvedValue({ message: 'ok' })
        window.history.replaceState({}, '', VERIFY_PATH)
        const user = userEvent.setup()

        render(<WelcomeScreen />)

        await user.click(
            await screen.findByRole('button', { name: 'Zurück zur Anmeldung' }),
        )

        expect(
            await screen.findByRole('heading', { name: 'Willkommen zurück' }),
        ).toBeInTheDocument()
    })
})
