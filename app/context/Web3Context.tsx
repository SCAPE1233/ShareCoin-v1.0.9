"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import Web3 from "web3";

interface Web3ContextProps {
  account: string | null;
  network: string;
  connectWallet: () => Promise<void>;
  reconnectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (chainId: string) => Promise<void>;
}

const Web3Context = createContext<Web3ContextProps | undefined>(undefined);

const RPC_URL_MAINNET = process.env.NEXT_PUBLIC_RPC_URL_MAINNET || "https://rpc.pulsechain.com";
const RPC_URL_TESTNET = process.env.NEXT_PUBLIC_RPC_URL_TESTNET || "https://rpc.v4.testnet.pulsechain.com";
const CHAIN_ID_MAINNET = (process.env.NEXT_PUBLIC_CHAIN_ID_MAINNET || "0x171").toLowerCase();
const CHAIN_ID_TESTNET = (process.env.NEXT_PUBLIC_CHAIN_ID_TESTNET || "0x3af").toLowerCase();

export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [network, setNetwork] = useState<string>("Unknown");

  useEffect(() => {
    const savedAccount = localStorage.getItem("walletAddress");
    if (savedAccount) {
      reconnectWallet();
    }
  }, []);

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

  const handleChainChanged = (chainId: string) => {
    detectNetwork(chainId);
    // Removed window.location.reload() to prevent forced reload issues.
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      localStorage.setItem("walletAddress", accounts[0]);
    } else {
      disconnectWallet();
    }
  };

  const detectNetwork = (chainId?: string) => {
    if (!chainId) return setNetwork("Unknown Network");
    const cId = chainId.toLowerCase();

    if (cId === CHAIN_ID_MAINNET) {
      setNetwork("PulseChain Mainnet");
    } else if (cId === CHAIN_ID_TESTNET) {
      setNetwork("PulseChain Testnet v4");
    } else {
      setNetwork("Unknown Network");
    }
  };

  const connectWallet = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const web3Instance = new Web3(window.ethereum);
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        if (accounts.length > 0) {
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

  const reconnectWallet = async () => {
    const savedAccount = localStorage.getItem("walletAddress");
    if (!savedAccount) return;
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const web3Instance = new Web3(window.ethereum);
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
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

  const switchNetwork = async (chainId: string) => {
    if (!window.ethereum) {
      alert("❌ MetaMask not found!");
      return;
    }
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId }],
      });
      console.log(`✅ Switched to ${chainId === CHAIN_ID_MAINNET ? "Mainnet" : "Testnet"}`);
    } catch (error: any) {
      if (error.code === 4902) {
        if (chainId.toLowerCase() === CHAIN_ID_TESTNET) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: CHAIN_ID_TESTNET,
                chainName: "PulseChain Testnet v4",
                nativeCurrency: { name: "tPLS", symbol: "tPLS", decimals: 18 },
                rpcUrls: [RPC_URL_TESTNET],
                blockExplorerUrls: ["https://scan.v4.testnet.pulsechain.com"],
              }],
            });
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: CHAIN_ID_TESTNET }],
            });
            console.log("✅ Network added & switched to Testnet v4!");
          } catch (addError) {
            console.error("🚨 Error adding PulseChain Testnet v4:", addError);
          }
        } else {
          alert("⚠️ Network not recognized. Please add it manually in MetaMask.");
        }
      } else {
        console.error("🚨 Error switching networks:", error);
      }
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setWeb3(null);
    localStorage.removeItem("walletAddress");
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

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) throw new Error("useWeb3 must be used within a Web3Provider");
  return context;
}
