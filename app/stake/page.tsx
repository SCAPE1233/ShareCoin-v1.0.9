"use client";

import React, { useState, useEffect } from "react";
import {
  BrowserProvider,
  Contract,
  parseEther,
  formatEther
} from "ethers";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import stakingArtifact from "../constants/ShareCoinStaking.json";
import ERC20_ABI from "@/constants/ERC20ABI"; 

// The staking contract's ABI
const stakingABI = stakingArtifact.abi;

// --- Config / addresses ---
const STAKING_CONTRACT_ADDRESS = "0x603911C19EECCEE369fb6911EE476e4E03ed0445";
const STAKING_TOKEN_ADDRESS    = "0xB6710FEED1c139C8e40cB73499e2e20E25EBE284";  // e.g. SHR
const REWARD_TOKEN_ADDRESS     = "0x826e4e896CC2f5B371Cd7Bb0bd929DB3e3DB67c0";   // e.g. tDAI

// A local default for calculating "expected reward"
const defaultRewardRate = 115740000n; // example

// Refresh interval in ms
const AUTO_REFRESH_INTERVAL = 30_000; // 30 seconds

export default function AdvancedStakingPage() {
  // 1) Basic connection states
  const [provider, setProvider]   = useState<BrowserProvider|null>(null);
  const [account, setAccount]     = useState("");
  const [isOwner, setIsOwner]     = useState(false);

  // 2) Stake/Unstake input
  const [stakeAmount, setStakeAmount] = useState("");
  const [stakeDuration, setStakeDuration] = useState(""); // local estimate, in days

  // 3) Displayed data
  const [userBalance, setUserBalance]       = useState("0"); // user staking token balance
  const [allowance, setAllowance]          = useState("0"); // how much user has approved staking contract
  const [stakedBalance, setStakedBalance]  = useState("0"); // how many tokens staked
  const [rewardEarned, setRewardEarned]    = useState("0"); // on-chain "earned"
  const [rewardRateOnChain, setRewardRateOnChain] = useState("0");
  const [rewardTokenBalance, setRewardTokenBalance] = useState("0");

  // 4) Transaction status messages
  const [txStatus, setTxStatus] = useState<string|null>(null);

  // 5) Local staking history
  const [stakingHistory, setStakingHistory] = useState<
    { action: "stake" | "withdraw" | "claim"; amount: string; timestamp: number; expectedReward?: string }[]
  >([]);

  // 6) New reward rate (owner-only UI)
  const [newRewardRate, setNewRewardRate] = useState("");

  // 7) Timers
  let autoRefreshTimer: NodeJS.Timeout|undefined;

  // ------------------------------------------------------------------------
  // Connect to MetaMask on mount
  // ------------------------------------------------------------------------
  useEffect(() => {
    async function connectMetamask() {
      if ((window as any).ethereum) {
        try {
          const tmpProvider = new BrowserProvider((window as any).ethereum);
          const accounts = await tmpProvider.send("eth_requestAccounts", []);
          setProvider(tmpProvider);

          if (accounts.length > 0) {
            setAccount(accounts[0]);
            toast.success(`Connected: ${accounts[0]}`);
          }
        } catch (err) {
          toast.error("MetaMask connect error");
          console.error(err);
        }
      } else {
        toast.error("Please install MetaMask extension.");
      }
    }
    connectMetamask();
  }, []);

  // ------------------------------------------------------------------------
  // Auto-refresh logic: fetch data every 30 seconds
  // ------------------------------------------------------------------------
  useEffect(() => {
    autoRefreshTimer = setInterval(() => {
      refreshAllData();
    }, AUTO_REFRESH_INTERVAL);
    return () => {
      if (autoRefreshTimer) clearInterval(autoRefreshTimer);
    };
  }, [provider, account]);

  function refreshAllData() {
    if (!provider || !account) return;
    fetchUserData();
    fetchContractData();
  }

  // ------------------------------------------------------------------------
  //  Fetch user data: allowance, userBalance, stakedBalance, reward
  // ------------------------------------------------------------------------
  async function fetchUserData() {
    if (!provider || !account) return;
    try {
      const stakingToken = new Contract(STAKING_TOKEN_ADDRESS, ERC20_ABI, provider);
      const stakingContract = new Contract(STAKING_CONTRACT_ADDRESS, stakingABI, provider);

      // 1) user’s balance
      const bal = await stakingToken.balanceOf(account);
      setUserBalance(formatEther(bal));

      // 2) allowance
      const allow = await stakingToken.allowance(account, STAKING_CONTRACT_ADDRESS);
      setAllowance(formatEther(allow));

      // 3) stakedBalance
      const stakedBn = await stakingContract.balanceOf(account);
      setStakedBalance(formatEther(stakedBn));

      // 4) earned
      const earnedBn = await stakingContract.earned(account);
      setRewardEarned(formatEther(earnedBn));
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  }

  // ------------------------------------------------------------------------
  //  Fetch contract-level data: rewardRate, rewardTokenBalance, owner
  // ------------------------------------------------------------------------
  async function fetchContractData() {
    if (!provider) return;
    try {
      const stakingContract = new Contract(STAKING_CONTRACT_ADDRESS, stakingABI, provider);
      const rewardToken     = new Contract(REWARD_TOKEN_ADDRESS, ERC20_ABI, provider);

      // rewardRate
      const rr = await stakingContract.rewardRate();
      setRewardRateOnChain(rr.toString());

      // reward token balance in the contract
      const contractRewardBal = await rewardToken.balanceOf(STAKING_CONTRACT_ADDRESS);
      setRewardTokenBalance(formatEther(contractRewardBal));

      // check if current user is owner
      if (account) {
        const contractOwner = await stakingContract.owner();
        setIsOwner(contractOwner.toLowerCase() === account.toLowerCase());
      }
    } catch (err) {
      console.error("Error fetching contract data:", err);
    }
  }

  // ------------------------------------------------------------------------
  // Whenever the provider/account changes or txStatus changes, fetch data
  // ------------------------------------------------------------------------
  useEffect(() => {
    refreshAllData();
  }, [provider, account, txStatus]);

  // ------------------------------------------------------------------------
  // Local "expected reward" calculation 
  // ------------------------------------------------------------------------
  function calculateExpectedReward() {
    if (!stakeAmount || !stakeDuration) return "0";
    try {
      const amountWei = parseEther(stakeAmount);
      const daysFloat = parseFloat(stakeDuration);
      if (isNaN(daysFloat)) return "0";

      const durationSec = BigInt(Math.floor(daysFloat * 86400));
      const oneEther    = 1_000_000_000_000_000_000n;

      const numerator = amountWei * defaultRewardRate * durationSec;
      const expected  = numerator / oneEther;

      return formatEther(expected);
    } catch (err) {
      console.error("Error in expected reward calc:", err);
      return "0";
    }
  }

  // ------------------------------------------------------------------------
  // Approve + Stake
  // ------------------------------------------------------------------------
  async function stakeTokens() {
    if (!provider || !account || !stakeAmount) return;
    try {
      const signer = await provider.getSigner();
      const stakingToken = new Contract(STAKING_TOKEN_ADDRESS, ERC20_ABI, signer);
      const stakingContract = new Contract(STAKING_CONTRACT_ADDRESS, stakingABI, signer);

      const amountWei = parseEther(stakeAmount);

      setTxStatus("Approving...");
      let tx = await stakingToken.approve(STAKING_CONTRACT_ADDRESS, amountWei);
      await tx.wait();

      setTxStatus("Staking transaction pending...");
      tx = await stakingContract.stakeTokens(amountWei);
      await tx.wait();

      setTxStatus("Stake successful!");
      toast.success("Staked successfully!");
      setStakingHistory((prev) => [
        ...prev,
        {
          action: "stake",
          amount: stakeAmount,
          timestamp: Date.now(),
          expectedReward: calculateExpectedReward(),
        },
      ]);
    } catch (err) {
      console.error("Error staking:", err);
      toast.error("Staking failed.");
      setTxStatus("Staking error");
    }
  }

  // ------------------------------------------------------------------------
  // Unstake
  // ------------------------------------------------------------------------
  async function withdrawTokens() {
    if (!provider || !account || !stakeAmount) return;
    try {
      const signer = await provider.getSigner();
      const stakingContract = new Contract(STAKING_CONTRACT_ADDRESS, stakingABI, signer);

      const amountWei = parseEther(stakeAmount);
      setTxStatus("Unstake transaction pending...");
      const tx = await stakingContract.unstakeTokens(amountWei);
      await tx.wait();

      setTxStatus("Unstake successful!");
      toast.success("Unstake successful!");
      setStakingHistory((prev) => [
        ...prev,
        {
          action: "withdraw",
          amount: stakeAmount,
          timestamp: Date.now(),
        },
      ]);
    } catch (err) {
      console.error("Error withdrawing tokens:", err);
      toast.error("Withdraw failed");
      setTxStatus("Withdraw error");
    }
  }

  // ------------------------------------------------------------------------
  // Claim
  // ------------------------------------------------------------------------
  async function claimReward() {
    if (!provider || !account) return;
    try {
      const signer = await provider.getSigner();
      const stakingContract = new Contract(STAKING_CONTRACT_ADDRESS, stakingABI, signer);

      setTxStatus("Claim transaction pending...");
      const tx = await stakingContract.claimReward();
      await tx.wait();

      setTxStatus("Reward claimed!");
      toast.success("Reward claimed successfully!");
      setStakingHistory((prev) => [
        ...prev,
        { action: "claim", amount: "0", timestamp: Date.now() },
      ]);
    } catch (err) {
      console.error("Error claiming reward:", err);
      toast.error("Claim failed");
      setTxStatus("Claim error");
    }
  }

  // ------------------------------------------------------------------------
  // Update reward rate (owner only)
  // ------------------------------------------------------------------------
  async function handleUpdateRewardRate() {
    if (!provider) {
      toast.error("No provider. Please connect wallet.");
      return;
    }
    if (!newRewardRate) {
      toast.error("Enter a reward rate");
      return;
    }
    try {
      const signer = await provider.getSigner();
      const stakingContract = new Contract(STAKING_CONTRACT_ADDRESS, stakingABI, signer);

      toast.info("Updating reward rate...");
      const tx = await stakingContract.updateRewardRate(newRewardRate);
      await tx.wait();

      toast.success("Reward rate updated!");
      setNewRewardRate("");
      setTxStatus("Reward rate updated");
    } catch (error) {
      console.error("Error updating reward rate:", error);
      toast.error("Failed to update reward rate");
    }
  }

  // ------------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------------
  return (
    // Dark yellow text as default, black background
    <div className="p-6 bg-black min-h-screen text-xl text-yellow-600">
      <ToastContainer position="bottom-right" theme="dark" />

      <h1 className="text-5xl font-bold mb-6 text-center">
        ShareCoin Staking App
      </h1>

      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Connection + Basic Info */}
        <div className="bg-black p-6 rounded-lg">
          <p className="mb-2">
            <strong>Connected Account: </strong>
            <span className="text-green-400">
              {account || "Not connected"}
            </span>
          </p>
          <p>
            <strong>Your Token Balance: </strong>
            <span className="text-green-400">{userBalance}</span>
            {" "}staking tokens
          </p>
          <p>
            <strong>Allowance: </strong>
            <span className="text-green-400">{allowance}</span>
            {" "} (already approved to stake)
          </p>
          <p>
            <strong>Staked Balance: </strong>
            <span className="text-green-400">{stakedBalance}</span>
          </p>
          <p>
            <strong>Reward Earned: </strong>
            <span className="text-green-400">{rewardEarned}</span>
          </p>
        </div>

        {/* Contract data */}
        <div className="bg-black p-10 rounded-lg">
          <h3 className="text-3xl font-bold mb-6">Contract Info</h3>
          <p>
            <strong>On-Chain Reward Rate: </strong>
            <span className="text-green-400">{rewardRateOnChain}</span>
            {" "}
            <em>(scaled by 1e18)</em>
          </p>
          <p>
            <strong>Reward Token Balance in Contract: </strong>
            <span className="text-green-400">{rewardTokenBalance}</span>
          </p>
          <p>
            <strong>Local defaultRewardRate: </strong>
            <span className="text-green-400">{defaultRewardRate.toString()}</span>
          </p>
        </div>

        {/* Stake Form */}
        <div className="bg-black p-4 rounded-lg space-y-4">
          <h3 className="text-3xl font-bold mb-2">Stake / Unstake / Claim</h3>
          
          <label className="block mb-1">Amount to stake/unstake (in tokens)</label>
          <input
            type="text"
            className="w-full p-4 rounded-md text-black"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
          />
          
          <label className="block mt-4 mb-1">Duration (days) - for local estimate</label>
          <input
            type="text"
            className="w-full p-4 rounded-md text-black"
            value={stakeDuration}
            onChange={(e) => setStakeDuration(e.target.value)}
          />

          <div className="flex flex-col space-y-4 md:flex-row md:space-x-6 md:space-y-0 mt-4">
            <button
              className="bg-blue-600 px-10 py-6 rounded text-white font-bold text-3xl"
              onClick={stakeTokens}
            >
              Approve + Stake
            </button>
            <button
              className="bg-red-600 px-10 py-6 rounded text-white font-bold text-3xl"
              onClick={withdrawTokens}
            >
              Unstake
            </button>
            <button
              className="bg-green-600 px-10 py-6 rounded text-white font-bold text-3xl"
              onClick={claimReward}
            >
              Claim Rewards
            </button>
          </div>

          {txStatus && (
            <p className="mt-2 text-green-400 text-2xl" >
              <strong>Status:</strong> {txStatus}
            </p>
          )}

          <div className="bg-black p-2 rounded-md text-base mt-4 text-2xl">
            <p>
              <strong>Expected Reward:</strong>{" "}
              <span className="text-green-400 text-4xl">{calculateExpectedReward()}</span>
              {" "} (tokens)
              <br />
              <em>Based on local "defaultRewardRate" only.</em>
            </p>
          </div>
        </div>

        {/* Staking History */}
        <div className="bg-black p-4 rounded-lg text-2xl">
          <h3 className="text-4xl font-bold mb-2">Staking History (Local Log)</h3>
          {stakingHistory.length === 0 ? (
            <p>No activity yet.</p>
          ) : (
            <table className="w-full text-base text-2xl">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-2 py-1">Action</th>
                  <th className="px-2 py-1">Amount</th>
                  <th className="px-2 py-1">Expected Reward</th>
                  <th className="px-2 py-1">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {stakingHistory.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-700">
                    <td className="px-2 py-1 text-green-400">{item.action}</td>
                    <td className="px-2 py-1 text-green-400">{item.amount}</td>
                    <td className="px-2 py-1 text-green-400">
                      {item.expectedReward || "-"}
                    </td>
                    <td className="px-2 py-1 text-green-400 text-2xl">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Owner Panel for updateRewardRate */}
        {isOwner && (
          <div className="bg-black p-6 rounded-lg">
            <h3 className="text-3xl font-bold mb-2">Owner Panel</h3>
            <p>Set a new on-chain reward rate (scaled by 1e18):</p>
            <input
              type="text"
              placeholder="e.g. 115740000"
              className="w-full p-8 rounded-md text-black mt-2"
              value={newRewardRate}
              onChange={(e) => setNewRewardRate(e.target.value)}
            />
            <button
              className="mt-2 bg-purple-600 px-8 py-2 rounded text-white font-bold"
              onClick={handleUpdateRewardRate}
            >
              Update Reward Rate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
