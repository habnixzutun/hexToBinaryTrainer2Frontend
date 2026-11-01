import { render, screen, fireEvent, waitFor } from '../../../src/test-utils.tsx'
import AccountSettingsModal from '../../../src/components/account/AccountSettingsModal.tsx'
import { AccountApiError } from '../../../src/services/accountApi.ts'
import { authValue, testUser } from '../../helpers/auth.ts'

const mockUseAuth = vi.hoisted(() => vi.fn())
vi.mock('../../../src/contexts/AuthContext.tsx', () => ({ useAuth: mockUseAuth }))

const api = vi.hoisted(() => ({
  changeUsername: vi.fn(),
  requestEmailChange: vi.fn(),
  changePassword: vi.fn(),
}))
vi.mock('../../../src/services/accountApi.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/services/accountApi.ts')>()),
  ...api,
}))

const change = (label: string | RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })

describe('AccountSettingsModal', () => {
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockUseAuth.mockReturnValue(authValue())
  })

  it('shows the three sections in a labelled dialog', () => {
    render(<AccountSettingsModal onClose={onClose} />)

    expect(screen.getByRole('dialog', { name: 'Kontoeinstellungen' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Benutzername' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'E-Mail-Adresse' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Passwort' })).toBeInTheDocument()
  })

  it('closes via the X button and via Escape', () => {
    render(<AccountSettingsModal onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Schließen' }))
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('locks the username field and names the date while the cooldown runs', () => {
    mockUseAuth.mockReturnValue(
      authValue({ user: { ...testUser, next_username_change_at: '2099-01-01T10:00:00+00:00' } }),
    )
    render(<AccountSettingsModal onClose={onClose} />)

    expect(screen.getByLabelText('Neuer Benutzername')).toBeDisabled()
    expect(screen.getByText(/erst ab dem .* wieder ändern/)).toBeInTheDocument()
  })

  it('changes the username and reloads the user', async () => {
    const refreshUser = vi.fn().mockResolvedValue(undefined)
    mockUseAuth.mockReturnValue(authValue({ refreshUser }))
    api.changeUsername.mockResolvedValue(undefined)
    render(<AccountSettingsModal onClose={onClose} />)

    change('Neuer Benutzername', 'neuer_name')
    fireEvent.click(screen.getByRole('button', { name: 'Benutzernamen ändern' }))

    await waitFor(() => expect(api.changeUsername).toHaveBeenCalledWith('neuer_name'))
    expect(await screen.findByText('Benutzername geändert.')).toBeInTheDocument()
    expect(refreshUser).toHaveBeenCalled()
  })

  it('reports a taken username', async () => {
    api.changeUsername.mockRejectedValue(new AccountApiError(409, 'Username already taken.'))
    render(<AccountSettingsModal onClose={onClose} />)

    change('Neuer Benutzername', 'vergeben')
    fireEvent.click(screen.getByRole('button', { name: 'Benutzernamen ändern' }))

    expect(await screen.findByText('Dieser Benutzername ist bereits vergeben.')).toBeInTheDocument()
  })

  it('does not call the API for an invalid email', async () => {
    render(<AccountSettingsModal onClose={onClose} />)

    change('Neue E-Mail-Adresse', 'keine-mail')
    fireEvent.click(screen.getByRole('button', { name: 'Bestätigungsmail senden' }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(api.requestEmailChange).not.toHaveBeenCalled()
  })

  it('tells the user the address only changes after the link is opened', async () => {
    api.requestEmailChange.mockResolvedValue(undefined)
    render(<AccountSettingsModal onClose={onClose} />)

    change('Neue E-Mail-Adresse', 'neu@example.com')
    fireEvent.click(screen.getByRole('button', { name: 'Bestätigungsmail senden' }))

    expect(await screen.findByText(/neu@example\.com geschickt/)).toBeInTheDocument()
  })

  it('rejects mismatching passwords before calling the API', async () => {
    render(<AccountSettingsModal onClose={onClose} />)

    change('Aktuelles Passwort', 'Alt#12345')
    change('Neues Passwort', 'Neu#12345')
    change('Neues Passwort bestätigen', 'Anders#12345')
    fireEvent.click(screen.getByRole('button', { name: 'Passwort ändern' }))

    expect(await screen.findByText('Passwörter stimmen nicht überein')).toBeInTheDocument()
    expect(api.changePassword).not.toHaveBeenCalled()
  })

  it('ends the session after a successful password change', async () => {
    const endSessionAfterPasswordChange = vi.fn().mockResolvedValue(undefined)
    mockUseAuth.mockReturnValue(authValue({ endSessionAfterPasswordChange }))
    api.changePassword.mockResolvedValue(undefined)
    render(<AccountSettingsModal onClose={onClose} />)

    change('Aktuelles Passwort', 'Alt#12345')
    change('Neues Passwort', 'Neu#12345')
    change('Neues Passwort bestätigen', 'Neu#12345')
    fireEvent.click(screen.getByRole('button', { name: 'Passwort ändern' }))

    await waitFor(() => expect(api.changePassword).toHaveBeenCalledWith('Alt#12345', 'Neu#12345'))
    await waitFor(() => expect(endSessionAfterPasswordChange).toHaveBeenCalled())
  })

  it('keeps the session and shows an error for a wrong current password', async () => {
    const endSessionAfterPasswordChange = vi.fn()
    mockUseAuth.mockReturnValue(authValue({ endSessionAfterPasswordChange }))
    api.changePassword.mockRejectedValue(new AccountApiError(401, 'Old password is incorrect.'))
    render(<AccountSettingsModal onClose={onClose} />)

    change('Aktuelles Passwort', 'Falsch#1234')
    change('Neues Passwort', 'Neu#12345')
    change('Neues Passwort bestätigen', 'Neu#12345')
    fireEvent.click(screen.getByRole('button', { name: 'Passwort ändern' }))

    expect(await screen.findByText('Das aktuelle Passwort ist falsch.')).toBeInTheDocument()
    expect(endSessionAfterPasswordChange).not.toHaveBeenCalled()
  })
})
