const GITHUB_URL = 'https://github.com/habnixzutun/hexToBinaryTrainer2Frontend';

const TECH_BADGES = [
    { label: 'REACT', color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
    { label: 'VITE', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    { label: 'TS', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
] as const;

const GithubIcon = ({ size = 14 }: { size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
    >
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
);

export default function AppFooter() {
    return (
        <footer
            className="h-14 px-4 sm:px-8 border-t border-outline-faint flex items-center justify-between shrink-0"
            role="contentinfo"
        >
            <p className="text-xs text-on-surface-subtle">
                © 2026 HexToBinaryTrainer v2.0
            </p>

            <div className="flex items-center gap-3">
                <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-on-surface-subtle hover:text-on-surface-dim transition-colors"
                    aria-label="GitHub repository"
                >
                    <GithubIcon size={14} />
                    GitHub
                </a>

                {TECH_BADGES.map(({ label, color }) => (
                    <span
                        key={label}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider border ${color}`}
                    >
                        {label}
                    </span>
                ))}
            </div>
        </footer>
    );
}

