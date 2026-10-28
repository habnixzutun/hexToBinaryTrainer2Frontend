import { renderHook, act, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useAnswerSubmission } from '../../src/hooks/useAnswerSubmission.ts'
import { gameApi, type GameAnswerResponse } from '../../src/services/api.ts'
import { ApiError, RATE_LIMIT_FALLBACK_SECONDS } from '../../src/services/apiError.ts'
import { I18nProvider } from '../../src/i18n/I18nContext.tsx'

vi.mock('../../src/services/api.ts', () => ({
  gameApi: { submitAnswer: vi.fn() },
}))

const mockSubmitAnswer = vi.mocked(gameApi.submitAnswer)

/** Mid-level answer: L5 with 88 of 508 XP. */
const answer: GameAnswerResponse = {
  xp_delta: 32,
  total_xp: 1280,
  level: 5,
  xp_in_level: 88,
  xp_required_for_next_level: 508,
  current_streak: 2,
  best_streak: 7,
  correct_count: 41,
  incorrect_count: 5,
  newly_unlocked: [],
}

const wrapper = ({ children }: { children: ReactNode }) => <I18nProvider>{children}</I18nProvider>

describe('useAnswerSubmission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockSubmitAnswer.mockResolvedValue(answer)
  })

  it('returns the untouched server answer as the single source of truth', async () => {
    const { result } = renderHook(() => useAnswerSubmission(), { wrapper })

    await act(async () => {
      expect(await result.current.submit('hex_to_bin', 8, true)).toEqual(answer)
    })

    expect(mockSubmitAnswer).toHaveBeenCalledWith('hex_to_bin', 8, true)
    expect(result.current.errorMessage).toBeNull()
  })

  it('reports the in-flight state so the trainer cannot double-submit', async () => {
    const gate: { resolve: ((value: GameAnswerResponse) => void) | null } = { resolve: null }
    mockSubmitAnswer.mockReturnValue(
      new Promise<GameAnswerResponse>((resolve) => {
        gate.resolve = resolve
      })
    )
    const { result } = renderHook(() => useAnswerSubmission(), { wrapper })

    let returned: Promise<GameAnswerResponse | null> = Promise.resolve(null)
    act(() => {
      returned = result.current.submit('hex_to_bin', 8, true)
    })
    await waitFor(() => expect(result.current.isSubmitting).toBe(true))

    await act(async () => {
      gate.resolve?.(answer)
      await expect(returned).resolves.toEqual(answer)
    })

    expect(result.current.isSubmitting).toBe(false)
  })

  it('returns null and the generic copy for a transport failure', async () => {
    mockSubmitAnswer.mockRejectedValue(new TypeError('Failed to fetch'))
    const { result } = renderHook(() => useAnswerSubmission(), { wrapper })

    await act(async () => {
      expect(await result.current.submit('hex_to_bin', 8, true)).toBeNull()
    })

    expect(result.current.errorMessage).toBe('Fehler beim Speichern. Bitte nochmal versuchen.')
    expect(result.current.cooldownMs).toBeNull()
  })

  it('names the required level on a 403 locked response (AC-3)', async () => {
    mockSubmitAnswer.mockRejectedValue(
      new ApiError({ status: 403, detail: 'Content locked until level 13' })
    )
    const { result } = renderHook(() => useAnswerSubmission(), { wrapper })

    await act(async () => {
      await result.current.submit('hex_to_bin', 32, true)
    })

    expect(result.current.errorMessage).toBe('Freigeschaltet ab Stufe 13.')
  })

  it('arms a cooldown from Retry-After on a 429 (AC-3)', async () => {
    mockSubmitAnswer.mockRejectedValue(
      new ApiError({ status: 429, detail: 'Too many answers.', retryAfterSeconds: 25 })
    )
    const { result } = renderHook(() => useAnswerSubmission(), { wrapper })

    await act(async () => {
      await result.current.submit('hex_to_bin', 8, false)
    })

    expect(result.current.errorMessage).toContain('25')
    expect(result.current.cooldownMs).toBe(25_000)
  })

  it('falls back to a bounded cooldown when the 429 carries no header', async () => {
    mockSubmitAnswer.mockRejectedValue(new ApiError({ status: 429, detail: 'Too many answers.' }))
    const { result } = renderHook(() => useAnswerSubmission(), { wrapper })

    await act(async () => {
      await result.current.submit('hex_to_bin', 8, false)
    })

    expect(result.current.cooldownMs).toBe(RATE_LIMIT_FALLBACK_SECONDS * 1000)
  })

  it('drops the cooldown and the message on the next attempt', async () => {
    mockSubmitAnswer.mockRejectedValueOnce(
      new ApiError({ status: 429, detail: 'Too many answers.', retryAfterSeconds: 30 })
    )
    const { result } = renderHook(() => useAnswerSubmission(), { wrapper })

    await act(async () => {
      await result.current.submit('hex_to_bin', 8, true)
    })
    expect(result.current.cooldownMs).toBe(30_000)

    mockSubmitAnswer.mockResolvedValue(answer)
    await act(async () => {
      await result.current.submit('hex_to_bin', 8, true)
    })

    expect(result.current.cooldownMs).toBeNull()
    expect(result.current.errorMessage).toBeNull()
  })

  it('clears the message on demand', async () => {
    mockSubmitAnswer.mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useAnswerSubmission(), { wrapper })

    await act(async () => {
      await result.current.submit('hex_to_bin', 8, true)
    })
    expect(result.current.errorMessage).not.toBeNull()

    act(() => result.current.clearError())

    expect(result.current.errorMessage).toBeNull()
  })

  it('speaks English when the locale is en', async () => {
    localStorage.setItem('locale', 'en')
    mockSubmitAnswer.mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useAnswerSubmission(), { wrapper })

    await act(async () => {
      await result.current.submit('hex_to_bin', 8, true)
    })

    expect(result.current.errorMessage).toBe('Error saving result. Please try again.')
  })
})
