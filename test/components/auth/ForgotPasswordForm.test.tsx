import { userEvent } from '@testing-library/user-event'
import { render, screen, waitFor } from '../../../src/test-utils.tsx'
import ForgotPasswordForm from '../../../src/components/auth/ForgotPasswordForm.tsx'
import * as authApi from '../../../src/services/authApi.ts'

vi.mock('../../../src/services/authApi.ts', () => ({
  requestPasswordReset: vi.fn().mockResolvedValue({ message: 'Reset link sent.' }),
}))

const mockOnSwitchToLogin = vi.fn()

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOnSwitchToLogin.mockReset()
  })

  it('renders email input and submit button', () => {
    render(<ForgotPasswordForm onSwitchToLogin={mockOnSwitchToLogin} />)

    expect(screen.getByLabelText('E-Mail')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Link senden' })).toBeInTheDocument()
  })

  it('shows validation error for empty email', async () => {
    const user = userEvent.setup()
    render(<ForgotPasswordForm onSwitchToLogin={mockOnSwitchToLogin} />)

    await user.click(screen.getByRole('button', { name: 'Link senden' }))

    expect(await screen.findByText('E-Mail ist erforderlich')).toBeInTheDocument()
    expect(screen.getByLabelText('E-Mail')).toHaveAttribute('aria-invalid', 'true')
    expect(authApi.requestPasswordReset).not.toHaveBeenCalled()
  })

  it('calls requestPasswordReset with email on valid submit', async () => {
    const user = userEvent.setup()
    render(<ForgotPasswordForm onSwitchToLogin={mockOnSwitchToLogin} />)

    await user.type(screen.getByLabelText('E-Mail'), 'alice@example.com')
    await user.click(screen.getByRole('button', { name: 'Link senden' }))

    await waitFor(() => {
      expect(authApi.requestPasswordReset).toHaveBeenCalledWith({
        email: 'alice@example.com',
      })
    })
  })

  it('shows success message after submit regardless of result', async () => {
    const user = userEvent.setup()
    render(<ForgotPasswordForm onSwitchToLogin={mockOnSwitchToLogin} />)

    await user.type(screen.getByLabelText('E-Mail'), 'alice@example.com')
    await user.click(screen.getByRole('button', { name: 'Link senden' }))

    expect(await screen.findByText(/falls ein konto/i)).toBeInTheDocument()
  })

  it('shows success message even when API throws (no email enumeration)', async () => {
    vi.mocked(authApi.requestPasswordReset).mockRejectedValueOnce(new Error('Some error'))
    const user = userEvent.setup()
    render(<ForgotPasswordForm onSwitchToLogin={mockOnSwitchToLogin} />)

    await user.type(screen.getByLabelText('E-Mail'), 'unknown@example.com')
    await user.click(screen.getByRole('button', { name: 'Link senden' }))

    expect(await screen.findByText(/falls ein konto/i)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('has a link back to login', async () => {
    const user = userEvent.setup()
    render(<ForgotPasswordForm onSwitchToLogin={mockOnSwitchToLogin} />)

    await user.click(screen.getByRole('button', { name: /zurück zur anmeldung/i }))
    expect(mockOnSwitchToLogin).toHaveBeenCalledOnce()
  })

  it('navigates back to login from success screen', async () => {
    const user = userEvent.setup()
    render(<ForgotPasswordForm onSwitchToLogin={mockOnSwitchToLogin} />)

    await user.type(screen.getByLabelText('E-Mail'), 'alice@example.com')
    await user.click(screen.getByRole('button', { name: 'Link senden' }))

    await screen.findByText(/falls ein konto/i)
    await user.click(screen.getByRole('button', { name: /zurück zur anmeldung/i }))

    expect(mockOnSwitchToLogin).toHaveBeenCalledOnce()
  })
})
