/**
 * Structured errors for the /answer submit path.
 *
 * The service layer parses what the backend said (status, detail, Retry-After,
 * locked level) and stays free of i18n; the UI turns it into copy through
 * `mapSubmitError` with an injected `SubmitErrorCopy`.
 */

/** Backoff used when a 429 arrives without Retry-After (LV: bounded, never 0). */
export const RATE_LIMIT_FALLBACK_SECONDS = 60;

const MS_PER_SECOND = 1000;
const LOCKED_LEVEL_PATTERN = /level\s+(\d+)/i;
/** Any spelling Number() accepts — decides delta-seconds vs. HTTP-date. */
const NUMERIC_FORM = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/;
const RATE_LIMIT_STATUS = 429;
const LOCKED_STATUS = 403;

export interface ApiErrorInit {
    status: number;
    detail: string;
    retryAfterSeconds?: number | null;
    lockedLevel?: number | null;
}

export class ApiError extends Error {
    readonly status: number;
    readonly detail: string;
    readonly retryAfterSeconds: number | null;
    readonly lockedLevel: number | null;

    constructor({ status, detail, retryAfterSeconds = null, lockedLevel = null }: ApiErrorInit) {
        super(detail);
        this.name = 'ApiError';
        this.status = status;
        this.detail = detail;
        this.retryAfterSeconds = retryAfterSeconds;
        // The required level travels only inside the 403 detail (US-31/UN-05 pins
        // the wording), so deriving it here keeps every construction site — and
        // every future caller — from having to remember to parse it.
        this.lockedLevel = lockedLevel ?? (status === LOCKED_STATUS ? parseLockedLevel(detail) : null);
    }
}

export interface SubmitErrorCopy {
    fallback: string;
    lockedUntilLevel: (level: number) => string;
    rateLimited: (seconds: number) => string;
}

export interface MappedSubmitError {
    message: string;
    lockedLevel: number | null;
    isRateLimited: boolean;
    retryAfterSeconds: number | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * RFC 9110 §10.2.3: `Retry-After` is either delta-seconds or an HTTP-date.
 * A date in the past means "retry now" → 0, never a negative backoff.
 */
export function parseRetryAfterValue(raw: string | null, now: number = Date.now()): number | null {
    if (raw === null) return null;
    const trimmed = raw.trim();
    if (trimmed === '') return null;

    // Numeric-looking input is delta-seconds, even when it is malformed: falling
    // through to Date.parse would turn '1.5' into a bogus year-2001 timestamp.
    if (NUMERIC_FORM.test(trimmed)) {
        const seconds = Number(trimmed);
        return Number.isInteger(seconds) && seconds >= 0 ? seconds : null;
    }

    const epochMs = Date.parse(trimmed);
    if (Number.isNaN(epochMs)) return null;
    return Math.max(0, Math.ceil((epochMs - now) / MS_PER_SECOND));
}

/** Tolerates partial Response objects (test doubles carry no headers). */
export function extractRetryAfter(response: Response, now: number = Date.now()): number | null {
    const headers: Pick<Headers, 'get'> | undefined = response.headers;
    if (!headers) return null;
    return parseRetryAfterValue(headers.get('Retry-After'), now);
}

export function parseLockedLevel(detail: string): number | null {
    const captured = LOCKED_LEVEL_PATTERN.exec(detail)?.[1];
    if (captured === undefined) return null;
    const level = Number(captured);
    return Number.isInteger(level) && level > 0 ? level : null;
}

/** FastAPI reports 422 as `detail: [{loc, msg, type}]` — flatten to readable text. */
function flattenDetail(detail: unknown, fallback: string): string {
    if (typeof detail === 'string' && detail.trim() !== '') return detail;
    if (Array.isArray(detail)) {
        const messages = detail
            .map((entry: unknown): string | null =>
                isRecord(entry) && typeof entry.msg === 'string' && entry.msg.trim() !== ''
                    ? entry.msg
                    : null
            )
            .filter((message): message is string => message !== null);
        if (messages.length > 0) return messages.join('; ');
    }
    return fallback;
}

export async function buildApiError(response: Response, fallback: string): Promise<ApiError> {
    let detail: unknown = null;
    try {
        const body: unknown = await response.json();
        if (isRecord(body)) detail = body.detail;
    } catch {
        detail = null;
    }

    const message = flattenDetail(detail, fallback);
    return new ApiError({
        status: response.status,
        detail: message,
        retryAfterSeconds: response.status === RATE_LIMIT_STATUS ? extractRetryAfter(response) : null,
        lockedLevel: response.status === LOCKED_STATUS ? parseLockedLevel(message) : null,
    });
}

export function mapSubmitError(err: unknown, copy: SubmitErrorCopy): MappedSubmitError {
    // Transport failures leak nothing: the raw message never reaches the player.
    if (!(err instanceof ApiError)) {
        return { message: copy.fallback, lockedLevel: null, isRateLimited: false, retryAfterSeconds: null };
    }

    if (err.status === LOCKED_STATUS) {
        return {
            message: err.lockedLevel !== null ? copy.lockedUntilLevel(err.lockedLevel) : err.detail,
            lockedLevel: err.lockedLevel,
            isRateLimited: false,
            retryAfterSeconds: null,
        };
    }

    if (err.status === RATE_LIMIT_STATUS) {
        const seconds = err.retryAfterSeconds ?? RATE_LIMIT_FALLBACK_SECONDS;
        return {
            message: copy.rateLimited(seconds),
            lockedLevel: null,
            isRateLimited: true,
            retryAfterSeconds: seconds,
        };
    }

    return { message: err.detail, lockedLevel: null, isRateLimited: false, retryAfterSeconds: null };
}
