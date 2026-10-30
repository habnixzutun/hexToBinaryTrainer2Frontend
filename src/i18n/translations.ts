import type { GameMode } from '../constants/gameModes.ts';

export type Locale = 'de' | 'en';

export const translations = {
    de: {
        // Header
        appTitle: 'IT TRAINER',
        appTitleAccent: 'TRAINER',
        navHexBin: 'HEX/BIN',
        navUnicode: 'UNICODE',
        logoutTitle: 'Ausloggen',

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
        authOpenMailClient: 'E-Mail-Programm öffnen',
        authBackToLogin: 'Zurück zur Anmeldung',

        // Auth - Verify Link (token from email)
        authLinkVerifying: 'E-Mail wird bestätigt...',
        authLinkVerifiedTitle: 'E-Mail bestätigt!',
        authLinkVerifiedSubtitle: 'Dein Konto ist freigeschaltet — du kannst dich jetzt einloggen.',
        authLinkFailedTitle: 'Bestätigung fehlgeschlagen',

        // Auth - Password Reset
        authForgotPassword: 'Passwort vergessen?',
        authForgotPasswordTitle: 'Passwort zurücksetzen',
        authForgotPasswordSubtitle: 'Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen.',
        authForgotPasswordSubmit: 'Link senden',
        authForgotPasswordSending: 'Link wird gesendet...',
        authForgotPasswordSuccess: 'Falls ein Konto mit dieser E-Mail existiert, wurde ein Zurücksetzungslink gesendet.',
        authForgotPasswordCheckEmail: 'Überprüfe deinen E-Mail-Eingang und klicke auf den Link, um dein Passwort zurückzusetzen.',
        authResetPasswordTitle: 'Neues Passwort',
        authResetPasswordSubtitle: 'Gib dein neues Passwort ein.',
        authResetPasswordSubmit: 'Passwort zurücksetzen',
        authResetPasswordResetting: 'Passwort wird zurückgesetzt...',
        authResetPasswordSuccess: 'Dein Passwort wurde erfolgreich zurückgesetzt.',
        authResetPasswordTokenMissing: 'Der Zurücksetzungslink ist ungültig oder abgelaufen. Bitte fordere einen neuen an.',
        authNewPassword: 'Neues Passwort',
        authConfirmNewPassword: 'Neues Passwort bestätigen',

        // Stats
        correct: 'Richtig',
        wrong: 'Falsch',

        // XP economy (Sprint 4 / US-38) — the only numbers the HUD owns
        hudLabel: 'Trainingsfortschritt',
        xp: 'XP',
        levelLabel: 'Stufe',
        streak: 'Serie',
        bestStreak: 'Beste Serie',
        xpProgress: (current: number, required: number) => `${current} von ${required} XP`,
        levelUpToast: (level: number) => `Stufe ${level} erreicht!`,
        lockedUntilLevel: (level: number) => `Freigeschaltet ab Stufe ${level}.`,
        rateLimited: (seconds: number) => `Zu viele Antworten hintereinander. Bitte ${seconds} Sekunden warten.`,
        dismissNotice: 'Hinweis ausblenden',
        modeNames: {
            hex_to_bin: 'Hex ↔ Bin',
            hex_to_dec: 'Hex ↔ Dec',
            bin_to_dec: 'Bin ↔ Dec',
            unicode: 'Unicode',
        },

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
        leaderboardError: 'Bestenliste konnte nicht geladen werden.',
        me: '(Du)',

        // Sidebar
        modus: 'Modus',

        // Cookie banner
        cookieBannerMessage: 'Diese App verwendet essentielle Cookies (HTTP-only), um deine Anmeldung aufrechtzuerhalten. Es werden keine Tracking- oder Marketing-Cookies eingesetzt.',
        cookieBannerAccept: 'Verstanden',

        // Guest mode
        guestModeButton: 'Als Gast testen',
        guestModeHint: 'Ohne Konto ausprobieren. Es wird nichts gespeichert und du erscheinst nicht in der Rangliste.',
        guestName: 'Gast',
        guestExitTitle: 'Gastmodus beenden',

        // Settings toolbar & account menu
        settingsTitle: 'Einstellungen',
        accountTitle: 'Konto',
        accountGuestInfo: 'Du nutzt die App als Gast. Mit einem Konto werden deine Ergebnisse gespeichert und du erscheinst in der Bestenliste.',
        accountCreate: 'Konto erstellen',
        themeLight: 'Heller Modus',
        themeDark: 'Dunkler Modus',
        languageSwitch: 'English',

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
        logoutTitle: 'Logout',

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
        authOpenMailClient: 'Open email client',
        authBackToLogin: 'Back to Login',

        // Auth - Verify Link (token from email)
        authLinkVerifying: 'Verifying your email...',
        authLinkVerifiedTitle: 'Email verified!',
        authLinkVerifiedSubtitle: 'Your account is active — you can log in now.',
        authLinkFailedTitle: 'Verification failed',

        // Auth - Password Reset
        authForgotPassword: 'Forgot password?',
        authForgotPasswordTitle: 'Reset your password',
        authForgotPasswordSubtitle: 'Enter your email and we\'ll send you a link to reset it.',
        authForgotPasswordSubmit: 'Send link',
        authForgotPasswordSending: 'Sending link...',
        authForgotPasswordSuccess: 'If an account with that email exists, a reset link has been sent.',
        authForgotPasswordCheckEmail: 'Check your inbox and click the link to reset your password.',
        authResetPasswordTitle: 'New password',
        authResetPasswordSubtitle: 'Enter your new password.',
        authResetPasswordSubmit: 'Reset password',
        authResetPasswordResetting: 'Resetting password...',
        authResetPasswordSuccess: 'Your password has been reset successfully.',
        authResetPasswordTokenMissing: 'The reset link is invalid or has expired. Please request a new one.',
        authNewPassword: 'New password',
        authConfirmNewPassword: 'Confirm new password',

        // Stats
        correct: 'Correct',
        wrong: 'Wrong',

        // XP economy (Sprint 4 / US-38) — the only numbers the HUD owns
        hudLabel: 'Training progress',
        xp: 'XP',
        levelLabel: 'Level',
        streak: 'Streak',
        bestStreak: 'Best streak',
        xpProgress: (current: number, required: number) => `${current} of ${required} XP`,
        levelUpToast: (level: number) => `Level ${level} reached!`,
        lockedUntilLevel: (level: number) => `Unlocks at level ${level}.`,
        rateLimited: (seconds: number) => `Too many answers in a row. Please wait ${seconds} seconds.`,
        dismissNotice: 'Dismiss notice',
        modeNames: {
            hex_to_bin: 'Hex ↔ Bin',
            hex_to_dec: 'Hex ↔ Dec',
            bin_to_dec: 'Bin ↔ Dec',
            unicode: 'Unicode',
        },

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
        leaderboardError: 'Leaderboard could not be loaded.',
        me: '(You)',

        // Sidebar
        modus: 'Mode',

        // Cookie banner
        cookieBannerMessage: 'This app uses essential cookies (HTTP-only) to keep you signed in. No tracking or marketing cookies are used.',
        cookieBannerAccept: 'Got it',

        // Guest mode
        guestModeButton: 'Try as guest',
        guestModeHint: 'Try it without an account. Nothing is saved and you will not appear on the leaderboard.',
        guestName: 'Guest',
        guestExitTitle: 'Leave guest mode',

        // Settings toolbar & account menu
        settingsTitle: 'Settings',
        accountTitle: 'Account',
        accountGuestInfo: 'You are using the app as a guest. With an account, your results are saved and you appear on the leaderboard.',
        accountCreate: 'Create account',
        themeLight: 'Light mode',
        themeDark: 'Dark mode',
        languageSwitch: 'Deutsch',

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
    authOpenMailClient: string;
    authBackToLogin: string;
    authLinkVerifying: string;
    authLinkVerifiedTitle: string;
    authLinkVerifiedSubtitle: string;
    authLinkFailedTitle: string;

    // Auth - Password Reset
    authForgotPassword: string;
    authForgotPasswordTitle: string;
    authForgotPasswordSubtitle: string;
    authForgotPasswordSubmit: string;
    authForgotPasswordSending: string;
    authForgotPasswordSuccess: string;
    authForgotPasswordCheckEmail: string;
    authResetPasswordTitle: string;
    authResetPasswordSubtitle: string;
    authResetPasswordSubmit: string;
    authResetPasswordResetting: string;
    authResetPasswordSuccess: string;
    authResetPasswordTokenMissing: string;
    authNewPassword: string;
    authConfirmNewPassword: string;

    // Stats
    correct: string;
    wrong: string;

    // XP economy (Sprint 4 / US-38)
    hudLabel: string;
    xp: string;
    levelLabel: string;
    streak: string;
    bestStreak: string;
    xpProgress: (current: number, required: number) => string;
    levelUpToast: (level: number) => string;
    lockedUntilLevel: (level: number) => string;
    rateLimited: (seconds: number) => string;
    dismissNotice: string;
    modeNames: Record<GameMode, string>;

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
    leaderboardError: string;
    me: string;

    // Sidebar
    modus: string;

    // Cookie banner
    cookieBannerMessage: string;
    cookieBannerAccept: string;

    // Guest mode
    guestModeButton: string;
    guestModeHint: string;
    guestName: string;
    guestExitTitle: string;

    // Settings toolbar & account menu
    settingsTitle: string;
    accountTitle: string;
    accountGuestInfo: string;
    accountCreate: string;
    themeLight: string;
    themeDark: string;
    languageSwitch: string;

    // sr-only helpers
    srAnswerFormat: (format: string) => string;
    srUtf8Binary: string;
};
