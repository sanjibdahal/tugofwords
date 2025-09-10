// Match GameStatus enum
export type GameStatus = "WaitingForPlayer" | "InProgress" | "Finished";

// GameState struct
export interface GameState {
    game_id: string;
    creator: string;
    joiner?: string | null;
    current_round: number;
    rope_position: number; // -10 to +10
    hint_letters: string;
    round_start_time: number; // timestamp
    creator_score: number;
    joiner_score: number;
    status: GameStatus;
}

//RoundResult struct
export interface RoundResult {
    round: number;
    winner: string;
    word: string;
    new_rope_position: number;
}

// LobbyInfo struct
export interface LobbyInfo {
    game_id: string;
    creator: string;
    round: number;
}





// GameMessage enum (tagged union)
export type GameMessage =
    | { type: "Lobby"; games: LobbyInfo[] }
    | { type: "JoinGame"; game_id: string; player_id: string }
    | { type: "CreateGame"; player_id: string; rounds: number }
    | { type: "SubmitWord"; word: string }
    | { type: "GameCreated"; game_id: string; player_id: string }
    | { type: "PlayerJoined"; player_id: string }
    | { type: "GameState"; state: GameState }
    | { type: "GameFinish"; player_id: String, score: number}
    | { type: "RoundResult"; result: RoundResult }
    | { type: "GameEnd"; winner?: string | null; final_state: GameState }
    | { type: "Error"; message: string };
