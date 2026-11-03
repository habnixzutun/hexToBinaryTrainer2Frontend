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

        // XP economy (Sprint 4 / US-38) — US-45 retired the HUD bar, so only the
        // copy the leaderboard, the sidebar and the unlock toast still use remains.
        xp: 'XP',
        levelLabel: 'Stufe',
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
        accountSettings: 'Kontoeinstellungen',
        accountClose: 'Schließen',
        accountSaving: 'Speichern…',
        accountGenericError: 'Das hat nicht geklappt. Bitte versuche es später erneut.',
        accountUsernameSection: 'Benutzername',
        accountUsernameNew: 'Neuer Benutzername',
        accountUsernameSave: 'Benutzernamen ändern',
        accountUsernameSaved: 'Benutzername geändert.',
        accountUsernameTaken: 'Dieser Benutzername ist bereits vergeben.',
        accountUsernameSame: 'Das ist bereits dein aktueller Benutzername.',
        accountUsernameHint: 'Der Benutzername kann nur alle 7 Tage geändert werden.',
        accountUsernameLockedUntil: (date: string) => `Du kannst deinen Benutzernamen erst ab dem ${date} wieder ändern.`,
        accountEmailSection: 'E-Mail-Adresse',
        accountEmailNew: 'Neue E-Mail-Adresse',
        accountEmailSave: 'Bestätigungsmail senden',
        accountEmailSent: (email: string) => `Wir haben einen Bestätigungslink an ${email} geschickt. Deine Adresse ändert sich erst, wenn du ihn öffnest.`,
        accountEmailTaken: 'Diese E-Mail-Adresse ist bereits registriert.',
        accountEmailSame: 'Das ist bereits deine aktuelle E-Mail-Adresse.',
        accountPasswordSection: 'Passwort',
        accountPasswordOld: 'Aktuelles Passwort',
        accountPasswordNew: 'Neues Passwort',
        accountPasswordNewConfirm: 'Neues Passwort bestätigen',
        accountPasswordSave: 'Passwort ändern',
        accountPasswordHint: 'Nach der Änderung wirst du auf allen Geräten abgemeldet.',
        accountPasswordWrongOld: 'Das aktuelle Passwort ist falsch.',
        accountPasswordSame: 'Das neue Passwort muss sich vom aktuellen unterscheiden.',
        accountPasswordWeak: 'Das neue Passwort erfüllt die Anforderungen nicht.',
        accountPasswordChangedNotice: 'Passwort geändert. Bitte melde dich mit dem neuen Passwort neu an.',
        accountEmailChangedSubtitle: 'Deine neue E-Mail-Adresse ist aktiv. Melde dich ab jetzt damit an.',
        accountEmailLinkInvalid: 'Der Link ist ungültig oder abgelaufen. Fordere die Änderung in den Kontoeinstellungen erneut an.',
        accountContinue: 'Weiter zur App',
        themeLight: 'Heller Modus',
        themeDark: 'Dunkler Modus',
        languageSwitch: 'English',

        // Devices (US-44–US-46)
        accountDevicesSection: 'Aktive Sitzungen',
        accountDevicesHint: 'Hier siehst du alle Geräte, auf denen du aktuell eingeloggt bist.',
        accountDevicesEmpty: 'Keine aktiven Sitzungen gefunden.',
        accountDevicesLoadError: 'Sitzungen konnten nicht geladen werden.',
        accountDevicesCurrent: 'Dieses Gerät',
        accountDevicesSignedIn: 'Angemeldet:',
        accountDevicesRevoke: 'Gerät abmelden',
        accountDevicesLogoutSelf: 'Von diesem Gerät abmelden',

        // Account Deletion (US-47–US-48)
        accountDeleteSection: 'Konto löschen',
        accountDeleteHint: 'Das Löschen deines Kontos ist unwiderruflich. Alle Daten werden dauerhaft gelöscht.',
        accountDeleteButton: 'Konto löschen…',
        accountDeleteConfirmText: 'Du erhältst eine E-Mail mit einem Bestätigungslink. Dort musst du dein Passwort eingeben. Danach werden dein Konto und alle Daten sofort gelöscht.',
        accountDeleteConfirmButton: 'Bestätigungsmail senden',
        accountDeleteCancel: 'Abbrechen',
        accountDeleteEmailSent: 'Wir haben dir eine Bestätigungs-E-Mail gesendet. Klicke auf den Link darin, um die Löschung abzuschließen.',
        accountDeleteWrongPassword: 'Das Passwort ist falsch.',
        accountDeleteLinkInvalidTitle: 'Link ungültig',
        accountDeleteLinkInvalidText: 'Der Löschungslink ist ungültig oder abgelaufen. Starte den Vorgang erneut in den Kontoeinstellungen.',
        accountDeleteConfirmTitle: 'Konto endgültig löschen',
        accountDeleteConfirmSubtitle: 'Gib dein Passwort ein, um die Löschung zu bestätigen. Dieser Schritt kann nicht rückgängig gemacht werden.',
        accountDeleteConfirmSubmit: 'Konto unwiderruflich löschen',
        accountDeleteDoneTitle: 'Konto gelöscht',
        accountDeleteDoneText: 'Dein Konto und alle zugehörigen Daten wurden dauerhaft gelöscht.',

        // Footer legal links
        footerImpressum: 'Impressum',
        footerDatenschutz: 'Datenschutzerklärung',
        footerImpressumTitle: 'Impressum',
        footerDatenschutzTitle: 'Datenschutzerklärung',
        footerClose: 'Schließen',

        // Impressum (mock)
        impressumAnbieter: 'Anbieter',
        impressumName: 'Max Mustermann',
        impressumAddress: 'Musterstraße 1, 12345 Musterstadt',
        impressumCountry: 'Deutschland',
        impressumContact: 'Kontakt',
        impressumEmail: 'kontakt@ittrainer.example',
        impressumPhone: '+49 123 456789',
        impressumDisclaimer: 'Haftungshinweis',
        impressumDisclaimerText: 'Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.',

        // Datenschutz (mock)
        datenschutzIntroTitle: 'Datenschutz auf einen Blick',
        datenschutzIntroText: 'Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen.',
        datenschutzDataCollectionTitle: 'Welche Daten erfassen wir?',
        datenschutzDataCollectionText: 'Wir erfassen ausschließlich die Daten, die für den Betrieb dieser Anwendung erforderlich sind: E-Mail-Adresse, Benutzername und Trainingsfortschritt. Es werden keine Tracking- oder Marketing-Daten erhoben.',
        datenschutzCookiesTitle: 'Cookies',
        datenschutzCookiesText: 'Diese App verwendet ausschließlich technisch notwendige HTTP-only-Cookies zur Aufrechterhaltung Ihrer Anmeldung. Es werden keine Tracking- oder Analyse-Cookies eingesetzt.',
        datenschutzRightsTitle: 'Ihre Rechte',
        datenschutzRightsText: 'Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung Ihrer personenbezogenen Daten. Wenden Sie sich hierfür an die oben genannte Kontaktadresse.',
        datenschutzContactTitle: 'Datenschutzbeauftragter',
        datenschutzContactText: 'Bei Fragen zum Datenschutz wenden Sie sich an: datenschutz@ittrainer.example',

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

        // XP economy (Sprint 4 / US-38) — US-45 retired the HUD bar, so only the
        // copy the leaderboard, the sidebar and the unlock toast still use remains.
        xp: 'XP',
        levelLabel: 'Level',
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
        accountSettings: 'Account settings',
        accountClose: 'Close',
        accountSaving: 'Saving…',
        accountGenericError: 'That did not work. Please try again later.',
        accountUsernameSection: 'Username',
        accountUsernameNew: 'New username',
        accountUsernameSave: 'Change username',
        accountUsernameSaved: 'Username changed.',
        accountUsernameTaken: 'This username is already taken.',
        accountUsernameSame: 'That is already your current username.',
        accountUsernameHint: 'The username can only be changed once every 7 days.',
        accountUsernameLockedUntil: (date: string) => `You can change your username again on ${date}.`,
        accountEmailSection: 'Email address',
        accountEmailNew: 'New email address',
        accountEmailSave: 'Send confirmation email',
        accountEmailSent: (email: string) => `We sent a confirmation link to ${email}. Your address only changes once you open it.`,
        accountEmailTaken: 'This email address is already registered.',
        accountEmailSame: 'That is already your current email address.',
        accountPasswordSection: 'Password',
        accountPasswordOld: 'Current password',
        accountPasswordNew: 'New password',
        accountPasswordNewConfirm: 'Confirm new password',
        accountPasswordSave: 'Change password',
        accountPasswordHint: 'After the change you will be signed out on all devices.',
        accountPasswordWrongOld: 'The current password is wrong.',
        accountPasswordSame: 'The new password must differ from the current one.',
        accountPasswordWeak: 'The new password does not meet the requirements.',
        accountPasswordChangedNotice: 'Password changed. Please sign in again with your new password.',
        accountEmailChangedSubtitle: 'Your new email address is active. Use it to sign in from now on.',
        accountEmailLinkInvalid: 'The link is invalid or has expired. Request the change again in your account settings.',
        accountContinue: 'Continue to the app',
        themeLight: 'Light mode',
        themeDark: 'Dark mode',
        languageSwitch: 'Deutsch',

        // Devices (US-44–US-46)
        accountDevicesSection: 'Active sessions',
        accountDevicesHint: 'These are all the devices you are currently signed in on.',
        accountDevicesEmpty: 'No active sessions found.',
        accountDevicesLoadError: 'Could not load sessions.',
        accountDevicesCurrent: 'This device',
        accountDevicesSignedIn: 'Signed in:',
        accountDevicesRevoke: 'Sign out device',
        accountDevicesLogoutSelf: 'Sign out this device',

        // Account Deletion (US-47–US-48)
        accountDeleteSection: 'Delete account',
        accountDeleteHint: 'Deleting your account is irreversible. All data will be permanently removed.',
        accountDeleteButton: 'Delete account…',
        accountDeleteConfirmText: 'You will receive an email with a confirmation link. There you must enter your password. Afterwards your account and all data will be deleted immediately.',
        accountDeleteConfirmButton: 'Send confirmation email',
        accountDeleteCancel: 'Cancel',
        accountDeleteEmailSent: 'We sent you a confirmation email. Click the link in it to complete the deletion.',
        accountDeleteWrongPassword: 'The password is incorrect.',
        accountDeleteLinkInvalidTitle: 'Link invalid',
        accountDeleteLinkInvalidText: 'The deletion link is invalid or has expired. Restart the process in your account settings.',
        accountDeleteConfirmTitle: 'Permanently delete account',
        accountDeleteConfirmSubtitle: 'Enter your password to confirm deletion. This step cannot be undone.',
        accountDeleteConfirmSubmit: 'Permanently delete account',
        accountDeleteDoneTitle: 'Account deleted',
        accountDeleteDoneText: 'Your account and all associated data have been permanently deleted.',

        // Footer legal links
        footerImpressum: 'Imprint',
        footerDatenschutz: 'Privacy Policy',
        footerImpressumTitle: 'Imprint',
        footerDatenschutzTitle: 'Privacy Policy',
        footerClose: 'Close',

        // Impressum (mock)
        impressumAnbieter: 'Provider',
        impressumName: 'Max Mustermann',
        impressumAddress: '1 Example Street, 12345 Example City',
        impressumCountry: 'Germany',
        impressumContact: 'Contact',
        impressumEmail: 'contact@ittrainer.example',
        impressumPhone: '+49 123 456789',
        impressumDisclaimer: 'Disclaimer',
        impressumDisclaimerText: 'Despite careful content control, we assume no liability for the content of external links. The operators of the linked pages are solely responsible for their content.',

        // Datenschutz (mock)
        datenschutzIntroTitle: 'Privacy at a Glance',
        datenschutzIntroText: 'The following information provides a simple overview of what happens to your personal data when you visit this website.',
        datenschutzDataCollectionTitle: 'What data do we collect?',
        datenschutzDataCollectionText: 'We only collect data that is necessary for the operation of this application: email address, username, and training progress. No tracking or marketing data is collected.',
        datenschutzCookiesTitle: 'Cookies',
        datenschutzCookiesText: 'This app exclusively uses technically necessary HTTP-only cookies to maintain your login session. No tracking or analytics cookies are used.',
        datenschutzRightsTitle: 'Your Rights',
        datenschutzRightsText: 'You have the right to access, correct, delete, and restrict the processing of your personal data. Please contact the address provided above.',
        datenschutzContactTitle: 'Data Protection Officer',
        datenschutzContactText: 'For privacy-related questions, contact us at: privacy@ittrainer.example',

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

    // XP economy (Sprint 4 / US-38) — the HUD bar is gone (US-45)
    xp: string;
    levelLabel: string;
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
    accountSettings: string;
    accountClose: string;
    accountSaving: string;
    accountGenericError: string;
    accountUsernameSection: string;
    accountUsernameNew: string;
    accountUsernameSave: string;
    accountUsernameSaved: string;
    accountUsernameTaken: string;
    accountUsernameSame: string;
    accountUsernameHint: string;
    accountUsernameLockedUntil: (date: string) => string;
    accountEmailSection: string;
    accountEmailNew: string;
    accountEmailSave: string;
    accountEmailSent: (email: string) => string;
    accountEmailTaken: string;
    accountEmailSame: string;
    accountPasswordSection: string;
    accountPasswordOld: string;
    accountPasswordNew: string;
    accountPasswordNewConfirm: string;
    accountPasswordSave: string;
    accountPasswordHint: string;
    accountPasswordWrongOld: string;
    accountPasswordSame: string;
    accountPasswordWeak: string;
    accountPasswordChangedNotice: string;
    accountEmailChangedSubtitle: string;
    accountEmailLinkInvalid: string;
    accountContinue: string;
    themeLight: string;
    themeDark: string;
    languageSwitch: string;

    // Devices (US-44–US-46)
    accountDevicesSection: string;
    accountDevicesHint: string;
    accountDevicesEmpty: string;
    accountDevicesLoadError: string;
    accountDevicesCurrent: string;
    accountDevicesSignedIn: string;
    accountDevicesRevoke: string;
    accountDevicesLogoutSelf: string;

    // Account Deletion (US-47–US-48)
    accountDeleteSection: string;
    accountDeleteHint: string;
    accountDeleteButton: string;
    accountDeleteConfirmText: string;
    accountDeleteConfirmButton: string;
    accountDeleteCancel: string;
    accountDeleteEmailSent: string;
    accountDeleteWrongPassword: string;
    accountDeleteLinkInvalidTitle: string;
    accountDeleteLinkInvalidText: string;
    accountDeleteConfirmTitle: string;
    accountDeleteConfirmSubtitle: string;
    accountDeleteConfirmSubmit: string;
    accountDeleteDoneTitle: string;
    accountDeleteDoneText: string;

    // sr-only helpers
    srAnswerFormat: (format: string) => string;
    srUtf8Binary: string;

    // Footer legal links
    footerImpressum: string;
    footerDatenschutz: string;
    footerImpressumTitle: string;
    footerDatenschutzTitle: string;
    footerClose: string;

    // Impressum (mock)
    impressumAnbieter: string;
    impressumName: string;
    impressumAddress: string;
    impressumCountry: string;
    impressumContact: string;
    impressumEmail: string;
    impressumPhone: string;
    impressumDisclaimer: string;
    impressumDisclaimerText: string;

    // Datenschutz (mock)
    datenschutzIntroTitle: string;
    datenschutzIntroText: string;
    datenschutzDataCollectionTitle: string;
    datenschutzDataCollectionText: string;
    datenschutzCookiesTitle: string;
    datenschutzCookiesText: string;
    datenschutzRightsTitle: string;
    datenschutzRightsText: string;
    datenschutzContactTitle: string;
    datenschutzContactText: string;
};
