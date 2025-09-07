import React from 'react';

function Overlay({ children, overlay }) {
    return (
        <div className={`Overlay ${overlay}`}>
            {children}
        </div>
    );
}

export default Overlay;
