/**
 * DevicesSection: list active sessions and allow per-device logout.
 *
 * Loads on mount, shows a spinner while fetching, marks the current session,
 * and lets the user revoke any device (including their own — which closes the modal).
 */

import { useState, useEffect, type ReactElement } from 'react';
import { Monitor, Smartphone, Globe, MapPin, LogOut, Loader2 } from 'lucide-react';
import { useI18n } from '../../i18n/useI18n.ts';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { fetchDevices, revokeDevice, type DeviceSession } from '../../services/deviceApi.ts';

function DeviceIcon({ deviceType }: { deviceType: string }): ReactElement {
    if (deviceType === 'Mobile') return <Smartphone size={16} aria-hidden="true" className="shrink-0 text-on-surface-faint" />;
    if (deviceType === 'Desktop') return <Monitor size={16} aria-hidden="true" className="shrink-0 text-on-surface-faint" />;
    return <Globe size={16} aria-hidden="true" className="shrink-0 text-on-surface-faint" />;
}

function formatDate(iso: string, locale: string): string {
    return new Date(iso).toLocaleString(locale === 'de' ? 'de-DE' : 'en-GB', {
        dateStyle: 'short',
        timeStyle: 'short',
    });
}

export default function DevicesSection({ onSelfRevoke }: { onSelfRevoke: () => void }): ReactElement {
    const { t, locale } = useI18n();
    const { logout } = useAuth();
    const [devices, setDevices] = useState<DeviceSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [revoking, setRevoking] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetchDevices()
            .then(data => { if (!cancelled) setDevices(data); })
            .catch(() => { if (!cancelled) setError(t.accountDevicesLoadError); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [t]);

    const handleRevoke = async (device: DeviceSession): Promise<void> => {
        setRevoking(device.id);
        setError(null);
        try {
            await revokeDevice(device.id);
            if (device.is_current) {
                await logout();
                onSelfRevoke();
                return;
            }
            setDevices(prev => prev.filter(d => d.id !== device.id));
        } catch {
            setError(t.accountGenericError);
        } finally {
            setRevoking(null);
        }
    };

    return (
        <section aria-labelledby="account-devices-heading" className="space-y-3">
            <h3 id="account-devices-heading" className="text-sm font-semibold text-on-surface">
                {t.accountDevicesSection}
            </h3>
            <p className="text-xs text-on-surface-faint">{t.accountDevicesHint}</p>

            {loading && (
                <div className="flex justify-center py-4" aria-label={t.accountSaving}>
                    <Loader2 size={20} className="animate-spin text-on-surface-faint" aria-hidden="true" />
                </div>
            )}

            {!loading && devices.length === 0 && !error && (
                <p className="text-xs text-on-surface-faint">{t.accountDevicesEmpty}</p>
            )}

            {!loading && devices.length > 0 && (
                <ul className="space-y-2">
                    {devices.map(device => {
                        const location = [device.location_city, device.location_country]
                            .filter(Boolean).join(', ');
                        const isRevoking = revoking === device.id;

                        return (
                            <li
                                key={device.id}
                                className={`flex items-start gap-3 rounded-lg px-3 py-2.5 border text-xs ${
                                    device.is_current
                                        ? 'border-accent/40 bg-accent/5'
                                        : 'border-outline-faint bg-surface-alt'
                                }`}
                            >
                                <DeviceIcon deviceType={device.device_type} />
                                <div className="flex-1 min-w-0 space-y-0.5">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-medium text-on-surface">
                                            {[device.browser, device.os].filter(Boolean).join(' · ') || device.device_type}
                                        </span>
                                        {device.is_current && (
                                            <span className="text-[10px] font-semibold uppercase tracking-wide text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                                                {t.accountDevicesCurrent}
                                            </span>
                                        )}
                                    </div>
                                    {location && (
                                        <div className="flex items-center gap-1 text-on-surface-faint">
                                            <MapPin size={10} aria-hidden="true" />
                                            <span>{location}</span>
                                        </div>
                                    )}
                                    <div className="text-on-surface-faint">
                                        {t.accountDevicesSignedIn} {formatDate(device.created_at, locale)}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    disabled={isRevoking}
                                    onClick={() => void handleRevoke(device)}
                                    className="shrink-0 flex items-center gap-1 px-2 py-1 rounded text-xs text-on-surface-faint hover:text-error-text hover:bg-error-muted disabled:opacity-40 transition-colors"
                                    aria-label={device.is_current ? t.accountDevicesLogoutSelf : t.accountDevicesRevoke}
                                    title={device.is_current ? t.accountDevicesLogoutSelf : t.accountDevicesRevoke}
                                >
                                    {isRevoking
                                        ? <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                                        : <LogOut size={13} aria-hidden="true" />
                                    }
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}

            {error && <p role="alert" className="text-xs text-error-text">{error}</p>}
        </section>
    );
}
