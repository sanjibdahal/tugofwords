import { create } from "zustand";
import { GameMessage, LobbyInfo, GameState } from "../types/game";

let wsInstance: WebSocket | null = null;

interface WsState {
    connected: boolean;
    lobbyGames: LobbyInfo[];
    gameState: GameState | null;
    gameCreatedId: string | null;
    gameFinished: { "player_id": string, "score": number } | null
    gameError: string | null;
    connect: (url: string) => void;
    disconnect: () => void;
    send: (msg: GameMessage) => void;
    clearLobby: () => void;
}

export const useWsStore = create<WsState>((set) => ({
    connected: false,
    lobbyGames: [],
    gameState: null,
    gameCreatedId: null,
    gameError: null,
    gameFinished: null,

    connect: (url: string) => {
        if (wsInstance && wsInstance.readyState === WebSocket.OPEN) return;

        wsInstance = new WebSocket(url);

        wsInstance.onopen = () => {
            console.log("WebSocket connected");
            set({ connected: true });
        };

        wsInstance.onmessage = (event) => {
            const data: GameMessage = JSON.parse(event.data);

            switch (data.type) {
                case "Lobby":
                    set({ lobbyGames: data.games });
                    break;
                case "GameState":
                    set({ gameState: data.state });
                    break;
                case "GameCreated":
                    set({ gameCreatedId: data.game_id });
                    break;
                case "GameFinish":
                    set({ gameFinished: { player_id: data.player_id.toString(), score: data.score } });
                    break;
                case "Error":
                    set({ gameError: data.message })
                    break;
            }
        };

        wsInstance.onclose = () => {
            console.log("WebSocket disconnected");
            set({ connected: false });
            wsInstance = null;


        };

        wsInstance.onerror = (err) => {
            console.error("WebSocket error", err);
            wsInstance?.close();
        };
    },

    disconnect: () => {
        wsInstance?.close();
        wsInstance = null;
        set({ connected: false, lobbyGames: [], gameState: null, gameCreatedId: null });
    },

    send: (msg: GameMessage) => {
        if (wsInstance?.readyState === WebSocket.OPEN) {
            wsInstance.send(JSON.stringify(msg));
        } else {
            console.warn("WebSocket not connected, cannot send message");
        }
    },

    clearLobby: () => set({ lobbyGames: [] }),
}));
