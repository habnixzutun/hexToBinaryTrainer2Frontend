export type Locale = 'de' | 'en';

export const translations = {
    de: {
        // Header
        appTitle: 'IT TRAINER',
        appTitleAccent: 'TRAINER',
        navHexBin: 'HEX/BIN',
        navUnicode: 'UNICODE',
        logoutTitle: 'Sitzung beenden',

        // WelcomeScreen (Legacy - kept for compatibility)
        welcomeTitle: 'IT-TRAINER',
        welcomeSubtitle: 'Gib deinen Namen ein, um dein Training zu starten und in die Bestenliste einzusteigen.',
        usernamePlaceholder: 'Dein Username...',
        startButton: "Los geht's!",
        usernameValidationError: 'Mindestens 2 Zeichen erforderlich',
        srUsername: 'Benutzername',

        // Auth - WelcomeScreen
        authWelcomeBack: 'Willkommen zurück',
        authCreateAccount: 'Konto erstellen',
        authVerifyEmail: 'E-Mail bestätigen',
        authLoginSubtitle: 'Melde dich an, um dein Training fortzusetzen',
        authRegisterSubtitle: 'Registriere dich, um dein Training zu starten',
        authVerifySubtitle: 'Wir haben dir einen Bestätigungslink gesendet',

        // Auth - Login Form
        authEmail: 'E-Mail',
        authPassword: 'Passwort',
        authLogin: 'Anmelden',
        authLoggingIn: 'Melde an...',
        authNoAccount: 'Noch kein Konto?',
        authRegister: 'Registrieren',
        authEmailRequired: 'E-Mail ist erforderlich',
        authEmailInvalid: 'Ungültige E-Mail-Adresse',
        authPasswordRequired: 'Passwort ist erforderlich',
        authShowPassword: 'Passwort anzeigen',
        authHidePassword: 'Passwort verbergen',

        // Auth - Register Form
        authUsername: 'Benutzername',
        authConfirmPassword: 'Passwort bestätigen',
        authRegisterButton: 'Konto erstellen',
        authRegistering: 'Konto wird erstellt...',
        authHasAccount: 'Bereits ein Konto?',
        authLoginLink: 'Anmelden',
        authUsernameRequired: 'Benutzername ist erforderlich',
        authUsernameMin: 'Benutzername muss mindestens 3 Zeichen lang sein',
        authUsernameMax: 'Benutzername darf maximal 50 Zeichen lang sein',
        authUsernameInvalid: 'Benutzername darf nur Buchstaben, Zahlen, Unterstriche und Bindestriche enthalten',
        authPasswordMin: 'Passwort muss mindestens 8 Zeichen lang sein',
        authPasswordMax: 'Passwort darf maximal 128 Zeichen lang sein',
        authPasswordUppercase: 'Passwort muss mindestens einen Großbuchstaben enthalten',
        authPasswordLowercase: 'Passwort muss mindestens einen Kleinbuchstaben enthalten',
        authPasswordDigit: 'Passwort muss mindestens eine Zahl enthalten',
        authPasswordSpecial: 'Passwort muss mindestens ein Sonderzeichen enthalten',
        authPasswordsDontMatch: 'Passwörter stimmen nicht überein',

        // Auth - Password Requirements
        authPasswordReqLength: 'Mindestens 8 Zeichen',
        authPasswordReqUppercase: 'Ein Großbuchstabe',
        authPasswordReqLowercase: 'Ein Kleinbuchstabe',
        authPasswordReqDigit: 'Eine Zahl',
        authPasswordReqSpecial: 'Ein Sonderzeichen',

        // Auth - Verify Email Screen
        authCheckEmail: 'E-Mail überprüfen',
        authVerificationSent: 'Wir haben einen Bestätigungslink gesendet an',
        authNextSteps: 'Nächste Schritte:',
        authStep1: 'Überprüfe deinen E-Mail-Eingang',
        authStep2: 'Klicke auf den Bestätigungslink in der E-Mail',
        authStep3: 'Kehre hierher zurück und melde dich mit deinen Zugangsdaten an',
        authCheckSpam: 'E-Mail nicht erhalten? Überprüfe deinen Spam-Ordner.',
        authBackToLogin: 'Zurück zur Anmeldung',

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

        // WelcomeScreen (Legacy - kept for compatibility)
        welcomeTitle: 'IT-TRAINER',
        welcomeSubtitle: 'Enter your name to start training and join the leaderboard.',
        usernamePlaceholder: 'Your username...',
        startButton: "Let's go!",
        usernameValidationError: 'Minimum 2 characters required',
        srUsername: 'Username',

        // Auth - WelcomeScreen
        authWelcomeBack: 'Welcome back',
        authCreateAccount: 'Create an account',
        authVerifyEmail: 'Verify your email',
        authLoginSubtitle: 'Login to continue your training journey',
        authRegisterSubtitle: 'Register to start your training journey',
        authVerifySubtitle: 'We sent you a verification link',

        // Auth - Login Form
        authEmail: 'Email',
        authPassword: 'Password',
        authLogin: 'Login',
        authLoggingIn: 'Logging in...',
        authNoAccount: "Don't have an account?",
        authRegister: 'Register',
        authEmailRequired: 'Email is required',
        authEmailInvalid: 'Invalid email address',
        authPasswordRequired: 'Password is required',
        authShowPassword: 'Show password',
        authHidePassword: 'Hide password',

        // Auth - Register Form
        authUsername: 'Username',
        authConfirmPassword: 'Confirm Password',
        authRegisterButton: 'Register',
        authRegistering: 'Creating account...',
        authHasAccount: 'Already have an account?',
        authLoginLink: 'Login',
        authUsernameRequired: 'Username is required',
        authUsernameMin: 'Username must be at least 3 characters',
        authUsernameMax: 'Username must be at most 50 characters',
        authUsernameInvalid: 'Username can only contain letters, numbers, underscores, and hyphens',
        authPasswordMin: 'Password must be at least 8 characters',
        authPasswordMax: 'Password must be at most 128 characters',
        authPasswordUppercase: 'Password must contain at least one uppercase letter',
        authPasswordLowercase: 'Password must contain at least one lowercase letter',
        authPasswordDigit: 'Password must contain at least one digit',
        authPasswordSpecial: 'Password must contain at least one special character',
        authPasswordsDontMatch: "Passwords don't match",

        // Auth - Password Requirements
        authPasswordReqLength: 'At least 8 characters',
        authPasswordReqUppercase: 'One uppercase letter',
        authPasswordReqLowercase: 'One lowercase letter',
        authPasswordReqDigit: 'One digit',
        authPasswordReqSpecial: 'One special character',

        // Auth - Verify Email Screen
        authCheckEmail: 'Check your email',
        authVerificationSent: "We've sent a verification link to",
        authNextSteps: 'Next steps:',
        authStep1: 'Check your email inbox',
        authStep2: 'Click the verification link in the email',
        authStep3: 'Return here and login with your credentials',
        authCheckSpam: "Didn't receive the email? Check your spam folder.",
        authBackToLogin: 'Back to Login',

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
    // Header
    appTitle: string;
    appTitleAccent: string;
    navHexBin: string;
    navUnicode: string;
    logoutTitle: string;

    // WelcomeScreen (Legacy)
    welcomeTitle: string;
    welcomeSubtitle: string;
    usernamePlaceholder: string;
    startButton: string;
    usernameValidationError: string;
    srUsername: string;

    // Auth - WelcomeScreen
    authWelcomeBack: string;
    authCreateAccount: string;
    authVerifyEmail: string;
    authLoginSubtitle: string;
    authRegisterSubtitle: string;
    authVerifySubtitle: string;

    // Auth - Login Form
    authEmail: string;
    authPassword: string;
    authLogin: string;
    authLoggingIn: string;
    authNoAccount: string;
    authRegister: string;
    authEmailRequired: string;
    authEmailInvalid: string;
    authPasswordRequired: string;
    authShowPassword: string;
    authHidePassword: string;

    // Auth - Register Form
    authUsername: string;
    authConfirmPassword: string;
    authRegisterButton: string;
    authRegistering: string;
    authHasAccount: string;
    authLoginLink: string;
    authUsernameRequired: string;
    authUsernameMin: string;
    authUsernameMax: string;
    authUsernameInvalid: string;
    authPasswordMin: string;
    authPasswordMax: string;
    authPasswordUppercase: string;
    authPasswordLowercase: string;
    authPasswordDigit: string;
    authPasswordSpecial: string;
    authPasswordsDontMatch: string;

    // Auth - Password Requirements
    authPasswordReqLength: string;
    authPasswordReqUppercase: string;
    authPasswordReqLowercase: string;
    authPasswordReqDigit: string;
    authPasswordReqSpecial: string;

    // Auth - Verify Email Screen
    authCheckEmail: string;
    authVerificationSent: string;
    authNextSteps: string;
    authStep1: string;
    authStep2: string;
    authStep3: string;
    authCheckSpam: string;
    authBackToLogin: string;

    // Stats
    correct: string;
    wrong: string;
    score: string;

    // HexBinTrainer
    bits: string;
    translateFrom: string;
    inputPlaceholder: (format: string) => string;
    correctAnswer: string;
    errorSaving: string;
    check: string;

    // Mode labels
    modeHexToBin: string;
    modeHexToDec: string;
    modeBinToHex: string;
    modeBinToDec: string;
    modeDecToHex: string;
    modeDecToBin: string;
    hexBinModes: string;

    // UnicodeTrainer
    bytes: string;
    byte: string;
    unicodeModeLabel: string;
    unicodeTaskLabel: string;
    unicodePlaceholder: string;
    tryAgain: string;
    tryAgainHint: string;
    utf8RulesTitle: string;

    // Leaderboard
    leaderboardTitle: string;
    rank: string;
    name: string;
    points: string;
    me: string;

    // Sidebar
    modus: string;

    // sr-only helpers
    srAnswerFormat: (format: string) => string;
    srUtf8Binary: string;
};
