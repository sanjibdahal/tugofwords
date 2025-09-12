import React, { useState } from 'react';


export default function StartScreen({ onStart }) {
  const [playerId, setPlayerId] = useState('');
  const [mode, setMode] = useState('create');
  const [gameId, setGameId] = useState('');
  const [rounds, setRounds] = useState(5);

  const handleStart = () => {
    if (!playerId) return alert('Enter your player name!');
    if (mode === 'create') {
      onStart({ type: 'create', playerId, rounds });
    } else {
      if (!gameId) return alert('Enter game ID to join!');
      onStart({ type: 'join', playerId, gameId });
    }
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
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '2rem', fontWeight: 'bold', letterSpacing: '2px' }}>Tug of Keys</h1>
      <input
        type="text"
        placeholder="Your Name"
        value={playerId}
        onChange={e => setPlayerId(e.target.value)}
        style={{
          padding: '1rem',
          borderRadius: '1rem',
          border: 'none',
          marginBottom: '1.5rem',
          fontSize: '1.5rem',
          width: '250px',
          textAlign: 'center',
          background: 'rgba(255,255,255,0.1)',
          color: 'white',
        }}
      />
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
        <div style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => setMode('create')}>
          <img src="/create.svg" alt="Create" style={{ width: '120px', marginBottom: '0.5rem' }} />
          <div style={{ fontWeight: mode === 'create' ? 'bold' : 'normal', color: mode === 'create' ? '#A2C758' : 'white' }}>Create Game</div>
        </div>
        <div style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => setMode('join')}>
          <img src="/join.svg" alt="Join" style={{ width: '120px', marginBottom: '0.5rem' }} />
          <div style={{ fontWeight: mode === 'join' ? 'bold' : 'normal', color: mode === 'join' ? '#A2C758' : 'white' }}>Join Game</div>
        </div>
      </div>
      {mode === 'create' ? (
        <input
          type="number"
          min={1}
          max={20}
          value={rounds}
          onChange={e => setRounds(Number(e.target.value))}
          placeholder="Rounds"
          style={{
            padding: '1rem',
            borderRadius: '1rem',
            border: 'none',
            marginBottom: '1.5rem',
            fontSize: '1.5rem',
            width: '250px',
            textAlign: 'center',
            background: 'rgba(255,255,255,0.1)',
            color: 'white',
          }}
        />
      ) : (
        <input
          type="text"
          placeholder="Game ID"
          value={gameId}
          onChange={e => setGameId(e.target.value)}
          style={{
            padding: '1rem',
            borderRadius: '1rem',
            border: 'none',
            marginBottom: '1.5rem',
            fontSize: '1.5rem',
            width: '250px',
            textAlign: 'center',
            background: 'rgba(255,255,255,0.1)',
            color: 'white',
          }}
        />
      )}
      <button
        onClick={handleStart}
        style={{
          background: 'linear-gradient(90deg, #A2C758 0%, #70B15E 100%)',
          color: 'white',
          fontSize: '1.3rem',
          padding: '1rem 2.5rem',
          borderRadius: '1.5rem',
          border: 'none',
          boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
          cursor: 'pointer',
          marginTop: '1rem',
          letterSpacing: '1px',
        }}
      >
        {mode === 'create' ? 'Create Game' : 'Join Game'}
      </button>
    </div>
  );
}
