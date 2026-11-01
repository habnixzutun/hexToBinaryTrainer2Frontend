# React + Vite

This template provides a minimal setup to get React working in Vite with HFR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/plugin-react/blob/main/packages/plugin-react) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

---

## Hex To Binary Trainer

### Changelog

**Sprint 5 · US-43 — Bestenliste auf vier Felder reduziert** (`feature/us-43-leaderboard-frontend`)

*Changed*
- `LeaderboardEntry` in `src/services/api.ts` ist jetzt exakt
  `{user_id, username, total_xp, level}` — passend zu `LeaderboardEntryV2` des Backends
  (PR habnixzutun/hexToBinaryTrainer2Backend#48). Die Schalter `correct_count` und
  `incorrect_count` sind vom Wire-Contract verschwunden: das sind Profilkennzahlen
  (`GET /api/user/me`), keine Bestenlisten-Daten, und die Rangliste sortiert allein nach XP.
- `src/components/Leaderboard.tsx` rendert damit drei Datenspalten (**Name · Stufe · XP**)
  hinter dem Rang-Spacer; die ✓-/✗-Spalten samt zugehörigem Spaltenkopf sind entfallen.
- Das „(Du)"-Badge hängt nun an `entry.user_id === user?.id` statt am Anzeigenamen.
  Vorher galt ein Eintrag als „einer selbst", wenn der Name glich — ein Namenswechsler
  verlor sein Badge, und ein gleichnamiger Anderer bekam es.
- Der „ewige Nummer eins"-Hinweis für `Max` bleibt bewusst namebasiert: er ist Hauslore,
  kein Identitätsnachweis, und `username` ist weiterhin Teil des Payloads.

*Tests*
- `test/components/Leaderboard.test.tsx` hält die Vier-Felder-Form als Compile-Time-Vertrag
  fest (`keyof LeaderboardEntry` muss exakt die vier Namen sein), pinnt die drei Spalten,
  das Ausbleiben von ✓/✗, die Badge-Zuordnung per `user_id` (inkl. Gegenprobe: gleicher
  Name + fremde ID ⇒ kein Badge) und den Gast-Fall.
- `test/services/api.test.ts` prüft den unversehrten Durchgriff eines Vier-Felder-Payloads;
  die Fixtures in `test/App.test.tsx` / `test/App.gameHud.test.tsx` wurden mitgezogen.
- Kein Screenshot: die README führt die Changelog-Einträge textuell, und die Bestenliste
  braucht Live-Daten vom noch nicht gemergten Backend-PR.

**Sprint 5 · US-45 — HUD entfernt, LevelUpToast in `App` umgesiedelt** (`feature/us-45-remove-gamehud`)

*Removed*
- `src/components/GameHud.tsx` und `test/components/GameHud.test.tsx` gelöscht. Aus `src/`
  ist `GameHud` damit vollständig entfernt; die einzigen verbleibenden Nennungen stehen in
  `test/App.gameHud.test.tsx`, das genau die **Abwesenheit** der Leiste pinnt (Region,
  Fortschrittsbalken, Serien-Zeilen). Die Leiste ganz oben (XP-Fortschritt, Serie, beste
  Serie) ist weg — die persönlichen Zahlen stehen bereits unten links in der Sidebar.
- Tote i18n-Keys in beiden Locales: `hudLabel`, `xpProgress`, `streak`, `bestStreak`.
- Toter Context-State: `lastAnswer` aus `AuthContextType` (Consumer ist weg).

*Changed*
- `LevelUpToast` wird jetzt direkt von `App` (`AuthenticatedApp`) als Overlay
  gerendert, gespeist aus `useAuth()` (`user.level`, `pendingUnlocks`, `dismissLevelUp`).
  Der Toast hing bisher im HUD und wäre mit dessen Entfernung still verschwunden — die
  Unlock-Rückmeldung bleibt erhalten, positionsneutral (`fixed bottom-4 right-4`).
- Die Toast-Invariante „begrenzte Verweildauer" (`TOAST_AUTO_DISMISS_MS` ≤ 8000 ms und
  > 2000 ms) ist von `GameHud.test.tsx` nach `LevelUpToast.test.tsx` gewandert, wo sie
  jetzt beim Eigentümer des Werts liegt.

*Bewusste Grenze* (→ **TD-05** in `hexToBinaryTrainer2Backend/docs/backlog.md`):
Mit dem HUD verschwinden `current_streak`, `best_streak` und der XP-Fortschrittsbalken
vollständig aus der Oberfläche. Das ist die Anforderung („weniger anzeigen"), kein
Versehen; falls Spieler die Serie vermissen, wird das eine eigene Story.

### Default Bit Selection (Tier-Unlock-System)

Der Trainer startet bei jedem Login auf dem **niedrigsten Tier, das das Profil bereits
freigeschaltet hat** — nicht auf einem hartcodierten Wert. Damit läuft die allererste Antwort
eines frischen Accounts nie mehr in das serverseitige Unlock-Gate (früher: `bit_width=8`
vorausgewählt ⇒ **403** für Level-1-Spieler).

| Level | Vorausgewähltes Tier (hex/bin) | Begründung |
|-------|-------------------------------|------------|
| 1 (fresh) | **4 Bits** | Slot 1 der D-2-Ladder; als einziges ab Level 1 offen |
| 4 | 4 Bits | 8 Bits sind *frei*, aber der Default bleibt Slot 1 (kein Zwangs-Hochsprung) |
| 8 / 13 / 99 | 4 Bits | Default ist bewusst **immer** Slot 1 — der Spieler wechselt selbst |
| Gast (kein Profil) | 4 Bits | „nichts gesperrt"-Semantik ⇒ ebenfalls Slot 1 |

Die Higher-Tiers (8/16/32 Bits) werden **manuell** über die Bit-Leiste gewählt, sobald das Level
sie freischaltet (4→L4, 16→L8, 32→L13). Gesperrte Tabs zeigen ein Schloss-Badge mit dem
Freischalt-Level und sind nicht aktivierbar. Unicode ist nicht betroffen: `1 Byte` (= 8 Bits) ist
dort bereits Slot 1 und ab Level 1 offen.

Die Zuordnung ist eine reine Funktion aus dem eingefrorenen Seed in
`src/constants/gameModes.ts` (`defaultTierFor(mode, playerLevel)`), kopiert aus dem Backend
(`game_config.py`) — nie hartcodiert, dadurch kann der Default nicht in ein gesperrtes Tier driften.

Details: Hand-Check-Anleitung in [`docs/US-46-hand-check.md`](./docs/US-46-hand-check.md);
Story, Akzeptanzkriterien und Seed-Matrix in `docs/sprint5-plan.md` (Sprint-5-Plan, US-46).

### Frontend Testing

Tests laufen mit Vitest + Testing Library (jsdom). Die Coverage-Schwelle liegt bei **80 %** (Lines, Functions, Branches, Statements) und wird im CI/lokal erzwungen.

```bash
npm test                # alle Tests einmal ausführen
npm run test:watch      # Watch-Modus
npm run test:coverage   # Tests + Coverage-Report (Schwelle 80 %)
```

Aktueller Stand: **440 Tests in 32 Dateien**, Coverage 94,45 % Statements / 89,28 % Branches
(gemessen mit `npm run test:coverage`; Schwelle ist 80 % in jeder Kennzahl). Der eine Test mehr
als in Sprint 4 gemessen ist die wiederhergestellte `TOAST_AUTO_DISMISS_MS`-Grenze aus US-45.

### Backend Deployment

Das Backend (`hexToBinaryTrainer2Backend`) läuft als Docker Compose Stack auf dem Server:

| Service | Port | Image |
|---------|------|-------|
| `api`   | 8000 | Custom (Python/FastAPI) |
| `db`    | —    | postgres:15-alpine |

**Verfahren:**
```bash
ssh server-root
cd /home/deploy/programs/hexToBinaryTrainer2Backend
docker compose up -d
```

### Backup & Restore

Die Backup-/Restore-Skripte liegen im Ordner [`backup-hex/`](./backup-hex/).

**Kurzanleitung:**
```bash
# Backup erstellen
ssh server-root
cd /home/deploy/backup/hexToBinaryTrainer2
echo 'DB_PW=DeinPasswort' > .env.local
bash backup-prod.sh

# Restore ausführen
bash restore.sh hextobin_YYYY-MM-DD_HH-MM.sql.gz
# oder interaktiv ohne Argument
bash restore.sh
```

Siehe [`backup-hex/README.md`](./backup-hex/README.md) für Details zu Konfiguration, Retention, Verschlüsselung und Tests.

### Serverzugriff

```bash
ssh server-root            # Hauptserver
scp file server-root:path  # Datei kopieren
```

SSH Config definiert den Alias `server-root`.
