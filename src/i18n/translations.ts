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
        usernameValidationError: 'Mindestens 2 Zeichen erforderlich',
        srUsername: 'Benutzername',

        // Stats
        correct: 'Richtig',
        wrong: 'Falsch',
        score: 'Punkte',

        // HexBinTrainer
        bits: 'Bits',
        translateFrom: 'Übersetze',
        inputPlaceholder: (format: string) => `${format} eingeben...`,
        correctAnswer: 'Richtig!',
        errorSaving: 'Fehler beim Speichern. Bitte nochmal versuchen.',
        check: 'Prüfen',

        // Mode labels
        modeHexToBin: 'Hex → Bin',
        modeHexToDec: 'Hex → Dec',
        modeBinToHex: 'Bin → Hex',
        modeBinToDec: 'Bin → Dec',
        modeDecToHex: 'Dec → Hex',
        modeDecToBin: 'Dec → Bin',
        hexBinModes: 'Hex/Bin Modi',

        // UnicodeTrainer
        bytes: 'Bytes',
        byte: 'Byte',
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

        // Sidebar
        modus: 'Modus',

        // sr-only helpers
        srAnswerFormat: (format: string) => `Gib deine Antwort im ${format}-Format ein`,
        srUtf8Binary: 'Gib die UTF-8 Binärdarstellung mit 0en und 1en ein',
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
        usernameValidationError: 'Minimum 2 characters required',
        srUsername: 'Username',

        // Stats
        correct: 'Correct',
        wrong: 'Wrong',
        score: 'Score',

        // HexBinTrainer
        bits: 'Bits',
        translateFrom: 'Translate',
        inputPlaceholder: (format: string) => `Enter ${format}...`,
        correctAnswer: 'Correct!',
        errorSaving: 'Error saving result. Please try again.',
        check: 'Check',

        // Mode labels
        modeHexToBin: 'Hex → Bin',
        modeHexToDec: 'Hex → Dec',
        modeBinToHex: 'Bin → Hex',
        modeBinToDec: 'Bin → Dec',
        modeDecToHex: 'Dec → Hex',
        modeDecToBin: 'Dec → Bin',
        hexBinModes: 'Hex/Bin Modes',

        // UnicodeTrainer
        bytes: 'Bytes',
        byte: 'Byte',
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

        // Sidebar
        modus: 'Mode',

        // sr-only helpers
        srAnswerFormat: (format: string) => `Enter your answer in ${format} format`,
        srUtf8Binary: 'Enter the UTF-8 binary representation using 0s and 1s',
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
    usernameValidationError: string;
    srUsername: string;
    correct: string;
    wrong: string;
    score: string;
    bits: string;
    translateFrom: string;
    inputPlaceholder: (format: string) => string;
    correctAnswer: string;
    errorSaving: string;
    check: string;
    modeHexToBin: string;
    modeHexToDec: string;
    modeBinToHex: string;
    modeBinToDec: string;
    modeDecToHex: string;
    modeDecToBin: string;
    hexBinModes: string;
    bytes: string;
    byte: string;
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
    modus: string;
    srAnswerFormat: (format: string) => string;
    srUtf8Binary: string;
};
