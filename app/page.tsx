"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { ERC20_ABI, SHARECOIN_ADDRESS, SHARECOIN_ABI } from "@/lib/constants";
import { PAYMENT_TOKEN_ADDRESS } from "@/lib/config";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import AddShareCoinButton from "./components/AddShareCoinButton";
import AverageBlockTime from "./components/AverageBlockTime";
import FlickerHashRate from "./components/FlickerHashRate";

/** === 1) Enums & Helpers === **/
enum PlanType {
  None = 0,
  Basic = 1,
  Standard = 2,
  Premium = 3,
  Lifetime = 4,
}

function getPlanName(plan: PlanType): string {
  switch (plan) {
    case PlanType.Basic:
      return "Basic";
    case PlanType.Standard:
      return "Standard";
    case PlanType.Premium:
      return "Premium";
    case PlanType.Lifetime:
      return "Lifetime";
    default:
      return "None";
  }
}

function getDailyRate(plan: PlanType): number {
  switch (plan) {
    case PlanType.Basic:
      return 20;
    case PlanType.Standard:
      return 40;
    case PlanType.Premium:
      return 60;
    default:
      return 0;
  }
}

function formatTimeLeft(seconds: number): string {
  if (seconds <= 0) return "Expired";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 && d === 0) parts.push(`${s}s`);

  return parts.join(" ") || "Expired";
}

/** === 2) Constants === **/
// For lifetime subscription, note: this value is used in the front end calculations,
// but the actual cost is hardcoded in your contract. They must match.
const lifetimePrice = 8000;
const durationOptions = [
  { label: "3 days", value: 3 },
  { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];
// This base URL includes one "/api", so calls will become, e.g.,
// https://sharecoinmining.com/api/minerStats
const MINING_SERVER_URL = "https://sharecoinmining.com/api";
const MAX_SHARECOIN_SUPPLY = 21_000_000; // for demonstration

/** === Main Page Component === **/
export default function Page() {
  /************************************************
   *  A) On-Chain Subscription State
   ***********************************************/
  const [account, setAccount] = useState("");
  const [userBalance, setUserBalance] = useState("0");
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [userPlanEnum, setUserPlanEnum] = useState<PlanType>(PlanType.None);
  const [expiryTimestamp, setExpiryTimestamp] = useState<number>(0);
  const [timeLeftDisplay, setTimeLeftDisplay] = useState("...");

  const [selectedPlan, setSelectedPlan] = useState<PlanType>(PlanType.Basic);
  const [selectedDuration, setSelectedDuration] = useState<number>(3);
  const [computedPrice, setComputedPrice] = useState("0");
  const [statusMessage, setStatusMessage] = useState("");

  // On-chain stats
  const [onChainBlockCount, setOnChainBlockCount] = useState(0);

  // “Network Stats”
  const [networkHashRate, setNetworkHashRate] = useState("0 MH/s");
  const [averageBlockTime, setAverageBlockTime] = useState("N/A");

  /************************************************
   *  B) Server-Based Mining
   ***********************************************/
  const [minerActive, setMinerActive] = useState(false);
  const [minerPlan, setMinerPlan] = useState<PlanType>(PlanType.None);
  const [hashAttempts, setHashAttempts] = useState(0);
  const [hashRate, setHashRate] = useState(0);
  const [pendingBlocks, setPendingBlocks] = useState<any[]>([]);
  const [isMinting, setIsMinting] = useState(false);

  /************************************************
   *  Contract Totals (Minted / Left to Mine)
   ***********************************************/
  const [contractMinted, setContractMinted] = useState("0");
  const [remainingToMine, setRemainingToMine] = useState("0");

  /************************************************
   *  NEW: Owner Check State
   ***********************************************/
  const [isOwner, setIsOwner] = useState(false);

  /************************************************
   *  C) Connect MetaMask on Mount
   ***********************************************/
  useEffect(() => {
    async function connectMetamask() {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        try {
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          const accounts = await provider.send("eth_requestAccounts", []);
          if (accounts && accounts.length > 0) {
            setAccount(accounts[0]);
            toast.success(`Connected: ${accounts[0]}`);
          }
        } catch (error) {
          toast.error("MetaMask connect error");
          console.error(error);
        }
      } else {
        toast.error("Please install MetaMask extension.");
      }
    }
    connectMetamask();
  }, []);

  /************************************************
   *  NEW: Check if the connected account is the owner
   ***********************************************/
  useEffect(() => {
    async function checkOwner() {
      if (!account) return;
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const shareCoin = new ethers.Contract(SHARECOIN_ADDRESS, SHARECOIN_ABI, provider);
        const ownerAddress = await shareCoin.owner();
        setIsOwner(account.toLowerCase() === ownerAddress.toLowerCase());
      } catch (error) {
        console.error("Error checking owner:", error);
      }
    }
    checkOwner();
  }, [account]);

  /************************************************
   *  D) Load On-Chain Subscription Info
   ***********************************************/
  async function loadSubscriptionInfo() {
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const shareCoin = new ethers.Contract(SHARECOIN_ADDRESS, SHARECOIN_ABI, provider);

      const isActive: boolean = await shareCoin.subscriptionActiveFor(account);
      setSubscriptionActive(isActive);

      const planBN = await shareCoin.userPlan(account);
      const planNumber = Number(planBN);
      setUserPlanEnum(planNumber as PlanType);

      const expiryBN = await shareCoin.subscriptions(account);
      const expiryNum = Number(expiryBN);
      setExpiryTimestamp(expiryNum);
    } catch (err) {
      console.error("loadSubscriptionInfo error:", err);
    }
  }

  // On mount or when account changes, load subscription & balances
  useEffect(() => {
    if (account) {
      loadSubscriptionInfo();
      refreshUserBalance();
      refreshOnChainBlockCount();
      refreshContractTotals();
    }
  }, [account]);

  /************************************************
   *  E) Subscription Countdown
   ***********************************************/
  useEffect(() => {
    if (!expiryTimestamp) {
      setTimeLeftDisplay("...");
      return;
    }
    // If lifetime or a silly-large timestamp
    if (userPlanEnum === PlanType.Lifetime || expiryTimestamp > 1e15) {
      setTimeLeftDisplay("Lifetime");
      return;
    }
    const timer = setInterval(() => {
      const nowSec = Math.floor(Date.now() / 1000);
      const diff = expiryTimestamp - nowSec;
      if (diff <= 0) {
        setTimeLeftDisplay("Expired");
        clearInterval(timer);
      } else {
        setTimeLeftDisplay(formatTimeLeft(diff));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [expiryTimestamp, userPlanEnum]);

  /************************************************
   *  F) Refresh User Balance
   ***********************************************/
  async function refreshUserBalance() {
    if (!account) return;
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const shareCoin = new ethers.Contract(SHARECOIN_ADDRESS, SHARECOIN_ABI, provider);
      const bal = await shareCoin.balanceOf(account);
      setUserBalance(ethers.formatEther(bal));
    } catch (err) {
      console.error("refreshUserBalance error:", err);
    }
  }

  /************************************************
   *  G) On-Chain Block Count
   ***********************************************/
  async function refreshOnChainBlockCount() {
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const shareCoin = new ethers.Contract(SHARECOIN_ADDRESS, SHARECOIN_ABI, provider);
      const lengthBN = await shareCoin.getBlockHistoryLength();
      setOnChainBlockCount(Number(lengthBN));
    } catch (err) {
      console.error("refreshOnChainBlockCount error:", err);
    }
  }

  /************************************************
   *  H) Compute Price for Subscription
   ***********************************************/
  useEffect(() => {
    function computePriceDisplay() {
      if (selectedPlan === PlanType.Lifetime) {
        setComputedPrice(lifetimePrice.toString());
      } else {
        const dailyRate = getDailyRate(selectedPlan);
        const totalPrice = dailyRate * selectedDuration;
        setComputedPrice(totalPrice.toString());
      }
    }
    computePriceDisplay();
  }, [selectedPlan, selectedDuration]);

  /************************************************
   *  I) Purchase Subscription
   ***********************************************/
  async function handleSubscribe() {
    if (!account) {
      setStatusMessage("No account connected");
      return;
    }
    setStatusMessage("Approving payment...");
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const paymentToken = new ethers.Contract(PAYMENT_TOKEN_ADDRESS, ERC20_ABI, signer);
      const shareCoin = new ethers.Contract(SHARECOIN_ADDRESS, SHARECOIN_ABI, signer);

      const finalPrice = ethers.parseEther(computedPrice);
      const approveTx = await paymentToken.approve(SHARECOIN_ADDRESS, finalPrice);
      await approveTx.wait();
      setStatusMessage("Tokens approved! Purchasing subscription...");

      if (selectedPlan === PlanType.Lifetime) {
        const tx = await shareCoin.purchaseLifetimeSubscription();
        await tx.wait();
      } else {
        const tx = await shareCoin.purchaseSubscription(selectedPlan, selectedDuration);
        await tx.wait();
      }
      toast.success("Subscription purchased successfully!");
      setStatusMessage("Subscription purchased successfully!");
      loadSubscriptionInfo();
      refreshUserBalance();
      refreshContractTotals();
    } catch (err: any) {
      console.error("handleSubscribe error:", err);
      setStatusMessage(`Error: ${err.message || err.toString()}`);
    }
  }

  /************************************************
   *  J) Poll the Node Server for Mining Stats
   ***********************************************/
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!account) return;
      try {
        const res = await fetch(`${MINING_SERVER_URL}/minerStats?userAddress=${account}`);
        const data = await res.json();
        setMinerActive(data.active);
        setMinerPlan(data.plan);
        setHashAttempts(data.hashAttempts || 0);
        setHashRate(data.hashRate || 0);
        setPendingBlocks(data.blocksFound || []);
      } catch (err) {
        console.error("Error fetching miner stats:", err);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [account]);

  /************************************************
   *  K) Start/Stop Mining (server-based)
   ***********************************************/
  async function handleStartMining() {
    if (!account) {
      toast.error("No account connected");
      return;
    }
    if (!subscriptionActive) {
      toast.error("No active subscription!");
      return;
    }
    try {
      const body = { userAddress: account, plan: Number(userPlanEnum) };
      const res = await fetch(`${MINING_SERVER_URL}/startMining`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error("Server responded with error");
      }
      toast.success("Mining started on the server!");
    } catch (err) {
      console.error("Failed to start mining:", err);
      toast.error("Failed to start mining");
    }
  }

  async function handleStopMining() {
    if (!account) {
      toast.error("No account connected");
      return;
    }
    try {
      const res = await fetch(`${MINING_SERVER_URL}/stopMining`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAddress: account }),
      });
      if (!res.ok) {
        throw new Error("Server responded with error");
      }
      toast.info("Mining stopped on the server!");
    } catch (err) {
      console.error("Failed to stop mining:", err);
      toast.error("Failed to stop mining");
    }
  }

  /************************************************
   *  L) Submit & Mint (on-chain)
   ***********************************************/
  async function handleBatchSubmit() {
    if (!pendingBlocks.length) {
      toast.info("No pending blocks to submit.");
      return;
    }
    setIsMinting(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const shareCoin = new ethers.Contract(SHARECOIN_ADDRESS, SHARECOIN_ABI, signer);
      const blockNumbers = pendingBlocks.map((b) => b.blockNumber);
      const nonces = pendingBlocks.map((b) => b.nonce);

      toast.info(`Submitting ${pendingBlocks.length} blocks...`);
      const tx = await shareCoin.submitMultipleMinedBlocksAndMint(blockNumbers, nonces);
      await tx.wait();
      toast.success("Batch blocks submitted & minted!");
      setPendingBlocks([]);

      // Clear them from the server side
      const body = { userAddress: account.toLowerCase(), blockNumbers };
      await fetch(`${MINING_SERVER_URL}/clearMinedBlocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      refreshUserBalance();
    } catch (err: any) {
      console.error("handleBatchSubmit error:", err);
      toast.error(`Batch submit failed: ${err.message || err.toString()}`);
    } finally {
      setIsMinting(false);
    }
  }

  /************************************************
   *  M) “Network” Stats
   ***********************************************/
  // 1) Poll /networkHashRate
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`${MINING_SERVER_URL}/networkHashRate`);
        const data = await res.json();
        setNetworkHashRate(`${data.networkHashRate} H/s`);
      } catch (err) {
        console.error("Failed to fetch network hash rate:", err);
      }
    }, 15000);
    return () => clearInterval(timer);
  }, [onChainBlockCount]);

  // 2) Poll local block time from /averageBlockTime
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`${MINING_SERVER_URL}/averageBlockTime`);
        const data = await res.json();
        setAverageBlockTime(data.average);
      } catch (err) {
        console.error("Failed to fetch local block time:", err);
        setAverageBlockTime("Error");
      }
    }, 15000);
    // Initial immediate fetch
    (async () => {
      try {
        const res = await fetch(`${MINING_SERVER_URL}/averageBlockTime`);
        const data = await res.json();
        setAverageBlockTime(data.average);
      } catch (err) {
        console.error("Failed to fetch local block time:", err);
        setAverageBlockTime("Error");
      }
    })();
    return () => clearInterval(timer);
  }, []);

  /************************************************
   *  N) Modal State for “How to Run Miner?”
   ***********************************************/
  const [showHelpModal, setShowHelpModal] = useState(false);

  /************************************************
   *  O) Refresh Contract Totals
   ***********************************************/
  async function refreshContractTotals() {
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const shareCoin = new ethers.Contract(SHARECOIN_ADDRESS, SHARECOIN_ABI, provider);
      const totalSupplyBN = await shareCoin.totalSupply();
      const totalSupplyFormatted = ethers.formatEther(totalSupplyBN);

      setContractMinted(totalSupplyFormatted);

      const left = MAX_SHARECOIN_SUPPLY - parseFloat(totalSupplyFormatted);
      setRemainingToMine(left <= 0 ? "0" : left.toFixed(2));
    } catch (error) {
      console.error("refreshContractTotals error:", error);
    }
  }

  /************************************************
   *  P) Owner-Only Withdraw Function
   ***********************************************/
  async function handleWithdrawFunds() {
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const shareCoin = new ethers.Contract(SHARECOIN_ADDRESS, SHARECOIN_ABI, signer);

      // 1) We can read how much DAI is in the contract if needed,
      // or just define an amount. We'll withdraw "everything" by reading contract's DAI balance:
      const paymentToken = new ethers.Contract(PAYMENT_TOKEN_ADDRESS, ERC20_ABI, provider);
      const contractBalanceBN = await paymentToken.balanceOf(SHARECOIN_ADDRESS);
      if (contractBalanceBN === 0n) {
        toast.info("No DAI to withdraw.");
        return;
      }

      // 2) Call your contract's "ownerWithdrawSubscriptionFunds"
      const tx = await shareCoin.ownerWithdrawSubscriptionFunds(contractBalanceBN);
      toast.info("Withdrawing subscription funds...");
      await tx.wait();
      toast.success("Funds withdrawn successfully!");
    } catch (err: any) {
      console.error("handleWithdrawFunds error:", err);
      toast.error("Failed to withdraw funds");
    }
  }

  /************************************************
   *  Q) Render
   ***********************************************/
  const planName = getPlanName(userPlanEnum);

  return (
    <div className="bg-black text-white min-h-screen p-4">
      {/* Page Title */}
      <h1 className="text-center text-4xl mb-6 text-[#05f729]">
        Cloud Mining Panel
      </h1>

      {/* Main Container: single column on small screens, 3 columns on md+ */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center">

        {/* === Panel 1: On-Chain Subscription Info === */}
        <div className="bg-[#111] w-full p-4 rounded shadow col-span-1">
          <h2 className="text-center text-2xl mb-4 text-[#ffc107]">
            Mining Contract & Wallet Balance
          </h2>
          <p className="text-lg mb-2">
            <span>Account: </span>
            <span className="text-[#0df705]">
              {account
                ? account.length > 30
                  ? account.slice(0, 30) + "..."
                  : account
                : "Not connected"}
            </span>
          </p>
          <p className="text-lg mb-2">
            <span>Plan: </span>
            <span className="text-[#0df705]">{planName}</span>
          </p>
          <p className="text-lg mb-2">
            <span>Contract Time Left: </span>
            <span className="text-[#0df705]">{timeLeftDisplay}</span>
          </p>
          <p className="text-lg mb-2">
            <span>Mining Contract Active: </span>
            <span className="text-[#0df705]">
              {subscriptionActive ? "Yes" : "No"}
            </span>
          </p>
          <p className="text-lg mb-2">
            <span>SHARE Balance: </span>
            <span className="text-[#0df705]">{userBalance}</span>
          </p>
          <button
            onClick={() => {
              refreshUserBalance();
              refreshContractTotals();
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded mt-2"
          >
            Refresh Balance
          </button>
          <p className="text-lg mt-3">
            <span>Share Amount Minted: </span>
            <span className="text-[#0df705]">{contractMinted}</span>
          </p>
          <p className="text-lg">
            <span>Share Left to Mine: </span>
            <span className="text-[#0df705]">{remainingToMine}</span>
          </p>
        </div>

        {/* === Panel 2: Purchase Subscription === */}
        <div className="bg-[#111] w-full p-4 rounded shadow col-span-1">
          <h2 className="text-center text-2xl mb-4 text-[#ffc107]">
            Cloud Mining Contract
          </h2>
          <p className="text-lg">Contract to Buy:</p>
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(Number(e.target.value) as PlanType)}
            className="bg-black text-white w-full p-2 rounded border border-gray-500 mt-1 mb-3"
          >
            <option value={PlanType.Basic}>Basic (500 H/s)</option>
            <option value={PlanType.Standard}>Standard (2000 H/s)</option>
            <option value={PlanType.Premium}>Premium (5000 H/s)</option>
            <option value={PlanType.Lifetime}>Lifetime (5555 H/s)</option>
          </select>
          {selectedPlan !== PlanType.Lifetime && (
            <>
              <p className="text-lg">Duration (Days):</p>
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(Number(e.target.value))}
                className="bg-black text-white w-full p-2 rounded border border-gray-500 mt-1 mb-3"
              >
                {durationOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </>
          )}
          <p className="text-lg mb-2">
            <span>Price: $ </span>
            <span className="text-[#0df705]">{computedPrice}</span>
            <span> DAI</span>
          </p>
          <button
            onClick={handleSubscribe}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mr-2"
          >
            Purchase
          </button>
          {statusMessage && (
            <p className="text-lg mt-2 text-white">{statusMessage}</p>
          )}
        </div>

        {/* === Panel 3: Server-based Mining Stats === */}
        <div className="bg-[#111] w-full p-4 rounded shadow col-span-1">
          <h2 className="text-center text-2xl mb-4 text-[#ffc107]">
            Mining Controls
          </h2>
          <p className="text-lg mb-2">
            <span>Miner Active: </span>
            <span className={minerActive ? "text-[#0df705]" : "text-red-600"}>
              {minerActive ? "Yes" : "No"}
            </span>
          </p>
          <p className="text-lg mb-2">
            <span>Network Hash Rate: </span>
            <span className="text-[#0df705]">{networkHashRate}</span>
          </p>
          <p className="text-lg mb-2">
            <span>Valid Block Attempts: </span>
            <span className="text-[#0df705]">{hashAttempts}</span>
          </p>
          {!minerActive ? (
            <button
              onClick={handleStartMining}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mr-2"
            >
              Start Mining
            </button>
          ) : (
            <button
              onClick={handleStopMining}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded mt-2"
            >
              Stop Mining
            </button>
          )}
          <h3 className="text-xl mt-4 mb-2 text-[#ffc107]">
            ShareCoin Chain Stats
          </h3>
          <p className="text-lg mb-1">
            <span>Block Height: </span>
            <span className="text-[#0df705]">{onChainBlockCount}</span>
          </p>
          <FlickerHashRate plan={userPlanEnum} minerActive={minerActive} />
          <div className="mt-4">
            <AverageBlockTime />
          </div>
          <button
            onClick={refreshOnChainBlockCount}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded mt-2"
          >
            Refresh Blockchain
          </button>
        </div>

        {/* === Panel 4: Pending Mined Blocks (full width on md screens) === */}
        <div className="bg-[#111] w-full p-4 rounded shadow col-span-1 md:col-span-3">
          <h2 className="text-center text-2xl mb-4 text-[#ffc107]">
            Unclaimed Blocks
          </h2>
          <p className="text-lg mb-2">
            <span>Mined Blocks: </span>
            <span className="text-[#0cc91f]">{pendingBlocks.length}</span>
          </p>
          {pendingBlocks.map((b, idx) => (
            <div key={idx} className="text-lg mb-2">
              <span>Block # </span>
              <span>{b.blockNumber}</span>
              <span className="text-[#0cc91f]"> : 50</span>
              <span className="text-[#ffff00]"> SHARE</span>
              <span> :N </span>
              <span className="text-[#ffff00]">{b.nonce}</span>
              <span> :Hash </span>
              <span className="text-[#0cc91f]">{b.localHash.slice(0, 46)}</span>
              <span> : </span>
              <span>{new Date(b.timestamp).toLocaleString()}</span>
            </div>
          ))}
          {pendingBlocks.length > 0 && (
            <button
              onClick={handleBatchSubmit}
              disabled={isMinting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mt-2"
            >
              {isMinting ? "Minting..." : "Submit & Mint"}
            </button>
          )}
        </div>
      </div>

      {/* Owner-only Withdraw Funds Button */}
      {isOwner && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleWithdrawFunds}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Withdraw All Funds
          </button>
        </div>
      )}

      {/* Footer Buttons */}
      <div className="mt-6 flex justify-center space-x-4">
        <AddShareCoinButton />
        <button
          onClick={() => setShowHelpModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          How to Run Miner?
        </button>
      </div>

      {/* The Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-[#111] text-white p-6 rounded max-w-lg w-full mx-4">
            <h2 className="text-2xl mb-4">ShareCoin Mining Info</h2>
            <p className="text-sm mb-3 leading-relaxed">
              1. Make sure you have a subscription active.<br />
              2. Click "Start Mining" in the Mining Controls panel.<br />
              3. Wait for blocks to appear under "Unclaimed Blocks".<br />
              4. Submit them to claim your rewards..<br />
              5. Buy a Cloud Mining Subscription—Click it & Forget it. 
                 Coins will be deposited in your wallet; we run a mint function 
                 to all blocks found every hour. You can mint your found blocks 
                 or allow the server to mint them.<br />
              6. 21,000,000 SHARE coins total supply, 50 SHARE per each block found.<br />
              7. ShareCoin is a Meme Coin and has no value when mined, 
                 other than as a Collector’s Item.<br />
              General Info:<br />
              10. No mining equipment is required; all mining hash is done on 
                  the cloud server. Have Fun Mining!
            </p>
            <button
              onClick={() => setShowHelpModal(false)}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <ToastContainer position="bottom-right" theme="dark" />
    </div>
  );
}
