/**
 * Device & Account Deletion API (US-44–US-48).
 *
 * - GET  /api/auth/devices              — list active sessions
 * - DELETE /api/auth/devices/{id}       — revoke one session
 * - POST /api/users/me/delete/request   — send deletion confirmation email
 * - POST /api/users/me/delete/confirm   — confirm deletion (public, token + pw)
 */

import { authenticatedFetch } from './api.ts';
import { AccountApiError } from './accountApi.ts';

const BASE_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export interface DeviceSession {
    id: string;
    device_type: string;
    browser: string | null;
    os: string | null;
    ip_address: string | null;
    location_city: string | null;
    location_country: string | null;
    created_at: string;
    expires_at: string;
    is_current: boolean;
}

async function toApiError(response: Response, fallback: string): Promise<AccountApiError> {
    const body = await response.json().catch(() => null) as { detail?: unknown } | null;
    const detail = body?.detail;
    if (typeof detail === 'string') return new AccountApiError(response.status, detail);
    return new AccountApiError(response.status, fallback);
}

export async function fetchDevices(): Promise<DeviceSession[]> {
    const response = await authenticatedFetch(`${BASE_URL}/api/auth/devices`);
    if (!response.ok) throw await toApiError(response, 'Failed to load devices');
    const data = (await response.json()) as { devices: DeviceSession[] };
    return data.devices;
}

export async function revokeDevice(tokenId: string): Promise<void> {
    const response = await authenticatedFetch(`${BASE_URL}/api/auth/devices/${tokenId}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw await toApiError(response, 'Failed to revoke device');
}

export async function requestAccountDeletion(): Promise<void> {
    const response = await authenticatedFetch(`${BASE_URL}/api/users/me/delete/request`, {
        method: 'POST',
    });
    if (!response.ok) throw await toApiError(response, 'Failed to request account deletion');
}

export async function confirmAccountDeletion(token: string, password: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/api/users/me/delete/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, password }),
    });
    if (!response.ok) throw await toApiError(response, 'Failed to confirm account deletion');
}
