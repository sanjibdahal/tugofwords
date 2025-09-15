"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useWallet } from "@suiet/wallet-kit";
import { useWsStore } from "../../store/ws";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";
import party from "party-js";

export default function GamePage() {
    const router = useRouter();
    const params = useParams();
    const { connected, account } = useWallet();
    const { connected: wsConnected, send, gameState, gameError, gameFinished } =
        useWsStore();

    const [playerReady, setPlayerReady] = useState(false);
    const [typedWord, setTypedWord] = useState("");
    const [shake, setShake] = useState(false);
    const [overlayHalf, setOverlayHalf] = useState(false);
    const [prevScores, setPrevScores] = useState({ creator: 0, joiner: 0 });

    const gameId = params.id?.toString();

    const isCreator = account?.address === gameState?.creator;
    const opponent = isCreator ? gameState?.joiner : gameState?.creator;

    // Redirect if wallet not connected
    useEffect(() => {
        if (!connected) router.push("/");
    }, [connected, router]);

    // checks if the user is creator or joiner and based on sends the signal
    useEffect(() => {
        if (wsConnected && account && !playerReady && !gameState?.creator && gameId && !isCreator) {
            send({
                type: "JoinGame",
                game_id: gameId,
                player_id: account.address,
            });
            setPlayerReady(true);
        }
    }, [wsConnected, account, gameId]);

    // handles all kinds of error comming 
    useEffect(() => {
        if (gameError) toast.error(gameError);
    }, [gameError]);

    // Overlay
    useEffect(() => {
        if (!gameState) return;
        setOverlayHalf(gameState.status === "InProgress");
    }, [gameState?.status]);

    // keyboard logic
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter") {
                if (typedWord.trim()) {
                    const hint = gameState?.hint_letters || "";
                    const hintRegex = new RegExp(hint, "i");
                    if (!hintRegex.test(typedWord)) {
                        setShake(true);
                        setTimeout(() => setShake(false), 500);
                        toast.error("Word must contain the hint sequence!");
                        return;
                    }
                    send({ type: "SubmitWord", word: typedWord.trim() });
                    setTypedWord("");
                }
            } else if (e.key === "Backspace") {
                setTypedWord((prev) => prev.slice(0, -1));
            } else if (/^[a-zA-Z]$/.test(e.key)) {
                setTypedWord((prev) => prev + e.key);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [typedWord, send, gameState]);


    useEffect(() => {
        if (!gameState) return;
        const prev = prevScores;
        const newCreator = gameState.creator_score;
        const newJoiner = gameState.joiner_score;

        if (newCreator !== prev.creator || newJoiner !== prev.joiner) {
            setTypedWord("");
            setShake(true);
            setTimeout(() => setShake(false), 500);
            const el = document.getElementById(isCreator ? "your-card" : "opponent-card");
            if (el) party.confetti(el, { count: party.variation.range(20, 40) });
        }
        setPrevScores({ creator: newCreator, joiner: newJoiner });
    }, [gameState]);

    // Confetti on winner
    useEffect(() => {
        if (!gameFinished) return;
        const winnerEl = document.getElementById(
            gameFinished.player_id === account?.address ? "your-card" : "opponent-card"
        );
        if (winnerEl) party.confetti(winnerEl, { count: party.variation.range(30, 50) });
    }, [gameFinished]);

    if (!gameState) return null;

    const handleLobby = () => {
        if (!account || !wsConnected) return;
        router.push(`/lobby}`);
    };


    const renderTypedWord = () => {
        const hint = gameState?.hint_letters || "";
        return typedWord.split("").map((ch, idx) => (
            <span
                key={idx}
                className={hint.toLowerCase().includes(ch.toLowerCase()) ? "text-green-400 font-bold" : "text-white"}
            >
                {ch}
            </span>
        ));
    };

    return (
        <main className="flex flex-col items-center min-h-screen w-full text-white relative pt-10 overflow-x-auto">
            <Toaster
                position="top-center"
                toastOptions={{
                    style: {
                        background: "#2B5754cc",
                        color: "white",
                        backdropFilter: "blur(10px)",
                        fontFamily: "monospace",
                    },
                }}
            />

            <div className={`${overlayHalf ? "z-[-1]" : "z-10"} fixed inset-0 pointer-events-none flex transition-all duration-1000`}>
                <div
                    className={`bg-[#02020279] h-full flex items-center justify-center text-white text-xl font-bold transition-all duration-1000 ${overlayHalf ? "w-1/2" : "w-full"}`}
                >
                    {gameState.status === "WaitingForPlayer" && (
                        <div className="flex flex-col items-center">
                            <span>Waiting For Other Player To Join The Game</span>
                            <div className="mt-4 animate-spin border-4 border-t-transparent border-white rounded-full w-10 h-10" />
                        </div>
                    )}
                </div>

            </div>

            {/* Player Cards */}
            <div className="grid grid-cols-2 gap-6 w-full max-w-4xl mb-6">
                <div
                    id="your-card"
                    className="p-4 rounded-lg backdrop-blur-md bg-[#2B5754]/50 border border-[#2B5754]/70 shadow-lg"
                >
                    <h2 className="text-xl font-semibold">You</h2>
                    <p className="text-sm break-all">{account?.address}</p>
                    <div className="mt-2 text-2xl font-bold">
                        {isCreator ? gameState.creator_score : gameState.joiner_score}
                    </div>
                </div>

                <div
                    id="opponent-card"
                    className="p-4 rounded-lg backdrop-blur-md bg-[#2B5754]/50 border border-[#2B5754]/70 shadow-lg"
                >
                    <h2 className="text-xl font-semibold">Opponent</h2>
                    <p className="text-sm break-all">{opponent || "Waiting..."}</p>
                    <div className="mt-2 text-2xl font-bold">
                        {isCreator ? gameState.joiner_score : gameState.creator_score}
                    </div>
                </div>
            </div>

            {/* Round + Hint */}
            <div className={`${!overlayHalf ? "hidden" : ""} flex gap-8 items-center mb-6 text-lg font-semibold `}>
                <p>
                    Round: <span className="font-bold text-white">{gameState.current_round}</span>
                </p>
                <p>
                    Hint:{" "}
                    <span className="p-4 rounded-lg backdrop-blur-md bg-[#2B5754]/50 border border-[#2B5754]/70 shadow-lg text-xl tracking-widest animate-pulse">
                        {gameState.hint_letters}
                    </span>
                </p>
            </div>

            {/* Typing Word */}
            {gameState.status === "InProgress" && (
                <div
                    className={`mb-6 px-6 p-4 rounded-lg backdrop-blur-md bg-[#2B5754]/50 border border-[#2B5754]/70 shadow-lg text-2xl tracking-wide min-h-[3rem] flex items-center justify-center transition-transform ${shake ? "animate-shake" : ""}`}
                >
                    {typedWord ? renderTypedWord() : <span className="opacity-50">Type here...</span>}
                </div>
            )}


            <div className="absolute bottom-0 left-0 w-full flex flex-col items-center justify-end ">
                <img
                    src="/players.svg"
                    alt="Players tugging rope"
                    className={`object-contain transition-transform duration-500 m-[-50px] z-[-1]  `}
                    style={{ transform: `translateX(${gameState.rope_position * 30 || 0}px)` }}
                />
                <img src="/grass.svg" alt="Grass" className="w-full object-cover pointer-events-none" />
            </div>


            {gameFinished && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
                    <div className="p-4 rounded-lg backdrop-blur-md bg-[#2B5754]/50 border border-[#2B5754]/70 shadow-lg  text-center max-w-md w-full flex items-center flex-col">
                        <h1 className="text-4xl font-extrabold mb-4 text-white">🎉 Winner! 🎉</h1>
                        <p className="text-xl font-semibold text-white break-all mb-2">
                            {gameFinished.player_id === account?.address ? "You" : gameFinished.player_id}
                        </p>
                        <p className="text-2xl font-bold text-green-400">Score: {gameFinished.score}</p>
                        <motion.div whileHover={{ scale: 1.05 }}>

                            <img src="/exit.svg" alt="exit" className="cursor-pointer z-20" onClick={handleLobby}
                            />

                        </motion.div>
                    </div>



                </div>
            )}
        </main>
    );
}
