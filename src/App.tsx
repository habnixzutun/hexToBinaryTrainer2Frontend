import { useState, useEffect } from 'react';
import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';
import HexBinTrainer from './components/HexBinTrainer.tsx';
import UnicodeTrainer from './components/UnicodeTrainer.tsx';
import Leaderboard from './components/Leaderboard.tsx';
import WelcomeScreen from './components/WelcomeScreen.tsx';
import { api, type UserType } from './services/api.ts';

export default function App() {
    const [activeApp, setActiveApp] = useState<'hex' | 'unicode'>('hex');
    const [currentUser, setCurrentUser] = useState<UserType | null>(null);
    const [refreshKey, setRefreshKey] = useState(0); // Trigger für das Leaderboard

    // Login-Logik inkl. Backend-Abfrage
    const handleJoin = async (name: string) => {
        const userStats = await api.getUser(name);
        localStorage.setItem('trainer_name', name);
        setCurrentUser(userStats);
    };

    // Auto-Login beim Neuladen der Seite
    useEffect(() => {
        const savedName = localStorage.getItem('trainer_name');
        if (savedName) {
            handleJoin(savedName);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('trainer_name');
        setCurrentUser(null);
    };

    // Wird von den Trainern aufgerufen, wenn das Backend antwortet
    const updateUserData = (updatedUser: UserType) => {
        setCurrentUser(updatedUser);
        setRefreshKey(prev => prev + 1); // Bestenliste sofort updaten
    };

    if (!currentUser) {
        return <WelcomeScreen onJoin={handleJoin} />;
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col">
            <Header
                activeApp={activeApp}
                setActiveApp={setActiveApp}
                username={currentUser.name}
                onLogout={handleLogout}
            />

            <main className="max-w-4xl mx-auto w-full p-4 py-8 flex-grow">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {activeApp === 'hex' ? (
                        <HexBinTrainer user={currentUser} onUpdate={updateUserData} />
                    ) : (
                        <UnicodeTrainer user={currentUser} onUpdate={updateUserData} />
                    )}
                    <Leaderboard currentUser={currentUser} refreshTrigger={refreshKey} />
                </div>
            </main>

            <Footer />
        </div>
    );
}