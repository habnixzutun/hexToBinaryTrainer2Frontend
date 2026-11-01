# US-46 Hand-Check — Default-Tier beim Login

**Story:** Default-Tier beim Login = erster freigeschalteter Tier (4 Bit), keine 403-Falle für Level-1-Spieler.
**Branch:** `feature/us-46-default-tier-login`
**DoD-Punkt:** „Hand-check im PR-Text beschrieben (L1-Login → 4-Bit-Frage → Antwort → 200, kein 403)".

Dieses Dokument hält den manuellen Nachweis fest. Die automatische Absicherung steht in
`test/App.defaultTier.test.tsx` (echter AuthProvider + gemockte HTTP-Schicht) und
`test/constants/defaultTier.test.ts` (Einheiten inkl. Seed-Perturbation und Throw-Branch).
Der Hand-Check ergänzt die Tests um den einzigen Punkt, den ein Mock nicht zeigt: dass das
**reale** Server-Gate (`src/routers/game.py`, UN-05) die erste Antwort eines frischen L1-Accounts
mit **200** quittiert.

---

## Warum überhaupt ein Hand-Check

Der Bug war funktional, nicht optisch: `bits` war hart auf `8` gesetzt (`App.tsx`, `HexBinTrainer.tsx`).
Ein Level-1-Spieler sah vorausgewählt das 8-Bit-Tier, gab die Antwort ein, und `POST /api/game/answer`
lief mit `bit_width=8` in das Unlock-Gate — **403** („bis Level 4 gesperrt"). Die allererste Aktion
eines neuen Accounts war eine Fehlermeldung. US-46 wählt den Default jetzt aus dem eingefrorenen
D-2-Seed (`defaultTierFor(mode, level)`), sodass vorausgewählt nie ein gesperrtes Tier ist.

---

## Vorbereitung

1. Backend lokal starten (Compose-Stack aus dem Frontend-README):
   ```bash
   cd hexToBinaryTrainer2Backend && docker compose up -d
   ```
   API erreichtbar unter `http://localhost:8000` (`VITE_API_URL` notiert, falls abweichend).
2. Frontend im Dev-Modus:
   ```bash
   cd hexToBinaryTrainer2Frontend && npm run dev
   ```
   App öffnet unter `https://localhost:5173/trainer` (base `/trainer`, mkcert-Selfsigned hinnehmen).
3. **Frischer Level-1-Account.** Registriere einen neuen Benutzer (noch keine Antworten ⇒ Level 1).
   Ein gebrauchter Account eignet sich nicht, weil sein Level ≥ 1 bereits Tier jenseits von Slot 1
   freischalten kann und der 403-Pfad so nicht mehr reproduzierbar wäre.
4. Browser-Devtools öffnen, Tab **Network** auf `Fetch/XHR`, Filter `answer`.

---

## Schritte (erwartetes Ergebnis je Schritt)

| # | Aktion | Erwartet |
|---|--------|----------|
| 1 | Als frischer L1-Account einloggen | Trainer erscheint, **Hex/Binary**-Ansicht |
| 2 | Bit-Auswahl (Desktop-Tabs oben, mobil Sidebar) prüfen | **4 Bits vorausgewählt** (`aria-selected="true"`); 8/16/32 zeigen Schloss-Badge mit „bis Level 4/8/13" |
| 3 | Frage lesen | 4-Bit-Frage, z.B. Hex `8` (einzelne Ziffer, kein zweistelliges `87`) |
| 4 | Richtige Antwort eintippen (bei Hex `8` → Binär `1000`) und **Check** klicken | Feedback „richtig", XP steigt um den L1-Wert |
| 5 | Network-Tab: `POST /api/game/answer` ansehen | **Status 200**; Request-Payload `{"mode":"hex_to_bin","bit_width":4,…}` |
| 6 | Antwort wiederholen (nächste Frage) | abermals 200 — kein 403, keine „gesperrt"-Meldung |
| 7 | Manuell auf 8 Bits wechseln (jetzt entsperrt ab L4 *nicht* vorhanden bei L1 → Schloss bleibt; erst nach Level-Up wählen) | Locked-Tabs bleiben nicht aktivierbar (AC-2 aus US-39, unverändert) |

**Bestanden**, wenn Schritt 5 eine `200` mit `bit_width: 4` zeigt und **nie** ein `403` aus dem
Unlock-Gate kommt. Der Gegenbeweis (alter Code) wäre eine `403` mit `bit_width: 8` bei Schritt 5.

---

## Screenshot-Hinweis

Screenshots wären ideal (sind aber nicht Pflicht). Falls erwünscht, pro Lauf festhalten:

- **S1:** Bit-Leiste nach Login — 4 Bits selektiert, 8/16/32 mit Schloss.
- **S2:** Network-Zeile des `POST /api/game/answer` — Status `200`, geöffneter Payload mit
  `"bit_width": 4`.
- Optional **S3:** dieselbe Szene vor dem Fix (403) als Regressionsnachweis.

Die Screenshots in den PR-Text einbetten; dieses Dokument verbleibt als anleitende Referenz im Repo.

---

## Grenzen des Hand-Checks

- Der mobile Pfad (Sidebar-Selector) wird durch denselben `bits`-State gespeist; ein Desktop-Lauf
  deckt ihn logisch ab, ein kurzer Mobil-Check (Schritt 2 in der Sidebar) ist empfohlen.
- Unicode-Trainer ist **nicht** betroffen (FE-12: `bytes=1` = Slot 1, min_level 1 — immer offen);
  er wird hier nicht geprüft, sondern durch `test/components/UnicodeTrainer.test.tsx` gepinnt.

Details zur Story, den Akzeptanzkriterien und der Seed-Matrix stehen in
`docs/sprint5-plan.md` (Sprint-5-Plan, US-46-Abschnitt).
