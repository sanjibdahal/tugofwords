"use client";

import { WalletProvider } from "@suiet/wallet-kit";
import { ReactNode } from "react";


export function Providers({ children }: { children: ReactNode }) {
    return <WalletProvider>{children}</WalletProvider>;
}




