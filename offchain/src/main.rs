use crate::{
    consts::ADDR,
    game::{AppState, Game, GameMessage, GameStatus},
};
use axum::{
    extract::{
        ws::{Message, WebSocket},
        State, WebSocketUpgrade,
    },
    response::Response,
    routing::any,
    Router,
};

use futures_util::{
    sink::SinkExt,
    stream::{SplitSink, StreamExt},
};
use tokio::sync::{broadcast, mpsc::Receiver};
use tower_http::cors::CorsLayer;

mod consts;
mod game;
mod utils;

async fn handle_receiver(mut rx: Receiver<GameMessage>, mut sender: SplitSink<WebSocket, Message>) {
    while let Some(msg) = rx.recv().await {
        if let GameMessage::Error { .. } = &msg {
            let _ = sender.send(Message::Close(None)).await;
            break;
        }

        if let Ok(json) = serde_json::to_string(&msg)
            && sender.send(Message::Text(json.into())).await.is_err()
        {
            break; // client disconnected
        }
    }
}
// ^
// |
// |
// |
// |
async fn forward_game_broadcast(
    mut rx: broadcast::Receiver<GameMessage>,
    tx_out: tokio::sync::mpsc::Sender<GameMessage>,
) {
    loop {
        match rx.recv().await {
            Ok(msg) => {
                if tx_out.send(msg).await.is_err() {
                    break; // client disconnected
                }
            }
            Err(broadcast::error::RecvError::Lagged(count)) => {
                tracing::warn!("Dropped {} broadcast messages due to lag", count);
            }
            Err(broadcast::error::RecvError::Closed) => break,
        }
    }
}

async fn handle_socket(socket: WebSocket, state: AppState) {
    let (sender, mut receiver) = socket.split();

    let mut current_game_id: Option<String> = None;
    let mut player_id: Option<String> = None;
    // these tx and rx are solely to send message to the client
    let (tx_out, rx_out) = tokio::sync::mpsc::channel::<GameMessage>(100);

    drop(tokio::spawn(handle_receiver(rx_out, sender)));

    // Handle incoming messages
    while let Some(msg) = receiver.next().await {
        match msg {
            Ok(Message::Text(text)) => {
                if let Ok(game_msg) = serde_json::from_str::<GameMessage>(&text) {
                    match game_msg {
                        GameMessage::CreateGame {
                            player_id: pid,
                            rounds,
                        } => {
                            let game = Game::new(pid.clone(), rounds);
                            let game_id = game.id.clone();
                            let game_rx = game.tx.subscribe();
                            let tx_clone = tx_out.clone();
                            tokio::spawn(async move {
                                forward_game_broadcast(game_rx, tx_clone).await;
                            });

                            state.games.insert(game_id.clone(), game);

                            current_game_id = Some(game_id.clone());
                            player_id = Some(pid.clone());

                            // game created confirmation
                            let _ = tx_out
                                .send(GameMessage::GameCreated {
                                    game_id: game_id.clone(),
                                    player_id: pid,
                                })
                                .await;

                            tracing::info!("Game {} created by: {:?}", game_id, player_id)
                        }

                        GameMessage::JoinGame {
                            game_id,
                            player_id: pid,
                        } => {
                            if let Some(mut game) = state.games.get_mut(&game_id) {
                                match game.add_joiner(pid.clone()) {
                                    Ok(()) => {
                                        current_game_id = Some(game_id.clone());
                                        player_id = Some(pid.clone());
                                        let rx = game.tx.subscribe();
                                        let tx_clone = tx_out.clone();
                                        tokio::spawn(async move {
                                            forward_game_broadcast(rx, tx_clone).await;
                                        });
                                        let _ = tx_out
                                            .send(GameMessage::JoinGame {
                                                game_id,
                                                player_id: pid,
                                            })
                                            .await;

                                        tracing::info!(
                                            "Game {:?} joined by: {:?}",
                                            current_game_id,
                                            player_id
                                        )
                                    }
                                    Err(e) => {
                                        let _ =
                                            tx_out.send(GameMessage::Error { message: e }).await;
                                    }
                                }
                            } else {
                                let _ = tx_out
                                    .send(GameMessage::Error {
                                        message: "Game not found".to_string(),
                                    })
                                    .await;
                            }
                        }

                        GameMessage::SubmitWord { word } => {
                            if let (Some(game_id), Some(player)) = (&current_game_id, &player_id) {
                                if let Some(mut game) = state.games.get_mut(game_id) {
                                    match game.submit_word(player, word) {
                                        Ok(Some(result)) => {
                                            // Broadcast round result
                                            let _ = game.tx.send(GameMessage::RoundResult {
                                                result: result.clone(),
                                            });

                                            if game.state.status == GameStatus::Finished {
                                                let winner = game.get_winner();
                                                let _ = game.tx.send(GameMessage::GameEnd {
                                                    winner,
                                                    final_state: game.state.clone(),
                                                });
                                            } else {
                                                game.broadcast_state();
                                            }
                                        }
                                        Ok(None) => {
                                            // this in theory is not possible
                                        }
                                        Err(e) => {
                                            let _ = tx_out
                                                .send(GameMessage::Error { message: e })
                                                .await;
                                        }
                                    }
                                }
                            }
                        }

                        _ => {} // ignore other message types from client
                    }
                }
            }
            Ok(Message::Close(_)) => break,
            Err(e) => {
                tracing::error!("WebSocket error: {}", e);
                break;
            }
            _ => {}
        }
    }

    // Cleanup when connection closes
    if let Some(game_id) = current_game_id {
        if let Some((_, mut game)) = state.games.remove(&game_id) {
            let disconnected_player = player_id.unwrap_or("Unknown".to_string());

            let winner = if disconnected_player == game.creator {
                game.joiner.clone()
            } else {
                Some(game.creator.clone())
            };

            game.state.status = GameStatus::Finished;

            if winner.is_some() {
                let game_end_msg = GameMessage::GameEnd {
                    winner: winner.clone(),
                    final_state: game.state.clone(),
                };
                let _ = game.tx.send(game_end_msg);

                let disconnect_msg = GameMessage::Error {
                    message: format!("{} disconnected. You win by default!", disconnected_player),
                };
                let _ = game.tx.send(disconnect_msg);
            }

            tracing::info!(
                "Player {} disconnected from game {}. Winner: {:?}",
                disconnected_player,
                game_id,
                winner
            );
        }
    }
}
async fn handler(ws: WebSocketUpgrade, State(state): State<AppState>) -> Response {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt().init();
    let state = AppState::new();

    // build our application with a single route
    let app = Router::new()
        .route("/ws", any(handler))
        .layer(CorsLayer::new())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(ADDR).await.unwrap();
    tracing::info!("server running at address: {}", ADDR);
    axum::serve(listener, app).await.unwrap();
}
