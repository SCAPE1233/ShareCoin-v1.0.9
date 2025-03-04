"use client";

import React from "react";
import { useWeb3 } from "../context/Web3Context";

export default function Navbar() {
  const {
    account,
    network,
    connectWallet,
    reconnectWallet,
    disconnectWallet,
    switchNetwork
  } = useWeb3();

  const isPulseChain = (network === "PulseChain Mainnet");

  return (
    <nav className="w-full bg-black text-white p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full">
        
        {/* ===== SECTION 1: LOGO + TITLE ===== */}
        <div className="order-1 md:order-1 flex items-center space-x-3 mb-2 md:mb-0">
          {/* Logo sizes: moderate on phone, a bit bigger on desktop */}
          <img
            src="/Share.png"
            alt="Share Logo"
            className="h-16 w-16 md:h-20 md:w-20"
          />
          {/* ShareCoin: bigger on phone (4xl), smaller (2xl) on desktop */}
          <h1 className="font-bold leading-none text-4xl md:text-3xl">
            ShareCoin
          </h1>
        </div>

        {/* ===== SECTION 2: ACCOUNT ===== */}
        <div 
          className="order-2 md:order-1 mb-2 md:mb-0 md:ml-4
                     text-sm md:text-lg font-bold text-[#05f729]"
        >
          {account ? (
            <span>{account}</span>
          ) : (
            <span className="text-gray-400">Not connected</span>
          )}
        </div>

        {/* ===== SECTION 3: NETWORK LABEL ===== */}
        <div className="order-3 md:order-2 mb-2 md:mb-0 flex justify-center">
          <span
            className={`
              px-2 py-1 rounded-lg font-bold
              text-base md:text-xl
              ${isPulseChain ? "text-[#f78e05]" : "text-red-500"}
            `}
          >
            {network}
          </span>
        </div>

        {/* ===== SECTION 4: CONNECT BUTTONS ===== */}
        <div 
          className="order-4 md:order-3 flex space-x-2 mt-2 md:mt-0"
        >
          {!account && (
            <>
              <button
                onClick={connectWallet}
                className="bg-blue-600 hover:bg-blue-700 
                           px-3 py-1 md:px-4 md:py-2 
                           rounded text-sm md:text-base font-bold"
              >
                Connect Wallet
              </button>
              <button
                onClick={() => {
                  reconnectWallet();
                  window.location.reload();
                }}
                className="bg-yellow-600 hover:bg-yellow-700 
                           px-3 py-1 md:px-4 md:py-2 
                           rounded text-sm md:text-base font-bold"
              >
                Reconnect
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
