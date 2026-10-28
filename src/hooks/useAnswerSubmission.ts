/**
 * Submit-hook for POST /api/game/answer.
 *
 * Owns the three things a trainer component must never compute itself:
 * - the in-flight flag (double-submit protection)
 * - the player-facing error copy (i18n lives here, the service layer stays free of it)
 * - the 429 cooldown (so the button blocks instead of spamming the endpoint)
 *
 * The answer object is returned untouched: the server is the only author of the
 * XP economy, and this hook is not allowed to interpret it.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { gameApi, type GameAnswerResponse } from '../services/api.ts';
import { mapSubmitError } from '../services/apiError.ts';
import { useI18n } from '../i18n/useI18n.ts';
import type { GameMode } from '../constants/gameModes.ts';

const MS_PER_SECOND = 1000;

export interface AnswerSubmission {
    /** Resolves to the server answer, or `null` when the submit failed. */
    submit: (mode: GameMode, bitWidth: number, isCorrect: boolean) => Promise<GameAnswerResponse | null>;
    isSubmitting: boolean;
    errorMessage: string | null;
    /**
     * Backoff window from a 429; `null` while no cooldown is armed. Components
     * bind it to the submit button instead of retrying on their own — the
     * cooldown releases itself once it has elapsed.
     */
    cooldownMs: number | null;
    clearError: () => void;
}

/**
 * @param onLocked - Called on a 403, i.e. when the server opened a tier the
 *        client did not know about or — the case that matters — the client
 *        offered a tier the server still locks. The caller refreshes the
 *        profile so the option list catches up instead of dead-ending
 *        (US-39 AC-4: the server stays authoritative).
 */
export function useAnswerSubmission(onLocked?: () => void): AnswerSubmission {
    const { t } = useI18n();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [cooldownMs, setCooldownMs] = useState<number | null>(null);
    const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const releaseCooldown = useCallback((): void => {
        if (cooldownTimer.current !== null) {
            clearTimeout(cooldownTimer.current);
            cooldownTimer.current = null;
        }
    }, []);

    /** The backoff is a countdown, not a permanent lock: it lifts itself. */
    const armCooldown = useCallback((ms: number): void => {
        releaseCooldown();
        cooldownTimer.current = setTimeout(() => {
            cooldownTimer.current = null;
            setCooldownMs(null);
        }, ms);
    }, [releaseCooldown]);

    useEffect(() => releaseCooldown, [releaseCooldown]);

    const clearError = useCallback((): void => {
        setErrorMessage(null);
    }, []);

    const submit = useCallback(async (
        mode: GameMode,
        bitWidth: number,
        isCorrect: boolean
    ): Promise<GameAnswerResponse | null> => {
        // A new attempt always replaces the previous outcome — an armed cooldown
        // must never survive into the next answer, and the old error must not
        // linger next to a fresh success.
        releaseCooldown();
        setErrorMessage(null);
        setCooldownMs(null);
        setIsSubmitting(true);

        try {
            return await gameApi.submitAnswer(mode, bitWidth, isCorrect);
        } catch (err) {
            const mapped = mapSubmitError(err, {
                fallback: t.errorSaving,
                lockedUntilLevel: t.lockedUntilLevel,
                rateLimited: t.rateLimited,
            });
            setErrorMessage(mapped.message);
            if (mapped.lockedLevel !== null) {
                onLocked?.();
            }
            if (mapped.isRateLimited && mapped.retryAfterSeconds !== null) {
                const ms = mapped.retryAfterSeconds * MS_PER_SECOND;
                setCooldownMs(ms);
                armCooldown(ms);
            }
            return null;
        } finally {
            setIsSubmitting(false);
        }
    }, [t, armCooldown, releaseCooldown, onLocked]);

    return { submit, isSubmitting, errorMessage, cooldownMs, clearError };
}
