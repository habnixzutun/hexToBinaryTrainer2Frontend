import { useState, useEffect, type ReactElement } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Terminal, Menu, X, Loader2 } from 'lucide-react';
import Sidebar from './components/Sidebar.tsx';
import HexBinTrainer from './components/HexBinTrainer.tsx';
import UnicodeTrainer from './components/UnicodeTrainer.tsx';
import Leaderboard from './components/Leaderboard.tsx';
import WelcomeScreen from './components/WelcomeScreen.tsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';

export type ActiveApp = 'hex' | 'unicode' | 'leaderboard';
export type HexBinMode = 'HexToBin' | 'HexToDec' | 'BinToHex' | 'BinToDec' | 'DecToHex' | 'DecToBin';

/**
 * Main App Component (authenticated).
 *
 * Only rendered when user is authenticated.
 */
function AuthenticatedApp(): ReactElement {
    const { user, refreshUser, logout } = useAuth();
    const [activeApp, setActiveApp] = useState<ActiveApp>('hex');
    const [activeMode, setActiveMode] = useState<HexBinMode>('HexToBin');
    const [refreshKey, setRefreshKey] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [bits, setBits] = useState(8);
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

    if (!user) {
        return (
            <div className="flex items-center justify-center h-screen bg-surface">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
        );
    }

    const isLeaderboardActive = activeApp === 'leaderboard';

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-surface text-on-surface-dim overflow-hidden font-sans">
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
                <Terminal strokeWidth={1.5} size={18} className="text-accent ml-2" aria-hidden="true" />
                <span className="ml-2 text-base font-bold tracking-wider text-on-surface-dim uppercase">
                    IT Trainer
                </span>
            </header>

            <Sidebar
                activeApp={activeApp}
                setActiveApp={setActiveApp}
                onLogout={handleLogout}
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

            {/* Main content */}
            <div className="flex flex-1 min-w-0 overflow-hidden">
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
                                        activeMode={activeMode}
                                        bits={bits}
                                        onBitsChange={setBits}
                                    />
                                ) : (
                                    <UnicodeTrainer
                                        onUpdate={updateUserData}
                                        bytes={bytes}
                                        onBytesChange={setBytes}
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </main>
                )}

                {/* Leaderboard panel — always visible on lg+, full-width when active */}
                <aside className={`shrink-0 overflow-y-auto ${
                    isLeaderboardActive ? 'flex-1' : 'hidden lg:block w-80'
                }`}>
                    <Leaderboard refreshTrigger={refreshKey} />
                </aside>
            </div>
        </div>
    );
}

/**
 * Root App Component with Auth Gate.
 *
 * Shows WelcomeScreen for unauthenticated users,
 * AuthenticatedApp for authenticated users.
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
 */
function AuthGate(): ReactElement {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-surface">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <WelcomeScreen />;
    }

    return <AuthenticatedApp />;
}
