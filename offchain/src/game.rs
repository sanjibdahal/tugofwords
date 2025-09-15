use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::broadcast;
use uuid::Uuid;

use crate::utils::{current_timestamp, generate_hint_letters, is_valid_guess};

use crate::utils::DICTIONARY_VEC;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct GameState {
    pub game_id: String,
    pub creator: String,
    pub joiner: Option<String>,
    pub current_round: u8,
    pub rope_position: i8, // -10 to +10, positive = creator winning
    pub hint_letters: String,
    pub round_start_time: u64,
    pub creator_score: u8,
    pub joiner_score: u8,
    pub status: GameStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum GameStatus {
    WaitingForPlayer, // Only creator connected
    InProgress,       // Both players connected, game active
    Finished,         // Game over
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoundResult {
    pub round: u8,
    pub winner: String,
    pub word: String,
    pub new_rope_position: i8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LobbyInfo {
    pub game_id: String,
    pub creator: String,
    pub round: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum GameMessage {
    Lobby { games: Vec<LobbyInfo> },
    JoinGame { game_id: String, player_id: String },
    CreateGame { player_id: String, rounds: u8 },
    SubmitWord { word: String },
    GameCreated { game_id: String, player_id: String },
    PlayerJoined { player_id: String },
    GameState { state: GameState },
    RoundResult { result: RoundResult },
    GameFinish { player_id: String, score: i8 },
    Error { message: String },
}

#[derive(Clone)]
pub struct AppState {
    pub games: Arc<DashMap<String, Game>>,
    pub lobby_tx: broadcast::Sender<GameMessage>,
}

impl AppState {
    pub fn new(lobby_tx: broadcast::Sender<GameMessage>) -> Self {
        Self {
            games: Arc::new(DashMap::new()),
            lobby_tx,
        }
    }
}

pub struct Game {
    pub id: String,
    pub max_rounds: u8,
    pub creator: String,
    pub joiner: Option<String>,
    pub state: GameState,
    pub tx: broadcast::Sender<GameMessage>,
}

impl Game {
    pub fn new(creator: String, max_rounds: u8) -> Self {
        let game_id = Uuid::new_v4().to_string()[..8].to_string();
        let hint_letters = generate_hint_letters();
        let (tx, _) = broadcast::channel(100);
        let state = GameState {
            game_id: game_id.clone(),
            creator: creator.clone(),
            joiner: None,
            current_round: 1,
            rope_position: 0,
            hint_letters,
            round_start_time: current_timestamp(),
            creator_score: 0,
            joiner_score: 0,
            status: GameStatus::WaitingForPlayer,
        };

        Self {
            id: game_id,
            max_rounds,
            creator,
            joiner: None,
            state,
            tx,
        }
    }

    pub fn add_joiner(&mut self, joiner: String) -> Result<(), String> {
        if self.joiner.is_some() {
            return Err("Game is full".to_string());
        }
        if joiner == self.creator {
            return Err("Cannot be joined by the creator!".to_string());
        }

        self.joiner = Some(joiner.clone());
        self.state.joiner = Some(joiner.clone());
        self.state.status = GameStatus::InProgress;
        self.state.round_start_time = current_timestamp();

        // Broadcast that player joined
        let _ = self
            .tx
            .send(GameMessage::PlayerJoined { player_id: joiner });
        self.broadcast_state();

        Ok(())
    }

    pub fn submit_word(
        &mut self,
        player: &str,
        word: String,
    ) -> Result<Option<RoundResult>, String> {
        if self.state.status != GameStatus::InProgress {
            return Err("Game not in progress".to_string());
        }

        if self.joiner.is_none() {
            return Err("Waiting for second player".to_string());
        }

        let word_lower = word.to_lowercase();

        if !DICTIONARY_VEC.get().unwrap().contains(&word_lower) {
            return Err(format!("Word not in dictionary {}", word_lower));
        }

        if !is_valid_guess(&word_lower, &self.state.hint_letters) {
            return Err(format!(
                "Word must contain all hint letters: {}",
                self.state.hint_letters
            ));
        }

        let is_creator = player == self.state.creator;
        let is_joiner = Some(player) == self.state.joiner.as_deref();

        if !is_creator && !is_joiner {
            return Err("Player not in this game".to_string());
        }

        let rope_change = if is_creator { 1 } else { -1 };
        self.state.rope_position += rope_change;

        if is_creator {
            self.state.creator_score += 1;
        } else {
            self.state.joiner_score += 1;
        }

        let result = RoundResult {
            round: self.state.current_round,
            winner: player.to_string(),
            word,
            new_rope_position: self.state.rope_position,
        };

        if self.state.current_round > self.max_rounds - 1 {
            self.state.status = GameStatus::Finished;
            return Ok(Some(result));
        }

        self.next_round();

        Ok(Some(result))
    }

    fn next_round(&mut self) {
        self.state.current_round += 1;
        self.state.hint_letters = generate_hint_letters();
        self.state.round_start_time = current_timestamp();
    }

    pub fn broadcast_state(&self) {
        let _ = self.tx.send(GameMessage::GameState {
            state: self.state.clone(),
        });
    }

    pub fn check_n_broadcast_finish(&self) {
        if self.state.status == GameStatus::Finished {
            let mut winner = String::from("Draw");
            if self.state.rope_position > 0 {
                winner = self.state.creator.clone();
            }

            if let Some(p) = &self.state.joiner
                && self.state.rope_position < 0
            {
                winner = p.to_string();
            }

            let _ = self.tx.send(GameMessage::GameFinish {
                player_id: winner,
                score: self.state.rope_position,
            });
        }
    }
}
