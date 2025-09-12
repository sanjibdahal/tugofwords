import React, { useState } from 'react';

export default function GameScreen({ gameState, onSubmitWord, playerId }) {
  const [word, setWord] = useState('');
  const { current_round, hint_letters, rope_position, creator_score, joiner_score, status } = gameState || {};

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!word) return;
    onSubmitWord(word);
    setWord('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: 'sans-serif',
    }} className="game-screen">
      <h2>Round {current_round}</h2>
      <p>Hint Letters: <span>{hint_letters}</span></p>
      <p>Rope Position: <span>{rope_position}</span></p>
      <p>Your Score: <span>{playerId === gameState.creator ? creator_score : joiner_score}</span></p>
      <form style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: 'sans-serif',
    }} onSubmit={handleSubmit}>
        <input
          type="text"
          value={word}
          onChange={e => setWord(e.target.value)}
          placeholder="Type a word..."
        />
        <button type="submit">Submit Word</button>
      </form>
      <p>Status: <span>{status}</span></p>
    </div>
  );
}
