import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '../i18n/useI18n.ts';

interface DatenschutzModalProps {
    onClose: () => void;
}

export default function DatenschutzModal({ onClose }: DatenschutzModalProps) {
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
            aria-labelledby="datenschutz-title"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="w-full sm:max-w-lg bg-surface border border-outline rounded-t-2xl sm:rounded-xl shadow-xl flex flex-col max-h-[90dvh]">
                <div className="flex items-center justify-between px-5 py-4 border-b border-outline-faint shrink-0">
                    <h2 id="datenschutz-title" className="text-sm font-semibold text-on-surface">
                        {t.footerDatenschutzTitle}
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
                        <h3 className="font-semibold text-on-surface mb-1">{t.datenschutzIntroTitle}</h3>
                        <p className="leading-relaxed">{t.datenschutzIntroText}</p>
                    </section>

                    <section>
                        <h3 className="font-semibold text-on-surface mb-1">{t.datenschutzDataCollectionTitle}</h3>
                        <p className="leading-relaxed">{t.datenschutzDataCollectionText}</p>
                    </section>

                    <section>
                        <h3 className="font-semibold text-on-surface mb-1">{t.datenschutzCookiesTitle}</h3>
                        <p className="leading-relaxed">{t.datenschutzCookiesText}</p>
                    </section>

                    <section>
                        <h3 className="font-semibold text-on-surface mb-1">{t.datenschutzRightsTitle}</h3>
                        <p className="leading-relaxed">{t.datenschutzRightsText}</p>
                    </section>

                    <section>
                        <h3 className="font-semibold text-on-surface mb-1">{t.datenschutzContactTitle}</h3>
                        <p className="leading-relaxed">{t.datenschutzContactText}</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
