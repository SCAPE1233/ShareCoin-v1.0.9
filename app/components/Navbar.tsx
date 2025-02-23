"use client";

import React from "react";
import Link from "next/link";
import { useWeb3 } from "../context/Web3Context";

export default function Navbar() {
  const { account, network, connectWallet, reconnectWallet, disconnectWallet, switchNetwork } = useWeb3();

  return (
    <nav className="w-full bg-black text-white p-4 flex justify-between items-center">
      {/* Left - Logo */}
      <div className="flex items-center space-x-4">
        <img src="/Share.png" alt="Share Logo" className="h-14 w-14" />
        <h1 className="text-4xl font-bold">ShareX Dapp</h1>
      </div>

      {/* Center - Navigation Links */}
      <div className="flex items-center space-x-12 px-10 py-2">
        <Link href="/" className="hover:text-gray-400 text-3xl">Home</Link>
        <Link href="/trade" className="hover:text-gray-400 text-3xl">Trade</Link>
        <Link href="/stake" className="hover:text-gray-400 text-3xl">Stake</Link>
        <Link href="/accounts" className="hover:text-gray-400 text-3xl">Account</Link>
      </div>

      {/* Right - Wallet & Network */}
      <div className="flex items-center space-x-6">
        <span className="px-10 py-3 bg-gray-700 rounded-lg text-2xl font-bold">
          {network}
        </span>
        {account ? (
          <>
            <span className="text-green-400 text-2xl font-bold">
              {account.slice(0, 6)}...{account.slice(-4)}
            </span>
            <button
              onClick={disconnectWallet}
              className="bg-red-600 px-12 py-3 rounded-md text-2xl font-bold hover:bg-red-700"
            >
              Disconnect
            </button>
          </>
        ) : (
          <>
            <button
              onClick={connectWallet}
              className="bg-blue-600 px-12 py-3 rounded-md text-2xl font-bold hover:bg-blue-700"
            >
              Connect Wallet
            </button>
            <button
              onClick={() => {
                reconnectWallet();
                window.location.reload();
              }}
              className="bg-yellow-600 px-12 py-3 rounded-md text-2xl font-bold hover:bg-yellow-700"
            >
              Reconnect
            </button>
          </>
        )}
        {/* Switch Network */}
        <button
          onClick={() => switchNetwork(network === "PulseChain Mainnet" ? "0x3AF" : "0x171")}
          className="bg-purple-600 px-12 py-4 rounded-md text-2xl font-bold hover:bg-purple-700"
        >
          {network === "PulseChain Mainnet" ? "Switch to Testnet" : "Switch to Mainnet"}
        </button>
      </div>
    </nav>
  );
}
