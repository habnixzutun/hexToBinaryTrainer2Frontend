import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '../i18n/useI18n.ts';

interface ImpressumModalProps {
    onClose: () => void;
}

export default function ImpressumModal({ onClose }: ImpressumModalProps) {
    const { t } = useI18n();
    const closeRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        closeRef.current?.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60"
            role="dialog"
            aria-modal="true"
            aria-labelledby="impressum-title"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="w-full sm:max-w-lg bg-surface border border-outline rounded-t-2xl sm:rounded-xl shadow-xl flex flex-col max-h-[90dvh]">
                <div className="flex items-center justify-between px-5 py-4 border-b border-outline-faint shrink-0">
                    <h2 id="impressum-title" className="text-sm font-semibold text-on-surface">
                        {t.footerImpressumTitle}
                    </h2>
                    <button
                        ref={closeRef}
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded text-on-surface-faint hover:text-on-surface-dim transition-colors"
                        aria-label={t.footerClose}
                    >
                        <X size={16} aria-hidden="true" />
                    </button>
                </div>

                <div className="overflow-y-auto px-5 py-4 space-y-4 text-sm text-on-surface-dim">
                    <section>
                        <h3 className="font-semibold text-on-surface mb-1">{t.impressumAnbieter}</h3>
                        <p>{t.impressumName}</p>
                        <p>{t.impressumAddress}</p>
                        <p>{t.impressumCountry}</p>
                    </section>

                    <section>
                        <h3 className="font-semibold text-on-surface mb-1">{t.impressumContact}</h3>
                        <p>
                            E-Mail:{' '}
                            <a
                                href={`mailto:${t.impressumEmail}`}
                                className="text-accent hover:underline"
                            >
                                {t.impressumEmail}
                            </a>
                        </p>
                        <p>{t.impressumPhone}</p>
                    </section>

                    <section>
                        <h3 className="font-semibold text-on-surface mb-1">{t.impressumDisclaimer}</h3>
                        <p className="leading-relaxed">{t.impressumDisclaimerText}</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
