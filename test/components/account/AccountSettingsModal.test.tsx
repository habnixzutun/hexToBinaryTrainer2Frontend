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

/** Click a tab button in the sidebar / dropdown to switch the active section. */
const selectTab = (tabLabel: string | RegExp) => {
  const tabButton = screen.getByRole('button', { name: tabLabel })
  // On mobile the tab is inside a dropdown — open it first if needed.
  // On desktop it's directly visible. Clicking always works.
  fireEvent.click(tabButton)
}

describe('AccountSettingsModal', () => {
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockUseAuth.mockReturnValue(authValue())
  })

  it('shows the dialog with the username section active by default', () => {
    render(<AccountSettingsModal onClose={onClose} />)

    expect(screen.getByRole('dialog', { name: 'Kontoeinstellungen' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Benutzername' })).toBeInTheDocument()
    // Email and Password sections are still in the DOM but hidden.
    const emailHeading = screen.getByRole('heading', { name: 'E-Mail-Adresse', hidden: true })
    const passwordHeading = screen.getByRole('heading', { name: 'Passwort', hidden: true })
    expect(emailHeading.closest('.hidden')).toBeInTheDocument()
    expect(passwordHeading.closest('.hidden')).toBeInTheDocument()
  })

  it('switches sections when a different tab is clicked', () => {
    render(<AccountSettingsModal onClose={onClose} />)

    // Start on Username tab.
    expect(screen.getByRole('heading', { name: 'Benutzername' })).toBeInTheDocument()

    // Switch to Email.
    selectTab('E-Mail-Adresse')
    expect(screen.getByRole('heading', { name: 'E-Mail-Adresse' })).toBeInTheDocument()
    const usernameHeading = screen.getByRole('heading', { name: 'Benutzername', hidden: true })
    expect(usernameHeading.closest('.hidden')).toBeInTheDocument()

    // Switch to Password.
    selectTab('Passwort')
    expect(screen.getByRole('heading', { name: 'Passwort' })).toBeInTheDocument()
    const emailHeading = screen.getByRole('heading', { name: 'E-Mail-Adresse', hidden: true })
    expect(emailHeading.closest('.hidden')).toBeInTheDocument()
  })

  it('shows user info in the sidebar header', () => {
    render(<AccountSettingsModal onClose={onClose} />)

    // Username appears twice (sidebar + username section), so use getAllByText.
    expect(screen.getAllByText(testUser.username)).toHaveLength(2)
    // Email appears twice now too (sidebar header + always-rendered email section).
    expect(screen.getAllByText(testUser.email)).toHaveLength(2)
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

    selectTab('E-Mail-Adresse')

    change('Neue E-Mail-Adresse', 'keine-mail')
    fireEvent.click(screen.getByRole('button', { name: 'Bestätigungsmail senden' }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(api.requestEmailChange).not.toHaveBeenCalled()
  })

  it('tells the user the address only changes after the link is opened', async () => {
    api.requestEmailChange.mockResolvedValue(undefined)
    render(<AccountSettingsModal onClose={onClose} />)

    selectTab('E-Mail-Adresse')

    change('Neue E-Mail-Adresse', 'neu@example.com')
    fireEvent.click(screen.getByRole('button', { name: 'Bestätigungsmail senden' }))

    expect(await screen.findByText(/neu@example\.com geschickt/)).toBeInTheDocument()
  })

  it('rejects mismatching passwords before calling the API', async () => {
    render(<AccountSettingsModal onClose={onClose} />)

    selectTab('Passwort')

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

    selectTab('Passwort')

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

    selectTab('Passwort')

    change('Aktuelles Passwort', 'Falsch#1234')
    change('Neues Passwort', 'Neu#12345')
    change('Neues Passwort bestätigen', 'Neu#12345')
    fireEvent.click(screen.getByRole('button', { name: 'Passwort ändern' }))

    expect(await screen.findByText('Das aktuelle Passwort ist falsch.')).toBeInTheDocument()
    expect(endSessionAfterPasswordChange).not.toHaveBeenCalled()
  })
})
