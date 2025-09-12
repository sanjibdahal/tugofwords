import "./App.css";


import React, { useState, useRef } from "react";
import StartScreen from "./screens/StartScreen";
import WaitingRoom from "./screens/WaitingRoom";
import GameScreen from "./screens/GameScreen";
import EndScreen from "./screens/EndScreen";

export default function App() {
  const [screen, setScreen] = useState("start");
  const [playerId, setPlayerId] = useState("");
  const [gameId, setGameId] = useState("");
  const [rounds, setRounds] = useState(5);
  const ws = useRef(null);
  const [gameState, setGameState] = useState(null);
  const [endInfo, setEndInfo] = useState(null);

  // Handle starting (create/join)
  const handleStart = ({ type, playerId, rounds, gameId }) => {
    setPlayerId(playerId);
    setRounds(rounds || 5);
    if (!ws.current) {
      ws.current = new window.WebSocket("ws://127.0.0.1:1997/ws");
      ws.current.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "GameCreated") {
          setGameId(msg.game_id);
          setScreen("waiting");
        } else if (msg.type === "PlayerJoined") {
          setScreen("game");
        } else if (msg.type === "GameState") {
          setGameState(msg.state);
        } else if (msg.type === "RoundResult") {
          // Optionally show round result
        } else if (msg.type === "GameEnd") {
          setEndInfo({ winner: msg.winner, finalState: msg.final_state });
          setScreen("end");
        } else if (msg.type === "Error") {
          alert(msg.message);
        }
      };
      ws.current.onclose = () => {
        setScreen("start");
        setGameId("");
      };
    }
    if (type === "create") {
      ws.current.send(
        JSON.stringify({ type: "CreateGame", player_id: playerId, rounds })
      );
    } else if (type === "join") {
      setGameId(gameId);
      ws.current.send(
        JSON.stringify({
          type: "JoinGame",
          game_id: gameId,
          player_id: playerId,
        })
      );
      setScreen("waiting"); // Will update when backend responds
    }
  };

  const handleLeaveRoom = () => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    setScreen("start");
    setGameId("");
  };

  if (screen === "start") {
    return <StartScreen onStart={handleStart} />;
  }
  if (screen === "waiting") {
    return (
      <WaitingRoom
        gameId={gameId}
        playerId={playerId}
        onLeave={handleLeaveRoom}
      />
    );
  }
  if (screen === "game" && gameState) {
    return (
      <GameScreen
        gameState={gameState}
        playerId={playerId}
        onSubmitWord={word => {
          ws.current.send(JSON.stringify({ type: "SubmitWord", word }));
        }}
      />
    );
  }
  if (screen === "end" && endInfo) {
    return (
      <EndScreen
        winner={endInfo.winner}
        finalState={endInfo.finalState}
        playerId={playerId}
        onRestart={() => {
          setScreen("start");
          setGameId("");
          setGameState(null);
          setEndInfo(null);
          if (ws.current) {
            ws.current.close();
            ws.current = null;
          }
        }}
      />
    );
  }
  return null;
}
