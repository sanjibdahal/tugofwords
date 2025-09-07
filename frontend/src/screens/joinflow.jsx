import React, { useState } from 'react';
import Overlay from './overlay';

const JoinFlow = () => {
    const [roomCode, setRoomCode] = useState('');

    const handleJoin = () => {
        if (roomCode) {
            // console.log('Joining room:', roomCode);

        }
    };

    return (
        <Overlay overlay="full">
            <div className="ContainerRow">
                <input
                    type="text"
                    placeholder="Enter Room Code"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    className="GameInput"
                />
                <img
                    src="/arrow.svg"
                    className="Button"
                    alt="Join"
                    onClick={handleJoin}
                />
            </div>
        </Overlay>
    );
};

export default JoinFlow;
