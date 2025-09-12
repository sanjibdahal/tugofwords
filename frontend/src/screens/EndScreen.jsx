import React from 'react';

export default function EndScreen({ winner, finalState, playerId, onRestart }) {
  const isWinner = winner === playerId;
  return (
    <div className="end-screen">
      <h2>Game Over!</h2>
      <p>Winner: <b>{winner || 'No winner'}</b></p>
      <p>{isWinner ? 'Congratulations, you won!' : 'Better luck next time!'}</p>
      <div>
        <h3>Final Scores</h3>
        <p>Creator: {finalState.creator_score}</p>
        <p>Joiner: {finalState.joiner_score}</p>
        <p>Rope Position: {finalState.rope_position}</p>
      </div>
      <button onClick={onRestart}>Play Again</button>
    </div>
  );
}
