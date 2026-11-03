import { useState, useEffect, type ReactElement } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, Loader2 } from 'lucide-react';
import TerminalIcon from './components/icons/TerminalIcon';
import Sidebar from './components/Sidebar.tsx';
import HexBinTrainer from './components/HexBinTrainer.tsx';
import UnicodeTrainer from './components/UnicodeTrainer.tsx';
import Leaderboard from './components/Leaderboard.tsx';
import WelcomeScreen from './components/WelcomeScreen.tsx';
import AppFooter from './components/AppFooter.tsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { CookieBanner } from './components/CookieBanner.tsx';
import LevelUpToast from './components/LevelUpToast.tsx';
import HeaderToolbar from './components/header/HeaderToolbar.tsx';
import MobileSettingsMenu from './components/header/MobileSettingsMenu.tsx';
import AccountSettingsModal from './components/account/AccountSettingsModal.tsx';
import EmailChangeLinkScreen from './components/account/EmailChangeLinkScreen.tsx';
import DeleteAccountConfirmScreen from './components/account/DeleteAccountConfirmScreen.tsx';
import { readEmailChangeTokenFromUrl } from './utils/emailChangeLink.ts';
import { readAccountDeletionTokenFromUrl } from './utils/accountDeletionLink.ts';
import { defaultTierFor, modeForDirection, type HexBinDirection } from './constants/gameModes.ts';
import type { GameAnswerResponse } from './services/api.ts';

export type ActiveApp = 'hex' | 'unicode' | 'leaderboard';
/**
 * UI directions are a display concern; the backend only ever sees the mapped
 * mode. Re-exported so `Sidebar` and the trainer share one definition.
 */
export type HexBinMode = HexBinDirection;

/**
 * Main App Component (authenticated or guest).
 *
 * Only rendered for a logged-in user or a guest. Guests get the same UI,
 * but their answers are counted in memory instead of being sent to the backend.
 */
function AuthenticatedApp(): ReactElement {
    const { user, isGuest, refreshUser, applyGameResult, recordGuestAnswer, dismissLevelUp, pendingUnlocks, logout } = useAuth();
    const [activeApp, setActiveApp] = useState<ActiveApp>('hex');
    const [activeMode, setActiveMode] = useState<HexBinMode>('HexToBin');
    const [refreshKey, setRefreshKey] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
    // US-46: open on the first tier this profile owns. A hardcoded 8 sent every
    // level-1 player's first answer into the server's unlock gate (403). The mode
    // is derived from `activeMode` exactly like `HexBinTrainer` does, so the two
    // call sites can never drift apart (review DRY point).
    const [bits, setBits] = useState(() =>
        defaultTierFor(modeForDirection(activeMode), user?.level ?? null)
    );
    const [bytes, setBytes] = useState(1);
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth < 1024 : false
    );

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogout = async (): Promise<void> => {
        await logout();
    };

    const updateUserData = (): void => {
        void refreshUser();
        setRefreshKey(prev => prev + 1);
    };

    /**
     * The /answer payload already carries the new economy — no second round-trip.
     *
     * US-44 review: intentionally does NOT bump `refreshKey`. The own row moves
     * from the session overlay in the render (see `mergeOwnEntry`), so re-fetching
     * the board here would fire exactly the request the story set out to avoid and
     * restart the stagger animation on every answer. The 30 s poll stays the only
     * source for foreign rows.
     */
    const handleGameResult = (result: GameAnswerResponse): void => {
        applyGameResult(result);
    };

    if (!user && !isGuest) {
        return (
            <div className="flex items-center justify-center h-screen bg-surface">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
        );
    }

    const isLeaderboardActive = activeApp === 'leaderboard';

    return (
        <div className="flex flex-col h-screen bg-surface text-on-surface-dim overflow-hidden font-sans">
            {/* Skip link for keyboard navigation */}
            <a href="#main-content" className="skip-link">
                Skip to main content
            </a>

            {/* Global mobile header — visible below lg */}
            <header className="lg:hidden flex items-center h-14 px-4 border-b border-outline-faint bg-surface shrink-0 z-50">
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="w-11 h-11 flex items-center justify-center rounded-lg text-on-surface-faint hover:text-on-surface-dim transition-colors"
                    aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={isMobileMenuOpen}
                    aria-controls="sidebar-navigation"
                >
                    {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
                <TerminalIcon size={18} className="text-accent ml-2" aria-hidden="true" />
                <span className="ml-2 text-base font-bold tracking-wider text-on-surface-dim uppercase">
                    IT Trainer
                </span>
                <MobileSettingsMenu
                    onLogout={handleLogout}
                    onOpenAccountSettings={() => setIsAccountSettingsOpen(true)}
                />
            </header>

            {/* Middle row: fills remaining height, sidebar (lg:static) + trainer/leaderboard */}
            <div className="flex flex-1 lg:flex-row min-w-0 min-h-0 overflow-hidden">
                <Sidebar
                    activeApp={activeApp}
                    setActiveApp={setActiveApp}
                    isMobileMenuOpen={isMobileMenuOpen}
                    setIsMobileMenuOpen={setIsMobileMenuOpen}
                    hideLeaderboardNav={!isMobile && !isLeaderboardActive}
                    isMobile={isMobile}
                    activeHexMode={activeMode}
                    onHexModeChange={(mode: HexBinMode) => setActiveMode(mode)}
                    bits={bits}
                    onBitsChange={setBits}
                    bytes={bytes}
                    onBytesChange={setBytes}
                />

                {/* Trainer area — hidden when leaderboard is active on large viewports */}
                {!isLeaderboardActive && (
                    <main id="main-content" className="flex-1 overflow-y-auto border-r border-outline-faint" role="main">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeApp}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="h-full"
                            >
                                {activeApp === 'hex' ? (
                                    <HexBinTrainer
                                        onUpdate={updateUserData}
                                        onGameResult={handleGameResult}
                                        onGuestAnswer={isGuest ? recordGuestAnswer : undefined}
                                        activeMode={activeMode}
                                        bits={bits}
                                        onBitsChange={setBits}
                                        playerLevel={user?.level}
                                    />
                                ) : (
                                    <UnicodeTrainer
                                        onUpdate={updateUserData}
                                        onGameResult={handleGameResult}
                                        onGuestAnswer={isGuest ? recordGuestAnswer : undefined}
                                        bytes={bytes}
                                        onBytesChange={setBytes}
                                        playerLevel={user?.level}
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </main>
                )}

                {/* Right column — settings toolbar on top (lg+), leaderboard below.
                    Always visible on lg+, full-width when the leaderboard is active. */}
                <aside className={`shrink-0 flex flex-col overflow-hidden ${
                    isLeaderboardActive ? 'flex-1' : 'hidden lg:flex w-80'
                }`}>
                    <HeaderToolbar
                        onLogout={handleLogout}
                        onOpenAccountSettings={() => setIsAccountSettingsOpen(true)}
                    />
                    <div className="flex-1 min-h-0 overflow-y-auto">
                        <Leaderboard refreshTrigger={refreshKey} />
                    </div>
                </aside>
            </div>

            <AppFooter />

            {/* Account settings float above everything; owned here so closing a
                dropdown (outside click) can never tear the dialog down. */}
            {isAccountSettingsOpen && (
                <AccountSettingsModal onClose={() => setIsAccountSettingsOpen(false)} />
            )}

            {/* US-45: the unlock feedback used to hang inside the HUD bar. The
                bar is gone, so the toast is App's own overlay now — `fixed`
                keeps it above the layout it no longer depends on. */}
            {user !== null && pendingUnlocks.length > 0 && (
                <LevelUpToast level={user.level} unlocks={pendingUnlocks} onDismiss={dismissLevelUp} />
            )}
        </div>
    );
}

/**
 * Root App Component with Auth Gate.
 *
 * Shows WelcomeScreen for unauthenticated users,
 * AuthenticatedApp for authenticated users and guests.
 */
export default function App(): ReactElement {
    return (
        <AuthProvider>
            <AuthGate />
        </AuthProvider>
    );
}

/**
 * Auth Gate: Switches between WelcomeScreen and AuthenticatedApp.
 *
 * Renders the CookieBanner on every auth state — the banner must be visible
 * before login too.
 */
function AuthGate(): ReactElement {
    const { user, isGuest, loading } = useAuth();
    // Read once on first render: the link screen cleans the token out of the URL
    // right away, so later renders must not look at the URL again.
    const [emailChangeToken, setEmailChangeToken] = useState<string | null>(() => readEmailChangeTokenFromUrl());
    const [deletionToken, setDeletionToken] = useState<string | null>(() => readAccountDeletionTokenFromUrl());

    if (deletionToken !== null) {
        return (
            <>
                <DeleteAccountConfirmScreen token={deletionToken} onDone={() => setDeletionToken(null)} />
                <CookieBanner />
            </>
        );
    }

    if (emailChangeToken !== null) {
        return (
            <>
                <EmailChangeLinkScreen token={emailChangeToken} onDone={() => setEmailChangeToken(null)} />
                <CookieBanner />
            </>
        );
    }

    return (
        <>
            {loading ? (
                <div className="flex items-center justify-center h-screen bg-surface">
                    <Loader2 className="w-8 h-8 text-accent animate-spin" />
                </div>
            ) : user || isGuest ? (
                <AuthenticatedApp />
            ) : (
                <WelcomeScreen />
            )}
            <CookieBanner />
        </>
    );
}
