import './App.css';
import CreateOrJoin from './screens/start';
import CreateFlow from './screens/createflow';
import JoinFlow from './screens/joinflow';
import { useState } from 'react';

function App() {
  const [flow, setFlow] = useState(null); // null | 'create' | 'join'

  const handleCreate = () => setFlow('create');
  const handleJoin = () => setFlow('join');

  if (flow === 'create') return <CreateFlow />;
  if (flow === 'join') return <JoinFlow />;

  return <CreateOrJoin onCreate={handleCreate} onJoin={handleJoin} />;
}

export default App;
