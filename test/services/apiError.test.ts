import { describe, it, expect } from 'vitest'
import {
    ApiError,
    RATE_LIMIT_FALLBACK_SECONDS,
    buildApiError,
    extractRetryAfter,
    mapSubmitError,
    parseLockedLevel,
    parseRetryAfterValue,
    type SubmitErrorCopy,
} from '../../src/services/apiError.ts'

const jsonResponse = (status: number, body: unknown, headers: Record<string, string> = {}) => ({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
    json: async () => body,
})

const copy: SubmitErrorCopy = {
    fallback: 'Error saving result. Please try again.',
    lockedUntilLevel: (level) => `Unlocked at level ${level}`,
    rateLimited: (seconds) => `Wait ${seconds}s`,
}

describe('apiError', () => {
    describe('parseRetryAfterValue', () => {
        it('reads delta-seconds', () => {
            expect(parseRetryAfterValue('30')).toBe(30)
            expect(parseRetryAfterValue('0')).toBe(0)
        })

        it('returns null for missing, blank or malformed values', () => {
            expect(parseRetryAfterValue(null)).toBeNull()
            expect(parseRetryAfterValue('')).toBeNull()
            expect(parseRetryAfterValue('soon')).toBeNull()
            expect(parseRetryAfterValue('-5')).toBeNull()
            expect(parseRetryAfterValue('1.5')).toBeNull()
        })

        // RFC 9110 §10.2.3 allows the HTTP-date form as well as delta-seconds.
        it('converts an HTTP-date into the seconds that remain', () => {
            const now = Date.parse('Wed, 21 Oct 2026 07:28:00 GMT')
            expect(parseRetryAfterValue('Wed, 21 Oct 2026 07:28:25 GMT', now)).toBe(25)
        })

        it('clamps a date that already passed to a zero-second backoff', () => {
            const now = Date.parse('Wed, 21 Oct 2026 07:28:00 GMT')
            expect(parseRetryAfterValue('Wed, 21 Oct 2026 07:27:00 GMT', now)).toBe(0)
        })
    })

    describe('extractRetryAfter', () => {
        it('reads the Retry-After header', () => {
            const response = jsonResponse(429, {}, { 'retry-after': '17' }) as unknown as Response
            expect(extractRetryAfter(response)).toBe(17)
        })

        it('tolerates partial Response objects (test mocks have no headers)', () => {
            const partial = { ok: false, status: 429, json: async () => ({}) } as unknown as Response
            expect(extractRetryAfter(partial)).toBeNull()
        })
    })

    describe('parseLockedLevel', () => {
        it('parses the required level out of the 403 detail', () => {
            expect(parseLockedLevel('Content locked until level 8')).toBe(8)
            expect(parseLockedLevel('content locked until Level 13')).toBe(13)
        })

        it('returns null when no level is named', () => {
            expect(parseLockedLevel('Forbidden')).toBeNull()
            expect(parseLockedLevel('')).toBeNull()
        })
    })

    describe('ApiError', () => {
        it('derives the locked level from a 403 detail so no caller can forget it', () => {
            const err = new ApiError({ status: 403, detail: 'Content locked until level 8' })
            expect(err.lockedLevel).toBe(8)
        })

        it('keeps an explicit locked level and never guesses outside a 403', () => {
            const explicit = new ApiError({
                status: 403,
                detail: 'Content locked until level 4',
                lockedLevel: 13,
            })
            expect(explicit.lockedLevel).toBe(13)

            const otherStatus = new ApiError({ status: 404, detail: 'Content locked until level 4' })
            expect(otherStatus.lockedLevel).toBeNull()
        })
    })

    describe('buildApiError', () => {
        it('carries status, detail and the parsed locked level', async () => {
            const err = await buildApiError(
                jsonResponse(403, { detail: 'Content locked until level 4' }) as unknown as Response,
                'fallback'
            )

            expect(err).toBeInstanceOf(ApiError)
            expect(err).toBeInstanceOf(Error)
            expect(err.status).toBe(403)
            expect(err.detail).toBe('Content locked until level 4')
            expect(err.message).toBe('Content locked until level 4')
            expect(err.lockedLevel).toBe(4)
            expect(err.retryAfterSeconds).toBeNull()
        })

        it('carries the backoff seconds on a 429', async () => {
            const err = await buildApiError(
                jsonResponse(429, { detail: 'Too many answers' }, { 'retry-after': '42' }) as unknown as Response,
                'fallback'
            )

            expect(err.status).toBe(429)
            expect(err.retryAfterSeconds).toBe(42)
        })

        it('flattens FastAPI 422 detail arrays into a readable message', async () => {
            const err = await buildApiError(
                jsonResponse(422, {
                    detail: [
                        { loc: ['body', 'bit_width'], msg: 'Input should be 4, 8, 16 or 32', type: 'value_error' },
                    ],
                }) as unknown as Response,
                'fallback'
            )

            expect(err.status).toBe(422)
            expect(err.detail).toContain('Input should be 4, 8, 16 or 32')
        })

        it('falls back when the body is not JSON', async () => {
            const err = await buildApiError(
                {
                    ok: false,
                    status: 500,
                    headers: { get: () => null },
                    json: async () => {
                        throw new SyntaxError('Unexpected token')
                    },
                } as unknown as Response,
                'Failed to submit answer'
            )

            expect(err.detail).toBe('Failed to submit answer')
            expect(err.message).toBe('Failed to submit answer')
        })

        it('falls back when the body has no usable detail', async () => {
            const err = await buildApiError(jsonResponse(404, {}) as unknown as Response, 'nope')
            expect(err.detail).toBe('nope')
        })

        it('never leaks a non-string detail into the message', async () => {
            const err = await buildApiError(
                jsonResponse(400, { detail: { unexpected: true } }) as unknown as Response,
                'fallback'
            )
            expect(typeof err.detail).toBe('string')
            expect(err.detail).toBe('fallback')
        })
    })

    describe('mapSubmitError', () => {
        it('turns a 403 into the required-level copy', () => {
            const mapped = mapSubmitError(new ApiError({ status: 403, detail: 'Content locked until level 8' }), copy)

            expect(mapped.message).toBe('Unlocked at level 8')
            expect(mapped.lockedLevel).toBe(8)
            expect(mapped.isRateLimited).toBe(false)
            expect(mapped.retryAfterSeconds).toBeNull()
        })

        it('keeps the server detail when a 403 names no level', () => {
            const mapped = mapSubmitError(new ApiError({ status: 403, detail: 'Forbidden' }), copy)
            expect(mapped.message).toBe('Forbidden')
            expect(mapped.lockedLevel).toBeNull()
        })

        it('normalises a 429 backoff, filling in the fallback when the header is absent', () => {
            const withHeader = mapSubmitError(
                new ApiError({ status: 429, detail: 'Too many answers', retryAfterSeconds: 30 }),
                copy
            )
            expect(withHeader.message).toBe('Wait 30s')
            expect(withHeader.retryAfterSeconds).toBe(30)
            expect(withHeader.isRateLimited).toBe(true)

            const withoutHeader = mapSubmitError(new ApiError({ status: 429, detail: 'Too many answers' }), copy)
            expect(withoutHeader.retryAfterSeconds).toBe(RATE_LIMIT_FALLBACK_SECONDS)
            expect(withoutHeader.message).toBe(`Wait ${RATE_LIMIT_FALLBACK_SECONDS}s`)
        })

        it('never surfaces raw transport errors — only the generic copy', () => {
            for (const err of [new TypeError('Failed to fetch'), 'boom', null, undefined, 42]) {
                const mapped = mapSubmitError(err, copy)
                expect(mapped.message).toBe(copy.fallback)
                expect(mapped.isRateLimited).toBe(false)
                expect(mapped.lockedLevel).toBeNull()
            }
        })

        it('maps unexpected HTTP statuses to the server detail', () => {
            const mapped = mapSubmitError(new ApiError({ status: 404, detail: 'User not found.' }), copy)
            expect(mapped.message).toBe('User not found.')
        })
    })
})
