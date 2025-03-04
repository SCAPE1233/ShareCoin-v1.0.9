"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import Web3 from "web3";

/** 
 * 1) Interface describing what we expose in our Context
 */
interface Web3ContextProps {
  account: string | null;
  network: string;
  connectWallet: () => Promise<void>;
  reconnectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (chainId: string) => Promise<void>;
}

/** 
 * 2) Create the Context
 */
const Web3Context = createContext<Web3ContextProps | undefined>(undefined);

/** 
 * 3) Constants for PulseChain Mainnet
 */
const RPC_URL_MAINNET = process.env.NEXT_PUBLIC_RPC_URL_MAINNET || "https://pulsechain-rpc.publicnode.com";
const CHAIN_ID_MAINNET = (process.env.NEXT_PUBLIC_CHAIN_ID_MAINNET || "0x171").toLowerCase();
/*
// If you ever want testnet back, uncomment & set properly:
const RPC_URL_TESTNET = process.env.NEXT_PUBLIC_RPC_URL_TESTNET || "https://rpc.v4.testnet.pulsechain.com";
const CHAIN_ID_TESTNET = (process.env.NEXT_PUBLIC_CHAIN_ID_TESTNET || "0x2b64").toLowerCase();
*/

/** 
 * 4) The Provider
 */
export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [network, setNetwork] = useState<string>("Unknown");

  /**
   * 4A) Attempt auto-reconnect on mount if we have a saved address
   */
  useEffect(() => {
    const savedAccount = localStorage.getItem("walletAddress");
    if (savedAccount) {
      reconnectWallet();
    }
  }, []);

  /**
   * 4B) Register chain/account listeners (only if window.ethereum exists)
   */
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("chainChanged", handleChainChanged);
      window.ethereum.on("accountsChanged", handleAccountsChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener("chainChanged", handleChainChanged);
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        }
      };
    }
  }, []);

  /**
   * 5) Helpers: handle chain/account changes
   */
  const handleChainChanged = (chainId: string) => {
    detectNetwork(chainId);
    // We no longer do window.location.reload() here
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      localStorage.setItem("walletAddress", accounts[0]);
    } else {
      disconnectWallet();
    }
  };

  /**
   * 6) detectNetwork
   * If chainId matches mainnet, set "PulseChain Mainnet," else "Unknown"
   */
  const detectNetwork = (chainId?: string) => {
    if (!chainId) {
      setNetwork("Unknown Network");
      return;
    }
    const cId = chainId.toLowerCase();
    if (cId === CHAIN_ID_MAINNET) {
      setNetwork("PulseChain Mainnet");
    } else {
      setNetwork("Unknown Network");
    }
  };

  /**
   * 7) connectWallet
   * Requests user to connect via Metamask
   */
  const connectWallet = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const web3Instance = new Web3(window.ethereum);
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          setWeb3(web3Instance);
          localStorage.setItem("walletAddress", accounts[0]);

          const chainId = (await window.ethereum.request({ method: "eth_chainId" })) as string;
          detectNetwork(chainId);
        }
      } catch (error) {
        console.error("🚨 MetaMask connection error:", error);
      }
    } else {
      console.error("❌ MetaMask not found! Please install it.");
    }
  };

  /**
   * 8) reconnectWallet
   * Check if we still have a valid account
   */
  const reconnectWallet = async () => {
    const savedAccount = localStorage.getItem("walletAddress");
    if (!savedAccount) return;
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const web3Instance = new Web3(window.ethereum);
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          setWeb3(web3Instance);

          const chainId = (await window.ethereum.request({ method: "eth_chainId" })) as string;
          detectNetwork(chainId);
        } else {
          disconnectWallet();
        }
      } catch (error) {
        console.error("🚨 Reconnection error:", error);
      }
    }
  };

  /**
   * 9) switchNetwork
   * Attempt to switch to the chainId provided. If not installed, try adding it.
   */
  const switchNetwork = async (chainId: string) => {
    if (!window.ethereum) {
      alert("❌ MetaMask not found!");
      return;
    }
    try {
      // 9A) Try switching first
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId }],
      });
      console.log(`✅ Switched to ${chainId === CHAIN_ID_MAINNET ? "PulseChain Mainnet" : "Unknown"}`);
    } catch (error: any) {
      // 9B) If chain isn't known, add it if it's mainnet
      if (error.code === 4902) {
        if (chainId.toLowerCase() === CHAIN_ID_MAINNET) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: CHAIN_ID_MAINNET,
                  chainName: "PulseChain Mainnet",
                  nativeCurrency: { name: "PLS", symbol: "PLS", decimals: 18 },
                  rpcUrls: [RPC_URL_MAINNET],
                  blockExplorerUrls: ["https://scan.mypinata.cloud/ipfs/bafybeih3olry3is4e4lzm7rus5l3h6zrphcal5a7ayfkhzm5oivjro2cp4/#/"], // or your explorer
                },
              ],
            });
            // Switch after adding
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: CHAIN_ID_MAINNET }],
            });
            console.log("✅ Network added & switched to Mainnet!");
          } catch (addError) {
            console.error("🚨 Error adding PulseChain Mainnet:", addError);
          }
        } else {
          alert("⚠️ Network not recognized. Please add it manually in MetaMask.");
        }
      } else {
        console.error("🚨 Error switching networks:", error);
      }
    }
  };

  /**
   * 10) disconnectWallet
   * Clears local data and resets states
   */
  const disconnectWallet = () => {
    setAccount(null);
    setWeb3(null);
    localStorage.removeItem("walletAddress");
    setNetwork("Unknown Network");
    console.log("🔌 Wallet Disconnected");
  };

  return (
    <Web3Context.Provider
      value={{
        account,
        network,
        connectWallet,
        reconnectWallet,
        disconnectWallet,
        switchNetwork,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

/**
 * 11) useWeb3
 * Hook to consume this context in any component
 */
export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}
