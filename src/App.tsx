import { useState, useEffect } from 'react';
import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';
import HexBinTrainer from './components/HexBinTrainer.tsx';
import UnicodeTrainer from './components/UnicodeTrainer.tsx';
import Leaderboard from './components/Leaderboard.tsx';
import WelcomeScreen from './components/WelcomeScreen.tsx';

export default function App() {
    const [activeApp, setActiveApp] = useState<'hex' | 'unicode'>('hex');
    const [username, setUsername] = useState<string | null>(null);

    useEffect(() => {
        const savedName = localStorage.getItem('trainer_name');
        if (savedName) setUsername(savedName);
    }, []);

    const handleJoin = (name: string) => {
        localStorage.setItem('trainer_name', name);
        setUsername(name);
    };

    const handleLogout = () => {
        localStorage.removeItem('trainer_name');
        setUsername(null);
    };

    if (!username) {
        return <WelcomeScreen onJoin={handleJoin} />;
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col">
            <Header
                activeApp={activeApp}
                setActiveApp={setActiveApp}
                username={username}
                onLogout={handleLogout}
            />

            <main className="max-w-4xl mx-auto w-full p-4 py-8 flex-grow">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {activeApp === 'hex' ? (
                        <HexBinTrainer username={username} />
                    ) : (
                        <UnicodeTrainer username={username} />
                    )}
                    <Leaderboard currentUsername={username} />
                </div>
            </main>

            <Footer />
        </div>
    );
}