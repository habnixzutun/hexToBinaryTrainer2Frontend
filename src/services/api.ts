const BASE_URL = "http://localhost:8000"; // Deine spätere FastAPI URL

export interface LeaderboardEntry {
    name: string;
    correct: number;
    wrong: number;
    points: number;
}

export const api = {
    // Holt die aktuelle Bestenliste
    async getLeaderboard(): Promise<LeaderboardEntry[]> {
        try {
            // const response = await fetch(`${BASE_URL}/api/leaderboard`);
            const response = await fetch("/leaderboard.json");
            if (!response.ok) throw new Error("Netzwerk-Fehler");
            return await response.json();
        } catch (error) {
            console.error("Leaderboard konnte nicht geladen werden:", error);
            return []; // Fallback auf leeres Array
        }
    },

    // Meldet eine richtige Antwort
    async updateUserCorrect(username: string): Promise<void> {
        await fetch(`${BASE_URL}/api/correct`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username }),
        });
    },

    // Meldet eine falsche Antwort
    async updateUserIncorrect(username: string): Promise<void> {
        await fetch(`${BASE_URL}/api/incorrect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username }),
        });
    }
};