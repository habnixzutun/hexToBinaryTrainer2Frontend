import { userEvent } from '@testing-library/user-event'
import { render, screen, waitFor } from '../../../src/test-utils.tsx'
import ResetPasswordForm from '../../../src/components/auth/ResetPasswordForm.tsx'
import * as authApi from '../../../src/services/authApi.ts'

vi.mock('../../../src/services/authApi.ts', () => ({
  resetPassword: vi.fn().mockResolvedValue({ message: 'Password reset.' }),
}))

const TEST_TOKEN = 'reset-token-123'
const mockOnSwitchToLogin = vi.fn()

const VALID_PASSWORD = 'Test1234!'

// Use getByPlaceholderText to disambiguate since both inputs have
// labels that share the prefix "Neues Passwort".
const getNewPasswordInput = () => screen.getByPlaceholderText('Neues Passwort')
const getConfirmPasswordInput = () => screen.getByPlaceholderText('Neues Passwort bestätigen')

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOnSwitchToLogin.mockReset()
  })

  it('renders password and confirm password inputs', () => {
    render(
      <ResetPasswordForm token={TEST_TOKEN} onSwitchToLogin={mockOnSwitchToLogin} />
    )

    expect(getNewPasswordInput()).toBeInTheDocument()
    expect(getConfirmPasswordInput()).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Passwort zurücksetzen' })).toBeInTheDocument()
  })

  it('shows validation error for empty password', async () => {
    const user = userEvent.setup()
    render(
      <ResetPasswordForm token={TEST_TOKEN} onSwitchToLogin={mockOnSwitchToLogin} />
    )

    await user.click(screen.getByRole('button', { name: 'Passwort zurücksetzen' }))

    expect(await screen.findByText('Passwort muss mindestens 8 Zeichen lang sein')).toBeInTheDocument()
    expect(authApi.resetPassword).not.toHaveBeenCalled()
  })

  it('shows password requirements as user types', async () => {
    const user = userEvent.setup()
    render(
      <ResetPasswordForm token={TEST_TOKEN} onSwitchToLogin={mockOnSwitchToLogin} />
    )

    await user.type(getNewPasswordInput(), 'abc')

    expect(screen.getByText('Mindestens 8 Zeichen')).toBeInTheDocument()
    expect(screen.getByText('Ein Großbuchstabe')).toBeInTheDocument()
    expect(screen.getByText('Ein Kleinbuchstabe')).toBeInTheDocument()
    expect(screen.getByText('Eine Zahl')).toBeInTheDocument()
    expect(screen.getByText('Ein Sonderzeichen')).toBeInTheDocument()
  })

  it('shows validation error when password is too short', async () => {
    const user = userEvent.setup()
    render(
      <ResetPasswordForm token={TEST_TOKEN} onSwitchToLogin={mockOnSwitchToLogin} />
    )

    await user.type(getNewPasswordInput(), 'Ab1!')
    await user.type(getConfirmPasswordInput(), 'Ab1!')
    await user.click(screen.getByRole('button', { name: 'Passwort zurücksetzen' }))

    expect(await screen.findByText('Passwort muss mindestens 8 Zeichen lang sein')).toBeInTheDocument()
    expect(authApi.resetPassword).not.toHaveBeenCalled()
  })

  it('shows validation error for missing uppercase', async () => {
    const user = userEvent.setup()
    render(
      <ResetPasswordForm token={TEST_TOKEN} onSwitchToLogin={mockOnSwitchToLogin} />
    )

    await user.type(getNewPasswordInput(), 'test1234!')
    await user.type(getConfirmPasswordInput(), 'test1234!')
    await user.click(screen.getByRole('button', { name: 'Passwort zurücksetzen' }))

    expect(await screen.findByText('Passwort muss mindestens einen Großbuchstaben enthalten')).toBeInTheDocument()
    expect(authApi.resetPassword).not.toHaveBeenCalled()
  })

  it('shows validation error when passwords do not match', async () => {
    const user = userEvent.setup()
    render(
      <ResetPasswordForm token={TEST_TOKEN} onSwitchToLogin={mockOnSwitchToLogin} />
    )

    await user.type(getNewPasswordInput(), VALID_PASSWORD)
    await user.type(getConfirmPasswordInput(), 'Other1234!')
    await user.click(screen.getByRole('button', { name: 'Passwort zurücksetzen' }))

    expect(await screen.findByText('Passwörter stimmen nicht überein')).toBeInTheDocument()
    expect(authApi.resetPassword).not.toHaveBeenCalled()
  })

  it('calls resetPassword with token and new password on valid submit', async () => {
    const user = userEvent.setup()
    render(
      <ResetPasswordForm token={TEST_TOKEN} onSwitchToLogin={mockOnSwitchToLogin} />
    )

    await user.type(getNewPasswordInput(), VALID_PASSWORD)
    await user.type(getConfirmPasswordInput(), VALID_PASSWORD)
    await user.click(screen.getByRole('button', { name: 'Passwort zurücksetzen' }))

    await waitFor(() => {
      expect(authApi.resetPassword).toHaveBeenCalledWith({
        token: TEST_TOKEN,
        new_password: VALID_PASSWORD,
      })
    })
  })

  it('shows success screen after successful reset', async () => {
    const user = userEvent.setup()
    render(
      <ResetPasswordForm token={TEST_TOKEN} onSwitchToLogin={mockOnSwitchToLogin} />
    )

    await user.type(getNewPasswordInput(), VALID_PASSWORD)
    await user.type(getConfirmPasswordInput(), VALID_PASSWORD)
    await user.click(screen.getByRole('button', { name: 'Passwort zurücksetzen' }))

    expect(await screen.findByText('Dein Passwort wurde erfolgreich zurückgesetzt.')).toBeInTheDocument()
  })

  it('navigates to login from success screen', async () => {
    const user = userEvent.setup()
    render(
      <ResetPasswordForm token={TEST_TOKEN} onSwitchToLogin={mockOnSwitchToLogin} />
    )

    await user.type(getNewPasswordInput(), VALID_PASSWORD)
    await user.type(getConfirmPasswordInput(), VALID_PASSWORD)
    await user.click(screen.getByRole('button', { name: 'Passwort zurücksetzen' }))

    await screen.findByText('Dein Passwort wurde erfolgreich zurückgesetzt.')
    await user.click(screen.getByRole('button', { name: /zurück zur anmeldung/i }))

    expect(mockOnSwitchToLogin).toHaveBeenCalledOnce()
  })

  it('shows error message when API fails', async () => {
    vi.mocked(authApi.resetPassword).mockRejectedValueOnce(new Error('Token expired'))
    const user = userEvent.setup()
    render(
      <ResetPasswordForm token={TEST_TOKEN} onSwitchToLogin={mockOnSwitchToLogin} />
    )

    await user.type(getNewPasswordInput(), VALID_PASSWORD)
    await user.type(getConfirmPasswordInput(), VALID_PASSWORD)
    await user.click(screen.getByRole('button', { name: 'Passwort zurücksetzen' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Token expired')
  })
})
