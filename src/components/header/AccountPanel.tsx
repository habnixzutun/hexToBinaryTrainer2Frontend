/**
 * AccountPanel: account section shared by the desktop account menu and the
 * mobile settings dropdown.
 *
 * - Logged-in user: name, email and an "Account settings" entry that opens the
 *   settings dialog (username, email, password)
 * - Guest: short hint plus "Create account", which leaves guest mode and
 *   opens the registration view
 *
 * The dialog itself is owned by App, not by this panel: the panel lives inside
 * dropdowns that unmount on outside clicks, which would tear the dialog down.
 * The panel only asks for it via `onOpenSettings`.
 */

import { type ReactElement } from 'react';
import { UserCog, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useI18n } from '../../i18n/useI18n.ts';

interface Props {
    onOpenSettings: () => void;
}

export default function AccountPanel({ onOpenSettings }: Props): ReactElement {
    const { user, isGuest, leaveGuest } = useAuth();
    const { t } = useI18n();

    if (isGuest) {
        return (
            <div className="px-4 py-3 space-y-3">
                <p className="text-sm text-on-surface-dim leading-relaxed">{t.accountGuestInfo}</p>
                <button
                    type="button"
                    onClick={() => leaveGuest('register')}
                    className="w-full flex items-center justify-center gap-2 min-h-[44px] rounded-md bg-accent text-on-accent text-sm font-semibold hover:bg-accent-bright transition-colors"
                >
                    <UserPlus className="w-4 h-4" aria-hidden="true" />
                    <span>{t.accountCreate}</span>
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="px-4 py-3">
                <p className="text-sm font-semibold text-on-surface truncate">{user?.username}</p>
                <p className="text-xs text-on-surface-faint truncate">{user?.email}</p>
            </div>
            <button
                type="button"
                onClick={onOpenSettings}
                className="w-full flex items-center gap-3 px-4 min-h-[44px] border-t border-outline-faint text-sm text-left text-on-surface-dim hover:bg-surface-alt transition-colors"
            >
                <UserCog size={16} aria-hidden="true" />
                <span>{t.accountSettings}</span>
            </button>
        </div>
    );
}
