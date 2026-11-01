import { render, screen, fireEvent, waitFor } from '../../../src/test-utils.tsx'
import EmailChangeLinkScreen from '../../../src/components/account/EmailChangeLinkScreen.tsx'
import { readEmailChangeTokenFromUrl } from '../../../src/utils/emailChangeLink.ts'
import { authValue } from '../../helpers/auth.ts'

const mockUseAuth = vi.hoisted(() => vi.fn())
vi.mock('../../../src/contexts/AuthContext.tsx', () => ({ useAuth: mockUseAuth }))

const verify = vi.hoisted(() => vi.fn())
vi.mock('../../../src/services/accountApi.ts', () => ({ verifyEmailChange: verify }))

describe('EmailChangeLinkScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('confirms the token once and reloads the signed-in user on continue', async () => {
    const refreshUser = vi.fn().mockResolvedValue(undefined)
    mockUseAuth.mockReturnValue(authValue({ refreshUser }))
    verify.mockResolvedValue(undefined)
    const onDone = vi.fn()
    render(<EmailChangeLinkScreen token="mail-token" onDone={onDone} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Weiter zur App' }))

    expect(verify).toHaveBeenCalledTimes(1)
    expect(verify).toHaveBeenCalledWith('mail-token')
    expect(refreshUser).toHaveBeenCalled()
    expect(onDone).toHaveBeenCalled()
  })

  it('offers the login when nobody is signed in', async () => {
    mockUseAuth.mockReturnValue(authValue({ user: null }))
    verify.mockResolvedValue(undefined)
    render(<EmailChangeLinkScreen token="mail-token" onDone={vi.fn()} />)

    expect(await screen.findByRole('button', { name: 'Zurück zur Anmeldung' })).toBeInTheDocument()
  })

  it('shows a translated error for an expired token', async () => {
    mockUseAuth.mockReturnValue(authValue())
    verify.mockRejectedValue(new Error('Token has expired.'))
    render(<EmailChangeLinkScreen token="alt" onDone={vi.fn()} />)

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByText(/ungültig oder abgelaufen/)).toBeInTheDocument()
  })
})

describe('readEmailChangeTokenFromUrl', () => {
  afterEach(() => window.history.replaceState({}, '', '/'))

  it('reads the token from a verify-email-change link', () => {
    window.history.replaceState({}, '', '/verify-email-change?token=abc')
    expect(readEmailChangeTokenFromUrl()).toBe('abc')
  })

  it('ignores other links and empty tokens', () => {
    window.history.replaceState({}, '', '/verify-email?token=abc')
    expect(readEmailChangeTokenFromUrl()).toBeNull()
    window.history.replaceState({}, '', '/verify-email-change?token=')
    expect(readEmailChangeTokenFromUrl()).toBeNull()
  })
})
