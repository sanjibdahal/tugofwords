import React, { useState, useEffect } from 'react';
import Overlay from './overlay';

const CreateFlow = ({ onCancel }) => {
    const [roomCode, setRoomCode] = useState(null);
    const [waiting, setWaiting] = useState(false);

    useEffect(() => {
        // generate code immediately
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setRoomCode(code);

        // after short delay, show waiting overlay
        const timer = setTimeout(() => setWaiting(true), 1000);
        return () => clearTimeout(timer);
    }, []);

    if (!waiting) {
        return (
            <div className="ContainerColumn">
                <div className="waiting-text">Room Code: {roomCode}</div>
            </div>
        );
    }

    return (
        <Overlay overlay="full">
            <div className="ContainerColumn">
                <div className="room-code">Room Code: {roomCode}</div>
                <div className="waiting-text">Waiting for other player to join...</div>
                <div className="loader"></div>
            </div>
        </Overlay>
    );
};

export default CreateFlow;
