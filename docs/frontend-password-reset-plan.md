# Frontend Password-Reset-UI — Plan

> Stand: 2026-10-26 · Paralleler Frontend-Stream zum Backend Auth-Härtung Sprint
> Ziel: **Password-vergessen-Flow** als vollständige UI-Implementierung
> Dependency: Backend-Endpoints `POST /api/auth/request-password-reset` + `POST /api/auth/reset-password` (bereits implementiert)

## Kontext

Das Frontend (React 19 + TypeScript + Vite) hat aktuell:
- ✅ Auth-System mit Login/Register/Verify (state-driven, kein Router)
- ✅ `AuthContext` mit `login`, `register`, `logout`, `refreshUser`
- ✅ API-Service (`src/services/authApi.ts`) für Auth-Calls
- ✅ Passwort-Validierung bereits in `RegisterForm` (Zod-Schema)
- ✅ Tailwind CSS + shadcn/ui-Komponenten
- ❌ **Password-Reset-UI fehlt komplett** (US-08b im Backend-Plan)

**Architektur-Constraint**: Das Projekt nutzt **state-basiertes Routing** (kein react-router). Views werden über `useState<ActiveApp>` in `App.tsx` gewechselt.

## Strategie: State-basierte Views

Statt React Router zu installieren, erweitern wir das bestehende Pattern:
- `ActiveApp` um `'forgot-password' | 'reset-password'` ergänzen
- `AuthGate` in `App.tsx` rendert die neuen Views im Unauthenticated-Mode
- `WelcomeScreen` zeigt Link zu "Passwort vergessen"

**Vorteile**:
- Keine neue Dependency
- Konsistent mit bestehender Architektur
- Keine Breaking Changes
- Bundle-Size bleibt minimal

## Übersicht

| Phase | Fokus | SD | Komponenten |
|---|---|---|---|
| **1** | Forgot-Password-Form | 0,5 | `ForgotPasswordForm`, `PasswordResetRequestScreen` |
| **2** | Reset-Password-Form | 0,75 | `ResetPasswordForm`, `PasswordResetScreen` |
| **3** | Integration + UX-Polish | 0,25 | Toast-System, Loading-States, Error-Mapping |
| **Gesamt** | | **1,5 SD** | |

## Agent-RACI

| Rolle | Kurz | Verantwortung |
|---|---|---|
| 🎨 FE | frontend-dev | Implementierung UI-Komponenten |
| 🧪 QA | qa-engineer | Vitest-Tests, Integration-Tests mit MSW |
| 🔐 SEC | security-reviewer | Anti-Enumeration, Token-Handling, CSRF |
| 👁️ CR | code-reviewer | Code-Quality, TypeScript-Typsicherheit |
| 🧭 SM | scrum-master | Sprint-Cadence, Merge-Freigabe |

---

# Phase 1 — Forgot-Password-Form (½ Tag)

## Task 1.1 · API-Service erweitern

**Branch**: `feature/us-08b-fe-forgot-password`
**Komplexität**: LOW · **Dependencies**: keine · **SD**: 0,25

**Story**: Als Entwickler möchte ich die Backend-Endpoints für Password-Reset im API-Service aufrufen können.

**Akzeptanzkriterien**:
1. Neue Funktion `requestPasswordReset(email: string): Promise<void>` in `src/services/authApi.ts`
2. API-Call: `POST /api/auth/request-password-reset` mit `{ email }`
3. Fehler-Handling: Netzwerk-Fehler werfen, aber Response-Body **nicht** als Fehler behandeln (Anti-Enumeration: Backend gibt immer 200 zurück)
4. Unit-Test mit MSW (Mock Service Worker): Success-Case, Netzwerk-Fehler
5. TypeScript-Types: `RequestPasswordResetDto` exportieren
6. Coverage ≥ 80 %

**Implementation-Hinweis**:
```typescript
// src/services/authApi.ts
export async function requestPasswordReset(email: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/auth/request-password-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  // Backend gibt IMMER 200 zurück (Anti-Enumeration)
  // Nur Netzwerk-Fehler sind echte Fehler
  if (!response.ok && response.status >= 500) {
    throw new Error('Netzwerk-Fehler. Bitte später erneut versuchen.');
  }
}
```

**Agents**: 🎨 FE → 🧪 QA → 👁️ CR

---

## Task 1.2 · ForgotPasswordForm-Komponente

**Branch**: `feature/us-08b-fe-forgot-password`
**Komplexität**: LOW · **Dependencies**: Task 1.1 · **SD**: 0,25

**Story**: Als User möchte ich eine Email-Adresse eingeben und einen Reset-Link anfordern können.

**Akzeptanzkriterien**:
1. Komponente `ForgotPasswordForm` in `src/components/auth/ForgotPasswordForm.tsx`
2. Formular: Email-Input + "Reset-Link senden"-Button
3. Validierung: Email-Format (Zod: `z.string().email()`)
4. Loading-State: Button zeigt Spinner + ist disabled während API-Call
5. **Nach Submit**: **Immer** dieselbe Success-Nachricht anzeigen:
   > "Falls die Email registriert ist, wurde ein Link gesendet. Bitte prüfe dein Postfach."
6. **Keine** Fehler-Nachricht bei unbekannter Email (Anti-Enumeration)
7. Netzwerk-Fehler anzeigen: "Verbindungsfehler. Bitte später erneut versuchen."
8. Accessibility: `<label>` für Input, `aria-describedby` für Error-Message, `aria-live="polite"` für Success-Message
9. Mobile-responsive: Full-Width auf Mobile, max-w-md auf Desktop
10. Styling: Konsistent mit `LoginForm` (gleiche Input-Komponenten, Button-Styles)
11. Unit-Test: Validierung, Loading-State, Success-Message, Error-Handling
12. Coverage ≥ 80 %

**Implementation-Skizze**:
```typescript
interface ForgotPasswordFormProps {
  onBack: () => void; // Zurück zu Login
}

function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await requestPasswordReset(email);
      setIsSubmitted(true);
    } catch (err) {
      setError('Verbindungsfehler. Bitte später erneut versuchen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return <SuccessMessage message="Falls die Email registriert ist..." />;
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>Email</label>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Spinner /> : 'Reset-Link senden'}
      </button>
      {error && <p role="alert">{error}</p>}
      <button type="button" onClick={onBack}>Zurück zum Login</button>
    </form>
  );
}
```

**Agents**: 🎨 FE → 🧪 QA → 🔐 SEC → 👁️ CR

---

# Phase 2 — Reset-Password-Form (¾ Tag)

## Task 2.1 · API-Service: Reset-Password

**Branch**: `feature/us-08b-fe-reset-password`
**Komplexität**: LOW · **Dependencies**: keine · **SD**: 0,25

**Story**: Als Entwickler möchte ich das neue Passwort mit Token an das Backend senden können.

**Akzeptanzkriterien**:
1. Neue Funktion `resetPassword(token: string, newPassword: string): Promise<void>` in `src/services/authApi.ts`
2. API-Call: `POST /api/auth/reset-password` mit `{ token, new_password }`
3. Error-Handling:
   - `400 Bad Request` → Token abgelaufen/ungültig → `Error('Link ist abgelaufen. Bitte neu anfordern.')`
   - `422 Unprocessable Entity` → Passwort zu schwach → `Error('Passwort erfüllt nicht die Anforderungen.')`
   - `500 Internal Server Error` → Netzwerk-Fehler → `Error('Server-Fehler. Bitte später erneut versuchen.')`
4. Unit-Test mit MSW: Success, Token expired, Weak password, Network error
5. Coverage ≥ 80 %

**Implementation-Hinweis**:
```typescript
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password: newPassword }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message = errorData?.detail || 'Unbekannter Fehler';

    if (response.status === 400) {
      throw new Error('Link ist abgelaufen. Bitte neu anfordern.');
    }
    if (response.status === 422) {
      throw new Error(`Passwort erfüllt nicht die Anforderungen: ${message}`);
    }
    throw new Error('Server-Fehler. Bitte später erneut versuchen.');
  }
}
```

**Agents**: 🎨 FE → 🧪 QA → 👁️ CR

---

## Task 2.2 · ResetPasswordForm-Komponente

**Branch**: `feature/us-08b-fe-reset-password`
**Komplexität**: MEDIUM · **Dependencies**: Task 2.1 · **SD**: 0,5

**Story**: Als User möchte ich nach Klick auf den Email-Link ein neues Passwort eingeben können.

**Akzeptanzkriterien**:
1. Komponente `ResetPasswordForm` in `src/components/auth/ResetPasswordForm.tsx`
2. Props: `token: string` (aus URL-Query), `onSuccess: () => void`
3. Formular: "Neues Passwort" + "Passwort bestätigen" + "Speichern"-Button
4. Client-seitige Validierung (Zod-Schema):
   - Mind. 8 Zeichen
   - Mind. 1 Großbuchstabe, 1 Kleinbuchstabe, 1 Ziffer, 1 Sonderzeichen
   - Beide Felder müssen übereinstimmen
5. Loading-State: Button zeigt Spinner + ist disabled während API-Call
6. Success: Nach erfolgreichem Submit → `onSuccess()` aufrufen (navigiert zu Login mit Toast)
7. Error-Handling:
   - Token abgelaufen → "Link ist abgelaufen, bitte neu anfordern" + Button "Zurück zu Passwort vergessen"
   - Token ungültig → "Ungültiger Link" + Button "Zurück zu Passwort vergessen"
   - Passwort zu schwach → Validierungs-Fehler unter dem Input
8. **Token-Security**:
   - Token **nicht** in `console.log` oder Error-Messages ausgeben
   - Nach Submit: `history.replaceState(null, '', '/trainer')` um Token aus URL zu entfernen
   - Token nur im Memory halten (nicht in localStorage/sessionStorage)
9. Accessibility: Labels, ARIA, Keyboard-Navigation
10. Mobile-responsive
11. Unit-Test: Validierung, Success, Error-Cases, Token-Cleanup
12. Coverage ≥ 80 %

**Implementation-Skizze**:
```typescript
interface ResetPasswordFormProps {
  token: string;
  onSuccess: () => void;
}

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Mind. 8 Zeichen')
    .regex(/[A-Z]/, 'Mind. 1 Großbuchstabe')
    .regex(/[a-z]/, 'Mind. 1 Kleinbuchstabe')
    .regex(/[0-9]/, 'Mind. 1 Ziffer')
    .regex(/[^A-Za-z0-9]/, 'Mind. 1 Sonderzeichen'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
});

function ResetPasswordForm({ token, onSuccess }: ResetPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await resetPassword(token, password);
      // Token aus URL entfernen
      window.history.replaceState(null, '', '/trainer');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>Neues Passwort</label>
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
      
      <label>Passwort bestätigen</label>
      <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Spinner /> : 'Passwort speichern'}
      </button>
      
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
```

**Agents**: 🎨 FE → 🧪 QA → 🔐 SEC → 👁️ CR

---

# Phase 3 — Integration + UX-Polish (¼ Tag)

## Task 3.1 · Routing + Navigation

**Branch**: `feature/us-08b-fe-reset-password`
**Komplexität**: LOW · **Dependencies**: Task 1.2, Task 2.2 · **SD**: 0,15

**Story**: Als Entwickler möchte ich die neuen Views in die bestehende App-Struktur integrieren.

**Akzeptanzkriterien**:
1. `ActiveApp` in `App.tsx` erweitern: `'forgot-password' | 'reset-password'`
2. `AuthGate` in `App.tsx` rendert neue Views:
   - `activeApp === 'forgot-password'` → `<PasswordResetRequestScreen />`
   - `activeApp === 'reset-password'` → `<PasswordResetScreen token={token} />`
3. Token-Extraktion aus URL:
   - In `App.tsx`: `const token = new URLSearchParams(window.location.search).get('token');`
   - Wenn `token` vorhanden und `activeApp === 'reset-password'` → `ResetPasswordForm` rendern
4. `WelcomeScreen` (Login): Link "Passwort vergessen?" → `setActiveApp('forgot-password')`
5. `ForgotPasswordForm.onBack` → `setActiveApp('hex')` (zurück zu Login)
6. `ResetPasswordForm.onSuccess` → Toast anzeigen + `setActiveApp('hex')` (zurück zu Login)
7. Navigation-Helper: `navigateToResetPassword(token: string)` setzt `window.location.href = '/trainer?view=reset-password&token=${token}'`
8. Unit-Test: Token-Extraktion, Navigation
9. Coverage ≥ 80 %

**Implementation-Hinweis**:
```typescript
// App.tsx
type ActiveApp = 'hex' | 'unicode' | 'leaderboard' | 'forgot-password' | 'reset-password';

function AuthGate(): ReactElement {
  const { user, loading } = useAuth();
  const [activeApp, setActiveApp] = useState<ActiveApp>('hex');
  
  // Token aus URL extrahieren
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const view = urlParams.get('view');

  // Wenn URL ?view=reset-password&token=... enthält → Reset-View
  useEffect(() => {
    if (view === 'reset-password' && token) {
      setActiveApp('reset-password');
    }
  }, [view, token]);

  return (
    <>
      {loading ? (
        <Loader />
      ) : user ? (
        <AuthenticatedApp />
      ) : (
        <>
          {activeApp === 'forgot-password' && (
            <PasswordResetRequestScreen onBack={() => setActiveApp('hex')} />
          )}
          {activeApp === 'reset-password' && token && (
            <PasswordResetScreen 
              token={token} 
              onSuccess={() => {
                setActiveApp('hex');
                showToast('Passwort erfolgreich zurückgesetzt');
              }} 
            />
          )}
          {activeApp === 'hex' && <WelcomeScreen />}
        </>
      )}
      <CookieBanner />
    </>
  );
}
```

**Agents**: 🎨 FE → 🧪 QA → 👁️ CR

---

## Task 3.2 · Toast-System (optional, wenn nicht vorhanden)

**Branch**: `feature/us-08b-fe-reset-password`
**Komplexität**: LOW · **Dependencies**: keine · **SD**: 0,1

**Story**: Als User möchte ich eine visuelle Bestätigung nach erfolgreichem Password-Reset sehen.

**Akzeptanzkriterien**:
1. Prüfen: Gibt es bereits ein Toast-System? (z.B. `react-hot-toast`, `sonner`)
2. Wenn ja: `showToast('Passwort erfolgreich zurückgesetzt')` aufrufen
3. Wenn nein: Minimal-Implementierung mit `useState` + `AnimatePresence`:
   - `ToastContext` mit `showToast(message: string)`
   - `Toast`-Komponente: Fixed Position, Auto-Dismiss nach 5s
   - Styling: Success (grün), Error (rot)
4. Integration in `App.tsx`: `<ToastProvider><AuthGate /></ToastProvider>`
5. Unit-Test: Toast wird angezeigt, Auto-Dismiss
6. Coverage ≥ 80 %

**Agents**: 🎨 FE → 👁️ CR

---

## Task 3.3 · E2E-Test (optional)

**Branch**: `feature/us-08b-fe-reset-password`
**Komplexität**: MEDIUM · **Dependencies**: Task 3.1 · **SD**: 0,1

**Story**: Als QA-Engineer möchte ich den kompletten Password-Reset-Flow automatisiert testen.

**Akzeptanzkriterien**:
1. Playwright-Test: `test/e2e/password-reset.spec.ts`
2. Flow:
   - Login-Seite → "Passwort vergessen?" klicken
   - Email eingeben → Submit
   - Success-Message prüfen
   - Mock: Email-Link mit Token generieren
   - URL mit Token aufrufen
   - Neues Passwort eingeben → Submit
   - Redirect zu Login prüfen
   - Toast "Passwort erfolgreich zurückgesetzt" prüfen
3. Mock-Backend: MSW oder Playwright-Route
4. Test-Daten: Test-User in DB anlegen (via API oder DB-Seed)
5. Coverage: Happy Path + 1 Error-Case (Token expired)

**Agents**: 🧪 QA → 🎨 FE (Support)

---

# Security-Checklist

| Aspekt | Maßnahme |
|---|---|
| **Anti-Enumeration** | ForgotPasswordForm zeigt **immer** dieselbe Success-Message, auch bei unbekannter Email |
| **Token-Handling** | Token nur in Memory (nicht in localStorage), nach Submit aus URL entfernen (`history.replaceState`) |
| **CSRF** | Backend setzt SameSite=strict Cookie (schon implementiert) |
| **Rate-Limit-UI** | Button disablen nach Submit, Countdown anzeigen (optional: 30s) |
| **Error-Messages** | Keine Details über Account-Existenz, nur generische Fehler |
| **Input-Validierung** | Client + Server (Backend validiert auch) |
| **HTTPS** | Prod: `secure=True` für Cookies (aus US-11) |

---

# Accessibility-Checklist

| Aspekt | Maßnahme |
|---|---|
| **Labels** | Alle Inputs haben `<label>` mit `htmlFor` |
| **Error-Messages** | `role="alert"` + `aria-live="polite"` |
| **Keyboard-Navigation** | Tab-Order sinnvoll, Enter submit, Escape cancel |
| **Focus-Management** | Nach Submit: Focus auf Success-Message oder Error-Message |
| **Screen-Reader** | Success/Error-Messages mit `aria-live` |
| **Color-Contrast** | Tailwind-Defaults erfüllen WCAG AA |

---

# Testing-Strategie

## Unit-Tests (Vitest)

| Komponente | Test-Cases |
|---|---|
| `ForgotPasswordForm` | Validierung (Email-Format), Loading-State, Success-Message, Error-Handling (Netzwerk-Fehler) |
| `ResetPasswordForm` | Validierung (Passwort-Stärke, Match), Success, Token expired, Token invalid, Weak password |
| `authApi.requestPasswordReset` | Success, Netzwerk-Fehler |
| `authApi.resetPassword` | Success, Token expired, Weak password, Network error |

## Integration-Tests (Vitest + MSW)

| Flow | Test-Cases |
|---|---|
| Forgot-Password | Submit → Success-Message (auch bei unbekannter Email) |
| Reset-Password | Token aus URL extrahieren → Form rendern → Submit → Redirect |

## E2E-Tests (Playwright, optional)

| Flow | Test-Cases |
|---|---|
| Full Password-Reset | Login → Forgot → Submit → Email-Link → Reset → Login |

**Coverage-Ziel**: ≥ 80 % pro Komponente

---

# Dateien-Übersicht

## Neue Dateien

| Datei | Zweck |
|---|---|
| `src/components/auth/ForgotPasswordForm.tsx` | Email-Input + Submit |
| `src/components/auth/ResetPasswordForm.tsx` | Neues Passwort + Token |
| `src/components/auth/PasswordResetRequestScreen.tsx` | Wrapper für ForgotPasswordForm |
| `src/components/auth/PasswordResetScreen.tsx` | Wrapper für ResetPasswordForm |
| `test/components/auth/ForgotPasswordForm.test.tsx` | Unit-Tests |
| `test/components/auth/ResetPasswordForm.test.tsx` | Unit-Tests |
| `test/e2e/password-reset.spec.ts` | E2E-Test (optional) |

## Geänderte Dateien

| Datei | Änderung |
|---|---|
| `src/services/authApi.ts` | + `requestPasswordReset`, + `resetPassword` |
| `src/App.tsx` | + `ActiveApp` Types, + View-Rendering, + Token-Extraktion |
| `src/components/WelcomeScreen.tsx` | + Link "Passwort vergessen?" |

---

# Branch-Strategie

```
feature/us-08b-fe-forgot-password (Phase 1)
  └─ feature/us-08b-fe-reset-password (Phase 2 + 3)
      └─ merge → main
```

**Commit-Message**:
```
feat: add password reset UI flow

- ForgotPasswordForm: Email input + anti-enumeration
- ResetPasswordForm: New password + token validation
- Integration in App.tsx (state-based routing)
- API service: requestPasswordReset, resetPassword
- Security: Token cleanup, generic error messages
- Accessibility: Labels, ARIA, keyboard navigation
- Tests: Unit + Integration (MSW)

— US-08b
```

---

# Risiko-Buffer

| Risiko | Mitigation |
|---|---|
| Kein Toast-System vorhanden | Task 3.2: Minimal-Implementierung oder Library (z.B. `sonner`) |
| Token in URL-History sichtbar | `history.replaceState` nach Submit |
| Anti-Enumeration schwer testbar | Integration-Test mit MSW: 2× gleiche Email → gleiche Response |
| Backend-Endpoint noch nicht deployed | Mock-Server für Frontend-Entwicklung |

---

# Nächster Schritt

**Phase 1 anstoßen**: 🎨 FE + 🧪 QA parallel spawnen
- 🎨 FE implementiert `ForgotPasswordForm` + API-Service
- 🧪 QA schreibt Unit-Tests (RED)
- 🔐 SEC reviewt Anti-Enumeration
- 👁️ CR reviewt Code-Quality
