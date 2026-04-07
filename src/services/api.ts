const BASE_URL = "http://localhost:8000"; // Deine spätere FastAPI URL

export interface LeaderboardEntry {
    name: string;
    correct: number;
    wrong: number;
    points: number;
}

export interface UserType {
    name: string;
    correct: number;
    incorrect: number;
    points: number;
}

export interface UserList {
    entries: UserType[];
}

export interface ResultResponse {
    message: string;
    user: UserType;
}

export const api = {
    // Holt die aktuelle Bestenliste
    async getUser(username: string): Promise<UserType> {
        const response = await fetch(`${BASE_URL}/api/user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: username
            }),
        });
        if (!response.ok) {
            // Fallback, falls der User neu ist und das Backend z.B. 404 wirft
            return { name: username, correct: 0, incorrect: 0, points: 0 };
        }
        return await response.json();
    },

    // Holt die Bestenliste
    async getLeaderboard(): Promise<UserType[]> {
        try {
            const response = await fetch(`${BASE_URL}/api/leaderboard`);
            if (!response.ok) throw new Error("Netzwerk-Fehler");
            const data: UserList = await response.json();
            return data.entries; // Wir geben nur die Liste zurück
        } catch (error) {
            console.error("Leaderboard konnte nicht geladen werden:", error);
            return [];
        }
    },

    // Meldet eine richtige Antwort
    async updateUserCorrect(username: string, bits: number): Promise<ResultResponse> {
        const response = await fetch(`${BASE_URL}/api/correct`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: username,
                bits: bits
            }),
        });
        return await response.json();
    },

    async updateUserIncorrect(username: string, bits: number): Promise<ResultResponse> {
        const response = await fetch(`${BASE_URL}/api/incorrect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: username,
                bits: bits
            }),
        });
        return await response.json();
    }
};