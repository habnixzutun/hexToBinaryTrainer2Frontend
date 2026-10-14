import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar.tsx';
import HexBinTrainer from './components/HexBinTrainer.tsx';
import UnicodeTrainer from './components/UnicodeTrainer.tsx';
import Leaderboard from './components/Leaderboard.tsx';
import WelcomeScreen from './components/WelcomeScreen.tsx';
import { api, type UserType } from './services/api.ts';

export type ActiveApp = 'hex' | 'unicode' | 'leaderboard';

export default function App() {
    const [activeApp, setActiveApp] = useState<ActiveApp>('hex');
    const [currentUser, setCurrentUser] = useState<UserType | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleJoin = async (name: string): Promise<void> => {
        const userStats = await api.getUser(name);
        localStorage.setItem('trainer_name', name);
        setCurrentUser(userStats);
    };

    useEffect(() => {
        const savedName = localStorage.getItem('trainer_name');
        if (savedName) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            handleJoin(savedName);
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
        <div className="flex flex-col md:flex-row h-screen bg-surface text-on-surface-dim overflow-hidden font-sans">
            {/* Skip link for keyboard navigation */}
            <a href="#main-content" className="skip-link">
                Skip to main content
            </a>

            <Sidebar
                activeApp={activeApp}
                setActiveApp={setActiveApp}
                user={currentUser}
                onLogout={handleLogout}
            />

            {/* Main content */}
            <div className="flex flex-1 min-w-0 overflow-hidden">
                {/* Trainer area — hidden when leaderboard is active on small viewports */}
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
                                    <HexBinTrainer user={currentUser} onUpdate={updateUserData} />
                                ) : (
                                    <UnicodeTrainer user={currentUser} onUpdate={updateUserData} />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </main>
                )}

                {/* Leaderboard panel — always visible on lg+, full-width when active */}
                <aside className={`shrink-0 overflow-y-auto ${
                    isLeaderboardActive ? 'flex-1' : 'hidden md:block w-80'
                }`}>
                    <Leaderboard currentUser={currentUser} refreshTrigger={refreshKey} />
                </aside>
            </div>
        </div>
    );
}
