"use client";
import { useEffect } from "react";
import { motion } from "framer-motion";
import "@suiet/wallet-kit/style.css";
import { ConnectButton, useWallet } from "@suiet/wallet-kit";
import { useWalletStore } from "./store/useWalletStore";
import { useRouter } from "next/navigation";
import { floatVariants } from "./utils";


export default function HomePage() {
  const { connected, account } = useWallet();
  const setWalletAddress = useWalletStore((state) => state.setAddress);
  const walletAddress = useWalletStore((state) => state.address);
  const router = useRouter();



  useEffect(() => {
    if (connected && account) {
      setWalletAddress(account.address);
      router.push("/lobby");
    }
  }, [connected, account, setWalletAddress]);

  if (walletAddress) {
    return
  }

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen space-y-5">
      <motion.img
        src="/rope.svg"
        alt="Rope"
        className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl z-0"
        initial={{ opacity: 0.8 }}
        animate={{ opacity: 1 }}
      />

      <div className="relative flex space-x-4 z-10">
        <motion.img
          src="/tug.svg"
          alt="Tug"
          variants={floatVariants}
          animate="float"
          whileHover="hover"
        />
        <motion.img
          src="/of.svg"
          alt="Of"
          variants={floatVariants}
          animate="float"
          whileHover="hover"
          transition={{ delay: 0.2 }}
        />
        <motion.img
          src="/keys.svg"
          alt="Keys"
          variants={floatVariants}
          animate="float"
          whileHover="hover"
          transition={{ delay: 0.4 }}
        />
      </div>

      <motion.div whileHover={{ scale: 1.05 }}>
        <ConnectButton
          className="w-10"
          style={{
            backgroundColor: "transparent",
            border: "none",
            padding: 0,
            display: "inline-block",
            lineHeight: 0,
            width: "auto",
          }}
        >
          <img src="/connect.png" alt="connect" className="cursor-pointer z-20" />
        </ConnectButton>
      </motion.div>
    </main>
  );
}
