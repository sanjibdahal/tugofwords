"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@suiet/wallet-kit";
import { useWsStore } from "../store/ws";
import { motion } from "framer-motion";
import { floatVariants } from "../utils";

export default function LobbyPage() {
    let { connected, account } = useWallet();
    const router = useRouter();
    const { connected: wsConnected, lobbyGames, send, gameCreatedId } = useWsStore();
    const [search, setSearch] = useState("");
    const [isCreator, setIsCreator] = useState(false); // new flag

    // Redirect if wallet not connected
    useEffect(() => {
        if (!connected) router.push("/");
    }, [connected, router]);

    // Request lobby games when WS is connected
    useEffect(() => {
        if (wsConnected && account) {
            send({ type: "Lobby", games: [] });
        }
    }, [wsConnected, account, send]);

    // Redirect automatically after creating game
    useEffect(() => {
        if (gameCreatedId) {
            setIsCreator(true); // mark this user as creator
            router.push(`/game/${gameCreatedId}`);
        }
    }, [gameCreatedId, router]);

    const filteredGames = lobbyGames.filter(game =>
        game.game_id.toLowerCase().includes(search.toLowerCase())
    );

    const handleJoin = (gameId: string) => {
        if (!account || !wsConnected) return;
        router.push(`/game/${gameId}`);
    };

    const handleCreate = () => {
        if (!account || !wsConnected) return;

        send({ type: "CreateGame", player_id: account.address, rounds: 10 });
    };

    return (
        <main className="flex flex-col items-center justify-center min-h-screen p-8 space-y-6 text-white">
            <div className="flex flex-col items-center justify-center w-full max-w-md space-y-6 relative">
                <motion.img
                    src="/rope.svg"
                    alt="Rope"
                    className="z-[-1] absolute top-[5%] left-1/2 -translate-x-1/2 -translate-y-1/2 "
                    initial={{ opacity: 0.8 }}
                    animate={{ opacity: 1 }}
                />

                <motion.div whileHover={{ scale: 1.05 }}>

                    <motion.img src="/lobby.svg" alt="Lobby" className="cursor-pointer z-20" onClick={handleCreate}
                        variants={floatVariants}
                        animate="float"
                        whileHover="hover"
                    />

                </motion.div>

                <input
                    type="text"
                    placeholder="Search game by code..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full placeholder-[#ffffff51] text-2xl p-2 rounded border border-[#2B5754] bg-[#2B5754]/30 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-[#2B5754]"
                />

                <div className="w-full h-96 overflow-y-auto space-y-4 p-4 rounded-lg backdrop-blur-md bg-[#2B5754]/50 border border-[#2B5754]/70 shadow-lg">
                    {!wsConnected && (
                        <p className="text-gray-200 text-center">Connecting...</p>
                    )}

                    {wsConnected && filteredGames.length === 0 && (
                        <p className="text-gray-200 text-2xl  text-center">No games found</p>
                    )}

                    {filteredGames.map(game => (
                        <div
                            key={game.game_id}
                            className="flex justify-between items-center p-4 bg-[#2B5754]/50 rounded-lg shadow hover:bg-[#2B5754]/70 transition"
                        >
                            <div className="max-w-[65%] truncate">
                                <p className="font-semibold">ID: {game.game_id}</p>
                                <p className="text-gray-200 text-sm break-words">
                                    Creator: <span className="break-all">{game.creator}</span> | Rounds: {game.round}
                                </p>
                            </div>
                            <motion.div whileHover={{ scale: 1.05 }}>
                                <img
                                    src="/join.svg"
                                    className="cursor-pointer w-28"

                                    onClick={() => handleJoin(game.game_id)}
                                >
                                </img>
                            </motion.div>
                        </div>
                    ))}
                </div>

                <motion.div whileHover={{ scale: 1.05 }}>

                    <img src="/create.svg" alt="connect" className="cursor-pointer z-20" onClick={handleCreate}
                    />

                </motion.div>


            </div>
        </main>
    );
}
