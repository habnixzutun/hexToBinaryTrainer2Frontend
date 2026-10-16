import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Terminal, Menu, X } from 'lucide-react';
import Sidebar from './components/Sidebar.tsx';
import HexBinTrainer from './components/HexBinTrainer.tsx';
import UnicodeTrainer from './components/UnicodeTrainer.tsx';
import Leaderboard from './components/Leaderboard.tsx';
import WelcomeScreen from './components/WelcomeScreen.tsx';
import { api, type UserType } from './services/api.ts';

export type ActiveApp = 'hex' | 'unicode' | 'leaderboard';
export type HexBinMode = 'HexToBin' | 'HexToDec' | 'BinToHex' | 'BinToDec' | 'DecToHex' | 'DecToBin';

export default function App() {
    const [activeApp, setActiveApp] = useState<ActiveApp>('hex');
    const [activeMode, setActiveMode] = useState<HexBinMode>('HexToBin');
    const [currentUser, setCurrentUser] = useState<UserType | null>(null);
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

    const handleJoin = async (name: string): Promise<void> => {
        try {
            const userStats = await api.getUser(name);
            localStorage.setItem('trainer_name', name);
            setCurrentUser(userStats);
        } catch {
            // API unavailable — create offline user
            localStorage.setItem('trainer_name', name);
            setCurrentUser({ name, correct: 0, incorrect: 0, points: 0 });
        }
    };

    useEffect(() => {
        const savedName = localStorage.getItem('trainer_name');
        if (savedName) {
            // Load user data asynchronously — don't block initial render
            void handleJoin(savedName);
        }
    }, []);

    const handleLogout = (): void => {
        localStorage.removeItem('trainer_name');
        setCurrentUser(null);
    };

    const updateUserData = (updatedUser: UserType): void => {
        setCurrentUser(updatedUser);
        setRefreshKey(prev => prev + 1);
    };

    if (!currentUser) {
        return <WelcomeScreen onJoin={handleJoin} />;
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
                user={currentUser}
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
                                        user={currentUser}
                                        onUpdate={updateUserData}
                                        activeMode={activeMode}
                                        bits={bits}
                                        onBitsChange={setBits}
                                    />
                                ) : (
                                    <UnicodeTrainer
                                        user={currentUser}
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
                    <Leaderboard currentUser={currentUser} refreshTrigger={refreshKey} />
                </aside>
            </div>
        </div>
    );
}
