# Bug: Überflüssiger `/api/user/me`-Request nach jeder Antwort

Status: offen · Gefunden: 27.10.2026 bei der Umsetzung des Gastmodus · Betrifft: nur angemeldete Nutzer (im Gastmodus gibt es keine API-Requests)

## Beschreibung

Nach jeder beantworteten Aufgabe schickt das Frontend zusätzlich zum Spiel-Request (`POST /api/game/correct` bzw. `/incorrect`) einen `GET /api/user/me`. Dieser Request ist unnötig, weil die Antwort des Spiel-Requests die neuen Werte (`correct_count`, `incorrect_count`, `points`) bereits enthält und `applyGameResult` sie schon in den Zustand übernimmt.

## Ursache

In `src/components/HexBinTrainer.tsx` (Zeilen 89 und 99) und `src/components/UnicodeTrainer.tsx` (Zeilen 73 und 83):

```ts
onGameResult?.(result) ?? onUpdate();
```

Gedacht war: „Wenn es `onGameResult` gibt, nimm das, sonst `onUpdate`.“ Tatsächlich prüft `??` aber den **Rückgabewert** von `onGameResult(...)`. Die Funktion gibt nichts zurück (`undefined`), deshalb wird `onUpdate()` **immer zusätzlich** ausgeführt. `onUpdate` ruft in `App.tsx` `refreshUser()` auf, was den `/api/user/me`-Request auslöst.

## Auswirkung

- Ein zusätzlicher Request pro Antwort (doppelte Last auf dem Backend für diesen Ablauf).
- Der Zustand wird zweimal gesetzt (erst aus der Spiel-Antwort, dann aus `/api/user/me`), und das Leaderboard wird zweimal neu geladen.
- Kein falsches Ergebnis für den Nutzer, aber unnötiger Netzwerkverkehr.

## Reproduktion

1. Normal anmelden.
2. DevTools (F12), Tab „Netzwerk“, Filter Fetch/XHR.
3. Eine Aufgabe beantworten.
4. Beobachtet: `correct` (oder `incorrect`), danach `me` und `leaderboard`. Erwartet: `correct` und `leaderboard`, kein `me`.

## Lösungsvorschlag

Die Bedingung auf das Vorhandensein der Funktion prüfen, nicht auf ihren Rückgabewert:

```ts
if (onGameResult) {
    onGameResult(result);
} else {
    onUpdate();
}
```

Nebeneffekt: Damit verschwinden auch die vier ESLint-Fehler `@typescript-eslint/no-unused-expressions` in diesen Zeilen. Die Tests in `test/components/HexBinTrainer.test.tsx` und `test/components/UnicodeTrainer.test.tsx` erwarten, dass `onUpdate` aufgerufen wird, wenn kein `onGameResult` übergeben wird. Das bleibt mit dem Vorschlag erfüllt. Ein zusätzlicher Test sollte prüfen, dass `onUpdate` **nicht** aufgerufen wird, wenn `onGameResult` vorhanden ist.

## Abgrenzung

Nicht im Branch `Gastmodus` behoben, weil es ein eigenes Thema ist und den Gastmodus nicht betrifft. Eigener kleiner Branch und Pull Request empfohlen.
