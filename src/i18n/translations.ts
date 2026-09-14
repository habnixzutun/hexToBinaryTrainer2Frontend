export type Locale = 'de' | 'en';

export const translations = {
    de: {
        // Header
        appTitle: 'IT TRAINER',
        appTitleAccent: 'TRAINER',
        navHexBin: 'HEX/BIN',
        navUnicode: 'UNICODE',
        logoutTitle: 'Sitzung beenden',

        // WelcomeScreen
        welcomeTitle: 'IT-TRAINER',
        welcomeSubtitle: 'Gib deinen Namen ein, um dein Training zu starten und in die Bestenliste einzusteigen.',
        usernamePlaceholder: 'Dein Username...',
        startButton: "Los geht's!",

        // Stats
        correct: 'Richtig',
        wrong: 'Falsch',
        score: 'Punkte',

        // HexBinTrainer
        bits: 'Bits:',
        translateFrom: 'Übersetze',
        inputPlaceholder: (format: string) => `${format} eingeben...`,

        // UnicodeTrainer
        bytes: 'Bytes:',
        unicodeModeLabel: 'Unicode → UTF-8 Binary',
        unicodeTaskLabel: 'UTF-8 Binär-Maske bilden',
        unicodePlaceholder: 'z.B. 1110xxxx 10xxxxxx...',
        tryAgain: "Versuch's nochmal!",
        tryAgainHint: '(Tipp: Achte auf die korrekten Start-Bits je Byte)',
        utf8RulesTitle: 'UTF-8 Regeln:',

        // Leaderboard
        leaderboardTitle: 'Bestenliste',
        rank: 'Platz',
        name: 'Name',
        points: 'Punkte ✨',
        me: '(Du)',
    },
    en: {
        // Header
        appTitle: 'IT TRAINER',
        appTitleAccent: 'TRAINER',
        navHexBin: 'HEX/BIN',
        navUnicode: 'UNICODE',
        logoutTitle: 'End session',

        // WelcomeScreen
        welcomeTitle: 'IT-TRAINER',
        welcomeSubtitle: 'Enter your name to start training and join the leaderboard.',
        usernamePlaceholder: 'Your username...',
        startButton: "Let's go!",

        // Stats
        correct: 'Correct',
        wrong: 'Wrong',
        score: 'Score',

        // HexBinTrainer
        bits: 'Bits:',
        translateFrom: 'Translate',
        inputPlaceholder: (format: string) => `Enter ${format}...`,

        // UnicodeTrainer
        bytes: 'Bytes:',
        unicodeModeLabel: 'Unicode → UTF-8 Binary',
        unicodeTaskLabel: 'Form the UTF-8 binary mask',
        unicodePlaceholder: 'e.g. 1110xxxx 10xxxxxx...',
        tryAgain: 'Try again!',
        tryAgainHint: '(Hint: Check the correct start bits per byte)',
        utf8RulesTitle: 'UTF-8 Rules:',

        // Leaderboard
        leaderboardTitle: 'Leaderboard',
        rank: 'Rank',
        name: 'Name',
        points: 'Points ✨',
        me: '(You)',
    },
} as const satisfies Record<Locale, object>;

export type Translations = {
    appTitle: string;
    appTitleAccent: string;
    navHexBin: string;
    navUnicode: string;
    logoutTitle: string;
    welcomeTitle: string;
    welcomeSubtitle: string;
    usernamePlaceholder: string;
    startButton: string;
    correct: string;
    wrong: string;
    score: string;
    bits: string;
    translateFrom: string;
    inputPlaceholder: (format: string) => string;
    bytes: string;
    unicodeModeLabel: string;
    unicodeTaskLabel: string;
    unicodePlaceholder: string;
    tryAgain: string;
    tryAgainHint: string;
    utf8RulesTitle: string;
    leaderboardTitle: string;
    rank: string;
    name: string;
    points: string;
    me: string;
};
