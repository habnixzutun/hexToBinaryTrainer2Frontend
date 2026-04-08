interface HeaderProps {
    activeApp: 'hex' | 'unicode';
    setActiveApp: (app: 'hex' | 'unicode') => void;
    username: string;
    onLogout: () => void;
}

export default function Header({ activeApp, setActiveApp, username, onLogout }: HeaderProps) {
    return (
        <nav className="bg-slate-800/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-700 shadow-xl">
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">

                {/* Logo & User Info */}
                <div className="flex flex-col">
                    <h1 className="text-xl font-black bg-gradient-to-r from-indigo-400 to-indigo-400 bg-clip-text text-transparent tracking-tight">
                        IT <span className="text-white/20">TRAINER</span>
                    </h1>
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              {username}
            </span>
                    </div>
                </div>

                {/* Navigation Switch */}
                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-950/50 p-1 rounded-xl border border-slate-700/50">
                        <button
                            onClick={() => setActiveApp('hex')}
                            className={`px-4 py-1.5 rounded-lg font-bold transition-all text-xs ${
                                activeApp === 'hex'
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-blue-900/40'
                                    : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            HEX/BIN
                        </button>
                        <button
                            onClick={() => setActiveApp('unicode')}
                            className={`px-4 py-1.5 rounded-lg font-bold transition-all text-xs ${
                                activeApp === 'unicode'
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                                    : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            UNICODE
                        </button>
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={onLogout}
                        className="group flex items-center justify-center w-9 h-9 rounded-xl bg-slate-700/50 border border-slate-600 hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-300"
                        title="Sitzung beenden"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-slate-400 group-hover:text-red-400 transition-colors"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </div>
        </nav>
    );
}