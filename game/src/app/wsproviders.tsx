"use client";

import { ReactNode, useEffect } from "react";
import { useWsStore } from "./store/ws";

export function WsProvider({ children }: { children: ReactNode }) {
    const { connected, connect } = useWsStore();


    useEffect(() => {
        if (!connected) {
            connect("ws://localhost:1997/ws");
        }
    }, []);

    return <>{children}</>;
}
