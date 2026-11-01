import {
  AccountApiError,
  changePassword,
  changeUsername,
  requestEmailChange,
  verifyEmailChange,
} from '../../src/services/accountApi.ts'
import { clearAccessToken, setAccessToken } from '../../src/utils/tokenManager.ts'

const mockFetch = vi.fn()

/** The (url, init) of the first fetch call, typed for header access. */
const firstCall = () =>
  mockFetch.mock.calls[0] as [string, { method: string; body: string; headers: Record<string, string> }]

const jsonResponse = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
})

describe('accountApi', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    vi.stubGlobal('fetch', mockFetch)
    setAccessToken('access-token')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    clearAccessToken()
  })

  it('PATCHes the new username with the bearer token', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, { message: 'ok' }))

    await changeUsername('neuer_name')

    const [url, init] = firstCall()
    expect(url).toMatch(/\/api\/user\/username$/)
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body)).toEqual({ new_username: 'neuer_name' })
    expect(init.headers.Authorization).toBe('Bearer access-token')
  })

  it('sends the email change request to the email endpoint', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, { message: 'ok' }))

    await requestEmailChange('neu@example.com')

    const [url, init] = firstCall()
    expect(url).toMatch(/\/api\/user\/email$/)
    expect(JSON.parse(init.body)).toEqual({ new_email: 'neu@example.com' })
  })

  it('sends old and new password as snake_case fields', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, { message: 'ok' }))

    await changePassword('Alt#1234', 'Neu#12345')

    const [url, init] = firstCall()
    expect(url).toMatch(/\/api\/user\/change-password$/)
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({ old_password: 'Alt#1234', new_password: 'Neu#12345' })
  })

  it('carries the status of a failed request', async () => {
    mockFetch.mockResolvedValue(jsonResponse(409, { detail: 'Username already taken.' }))

    await expect(changeUsername('vergeben')).rejects.toMatchObject({
      name: 'AccountApiError',
      status: 409,
      message: 'Username already taken.',
    })
  })

  it('exposes the end of the cooldown from a 429 object detail', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(429, {
        detail: {
          message: 'Username can only be changed once every 7 days.',
          next_change_at: '2026-11-08T10:00:00+00:00',
        },
      }),
    )

    const error = await changeUsername('zu_frueh').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(AccountApiError)
    expect((error as AccountApiError).status).toBe(429)
    expect((error as AccountApiError).nextChangeAt).toBe('2026-11-08T10:00:00+00:00')
  })

  it('falls back to a generic message for a 422 list detail', async () => {
    mockFetch.mockResolvedValue(jsonResponse(422, { detail: [{ msg: 'bad', loc: ['body'] }] }))

    await expect(requestEmailChange('kaputt')).rejects.toMatchObject({
      status: 422,
      message: 'Email change request failed',
    })
  })

  it('verifies an email change token without an Authorization header', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, { message: 'ok' }))

    await verifyEmailChange('mail-token')

    const [url, init] = firstCall()
    expect(url).toMatch(/\/api\/auth\/verify-email-change$/)
    expect(JSON.parse(init.body)).toEqual({ token: 'mail-token' })
    expect(init.headers.Authorization).toBeUndefined()
  })

  it('rejects an invalid verification token', async () => {
    mockFetch.mockResolvedValue(jsonResponse(400, { detail: 'Token has expired.' }))

    await expect(verifyEmailChange('alt')).rejects.toMatchObject({ status: 400 })
  })
})
