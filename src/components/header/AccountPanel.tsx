/**
 * AccountPanel: account section shared by the desktop account menu and the
 * mobile settings dropdown.
 *
 * - Logged-in user: name and email (read-only)
 * - Guest: short hint plus "Create account", which leaves guest mode and
 *   opens the registration view
 *
 * Extension point: account features (change password, email, username) will
 * be added here in a separate branch, so both menus get them at once.
 */

import { type ReactElement } from 'react';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useI18n } from '../../i18n/useI18n.ts';

export default function AccountPanel(): ReactElement {
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
        <div className="px-4 py-3">
            <p className="text-sm font-semibold text-on-surface truncate">{user?.username}</p>
            <p className="text-xs text-on-surface-faint truncate">{user?.email}</p>
        </div>
    );
}
