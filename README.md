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

Aktueller Stand: **61 Tests in 9 Dateien**, Coverage ~93 % Statements / ~91 % Branches.

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
