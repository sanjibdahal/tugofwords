import { create } from "zustand";

interface WalletState {
    address: string | null;
    setAddress: (addr: string) => void;
    clearAddress: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
    address: null,
    setAddress: (addr) => set({ address: addr }),
    clearAddress: () => set({ address: null }),
}));
