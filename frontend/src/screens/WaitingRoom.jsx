import React from 'react';

export default function WaitingRoom({ gameId, playerId, onLeave }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: 'sans-serif',
    }} className='waiting-room'>
      <h1 style={{fontSize: '3rem', fontWeight: 'semibold'}}>Game Created!</h1>
      <p>Game ID: <span>{gameId}</span></p>
      <p>Share this ID with your friend to join.</p>
      <p>Your Name: <span>{playerId}</span></p>
      <p>Waiting for another player to join...</p>
      <button onClick={onLeave}>Leave Room</button>
    </div>
  );
}
