"use client";

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/** =========== 1) Contract & Server Info =========== **/

export const PAYMENT_TOKEN_ADDRESS = "0x826e4e896CC2f5B371Cd7Bb0bd929DB3e3DB67c0";
export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address sender, address recipient, uint256 amount) returns (bool)",
];

// 1) New contract address:
export const SHARECOIN_ADDRESS = "0xB6710FEED1c139C8e40cB73499e2e20E25EBE284";
export const SHARECOIN_ABI = [
  // Subscription
  "function subscriptionActiveFor(address user) view returns (bool)",
  "function purchaseSubscription(uint8 plan, uint256 daysCount) external",
  "function purchaseLifetimeSubscription() external",
  "function userPlan(address) view returns (uint8)",
  "function subscriptions(address) view returns (uint256)",

  // Mining
  "function submitMultipleMinedBlocksAndMint(uint256[], uint256[]) external",
  "function getBlockHistoryLength() view returns (uint256)",

  // Owner ops
  "function ownerWithdrawSubscriptionFunds(uint256 amount) external",
  "function setDifficulty(uint256 newDifficulty) external",

  // Basic ERC20
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",

  // ERC20
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address sender, address recipient, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

// If you're using the Node server for your simulation:
const MINING_SERVER_URL = "http://localhost:3001";

/** =========== 2) Types & Utils =========== **/

enum PlanType {
  None = 0,
  Basic = 1,
  Standard = 2,
  Premium = 3,
  Lifetime = 4,
}

function getPlanName(plan: PlanType): string {
  switch (plan) {
    case PlanType.Basic:    return "Basic";
    case PlanType.Standard: return "Standard";
    case PlanType.Premium:  return "Premium";
    case PlanType.Lifetime: return "Lifetime";
    default:                return "None";
  }
}

// Hard-coded daily subscription rates (for the front end only)
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

const lifetimePrice = 8000; // tokens

const durationOptions = [
  { label: "3 days", value: 3 },
  { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

// Format countdown for subscription expiry
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

export default function AccountsPage() {
  /************************************************
   *  A) On-Chain Subscription State
   ***********************************************/
  const [account, setAccount] = useState("");
  const [userBalance, setUserBalance] = useState("0");
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [userPlanEnum, setUserPlanEnum] = useState<PlanType>(PlanType.None);
  const [expiryTimestamp, setExpiryTimestamp] = useState<number>(0);
  const [timeLeftDisplay, setTimeLeftDisplay] = useState("...");

  // Purchase UI
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(PlanType.Basic);
  const [selectedDuration, setSelectedDuration] = useState<number>(3);
  const [computedPrice, setComputedPrice] = useState("0");
  const [statusMessage, setStatusMessage] = useState("");

  // On-chain stats
  const [onChainBlockCount, setOnChainBlockCount] = useState(0);

  // “Network Stats” (just for fun)
  const [networkHashRate, setNetworkHashRate] = useState("0 MH/s");
  const [averageBlockTime, setAverageBlockTime] = useState("N/A");

  /************************************************
   *  B) Server-Based Mining (optional)
   ***********************************************/
  const [minerActive, setMinerActive] = useState(false);
  const [minerPlan, setMinerPlan] = useState<PlanType>(PlanType.None);
  const [hashAttempts, setHashAttempts] = useState(0);
  const [hashRate, setHashRate] = useState(0);
  const [pendingBlocks, setPendingBlocks] = useState<any[]>([]);

  // NEW: track isMinting to disable the button while TX is pending
  

  /************************************************
   *  C) Connect MetaMask on Mount
   ***********************************************/
  useEffect(() => {
    async function connectMetamask() {
      if ((window as any).ethereum) {
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
   *  D) Load On-Chain Subscription Info
   ***********************************************/
  async function loadSubscriptionInfo() {
    if (!account) return;
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const shareCoin = new ethers.Contract(SHARECOIN_ADDRESS, SHARECOIN_ABI, provider);

      // Check subscription
      const isActive: boolean = await shareCoin.subscriptionActiveFor(account);
      setSubscriptionActive(isActive);

      // userPlan => parse
      const planBN = await shareCoin.userPlan(account);
      const planNumber = Number(planBN);
      setUserPlanEnum(planNumber as PlanType);

      // expiry
      const expiryBN = await shareCoin.subscriptions(account);
      const expiryNum = Number(expiryBN);
      setExpiryTimestamp(expiryNum);
    } catch (err) {
      console.error("loadSubscriptionInfo error:", err);
    }
  }

  // If account changes, load sub info and balance
  useEffect(() => {
    if (account) {
      loadSubscriptionInfo();
      refreshUserBalance();
      refreshOnChainBlockCount();
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
    // If lifetime or super large => show "Lifetime"
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

      // Convert the computedPrice to BigInt
      const finalPrice = ethers.parseEther(computedPrice);

      // Approve
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

      // reload sub info & balance
      loadSubscriptionInfo();
      refreshUserBalance();
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
        const res = await fetch(`${MINING_SERVER_URL}/api/minerStats?userAddress=${account}`);
        const data = await res.json();
        // data = { active, plan, hashAttempts, blocksFound, hashRate }
        setMinerActive(data.active);
        setMinerPlan(data.plan);
        setHashAttempts(data.hashAttempts || 0);
        setHashRate(data.hashRate || 0);
        setPendingBlocks(data.blocksFound || []);
      } catch (err) {
        console.error("Error fetching miner stats from server:", err);
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
      const body = {
        userAddress: String(account),
        plan: Number(userPlanEnum),
      };

      const res = await fetch(`${MINING_SERVER_URL}/api/startMining`, {
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
      const res = await fetch(`${MINING_SERVER_URL}/api/stopMining`, {
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
  const [isMinting, setIsMinting] = useState(false);


  
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
  
      // 1) Clear from local state
      setPendingBlocks([]);
  
      // 2) Tell the server to remove them
      const body = { userAddress: account, blockNumbers };
      await fetch(`${MINING_SERVER_URL}/api/clearMinedBlocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
  
      // 3) Refresh the user’s on-chain balance (or subscription info, etc.)
      await refreshUserBalance();
      // or loadSubscriptionInfo() if you want to re-check subscription status
  
    } catch (err: any) {
      console.error("handleBatchSubmit error:", err);
      toast.error(`Batch submit failed: ${err.message || err.toString()}`);
    } finally {
      setIsMinting(false);
    }
  }


  /************************************************
   *  M) Fake “Network” Stats
   ***********************************************/
  useEffect(() => {
    const timer = setInterval(() => {
      setNetworkHashRate(Math.floor(50 + Math.random() * 100) + " MH/s");
      if (onChainBlockCount >= 2) {
        setAverageBlockTime((8 + Math.random() * 4).toFixed(0) + " sec");
      }
    }, 15000);
    return () => clearInterval(timer);
  }, [onChainBlockCount]);

  /************************************************
   *  Render
   ***********************************************/
  // Convert numeric plan to text
  const planName = getPlanName(userPlanEnum);

  return (
    <div style={styles.pageWrapper}>
      <h1 style={styles.header}>ShareCoin Cloud Mining (Server-based)</h1>

      <div style={styles.mainContainer}>
        {/* Panel 1: On-Chain Subscription Info */}
        <div style={styles.panel}>
          <h2 style={styles.panelHeader}>Your Contract/Wallet Balance</h2>
          <p style={styles.largeText}>
            <span style={styles.textWhite}>Account: </span>
            <span style={styles.textGreen}>{account || "Not connected"}</span>
          </p>
          <p style={styles.largeText}>
            <span style={styles.textWhite}>Plan: </span>
            <span style={styles.textGreen}>{planName}</span>
          </p>
          <p style={styles.largeText}>
            <span style={styles.textWhite}>Contract Time Left: </span>
            <span style={styles.textGreen}>{timeLeftDisplay}</span>
          </p>
          <p style={styles.largeText}>
            <span style={styles.textWhite}>Mining Contract Active: </span>
            <span style={styles.textGreen}>
              {subscriptionActive ? "Yes" : "No"}
            </span>
          </p>
          <p style={styles.largeText}>
            <span style={styles.textWhite}>SHARE Balance: </span>
            <span style={styles.textGreen}>{userBalance}</span>
          </p>
          <button onClick={refreshUserBalance} style={styles.buttonSecondary}>
            Refresh Balance
          </button>
        </div>

        {/* Panel 2: Purchase a Subscription */}
        <div style={styles.panel}>
          <h2 style={styles.panelHeader}>Buy Cloud Mining Contract</h2>
          <p style={styles.largeText}>
            <span style={styles.textWhite}>Contract to Buy:</span>
          </p>
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(Number(e.target.value) as PlanType)}
            style={styles.select}
          >
            <option value={PlanType.Basic}>Basic (500 H/s)</option>
            <option value={PlanType.Standard}>Standard (2000 H/s)</option>
            <option value={PlanType.Premium}>Premium (5000 H/s)</option>
            <option value={PlanType.Lifetime}>Lifetime</option>
          </select>

          {selectedPlan !== PlanType.Lifetime && (
            <>
              <p style={styles.largeText}>
                <span style={styles.textWhite}>Duration (Days):</span>
              </p>
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(Number(e.target.value))}
                style={styles.select}
              >
                {durationOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </>
          )}

          <p style={styles.largeText}>
            <span style={styles.textWhite}>Price: </span>
            <span style={styles.textGreen}>{computedPrice}</span>
            <span style={styles.textWhite}> tokens</span>
          </p>
          <button onClick={handleSubscribe} style={styles.buttonPrimary}>
            Purchase
          </button>
          {statusMessage && (
            <p style={{ ...styles.largeText, ...styles.textWhite }}>
              {statusMessage}
            </p>
          )}
        </div>

        {/* Panel 3: Server-based Mining Stats */}
        <div style={styles.panel}>
          <h2 style={styles.panelHeader}>Server-Based Mining</h2>
          <p style={styles.largeText}>
            <span style={styles.textWhite}>Miner Active: </span>
            <span style={styles.textGreen}>{minerActive ? "Yes" : "No"}</span>
          </p>
          <p style={styles.largeText}>
            <span style={styles.textWhite}>Hash Rate: </span>
            <span style={styles.textGreen}>{hashRate} H/s</span>
          </p>
          <p style={styles.largeText}>
            <span style={styles.textWhite}>Block Attempts: </span>
            <span style={styles.textGreen}>{hashAttempts}</span>
          </p>

          {!minerActive ? (
            <button onClick={handleStartMining} style={styles.buttonPrimary}>
              Start Mining
            </button>
          ) : (
            <button onClick={handleStopMining} style={styles.buttonDanger}>
              Stop Mining
            </button>
          )}

          <h3 style={styles.subHeader}>ShareCoin Chain Stats</h3>
          <p style={styles.largeText}>
            <span style={styles.textWhite}>Block Height: </span>
            <span style={styles.textGreen}>{onChainBlockCount}</span>
          </p>
          <p style={styles.largeText}>
            <span style={styles.textWhite}>Network Hash Rate: </span>
            <span style={styles.textGreen}>{networkHashRate}</span>
          </p>
          <p style={styles.largeText}>
            <span style={styles.textWhite}>Avg Block Time: </span>
            <span style={styles.textGreen}>{averageBlockTime}</span>
          </p>
          <button onClick={refreshOnChainBlockCount} style={styles.buttonSecondary}>
            Refresh BlockChain
          </button>
        </div>

        {/* Panel 4: Pending Mined Blocks */}
        <div style={{ ...styles.panel, ...styles.fullWidth }}>
          <h2 style={styles.panelHeader}>Unclaimed Blocks</h2>
          <p style={styles.largeText}>
            <span style={styles.textWhite}>Mined Blocks: </span>
            <span style={styles.textGreen}>{pendingBlocks.length}</span>
          </p>

          {pendingBlocks.map((b: any, idx) => (
            <div key={idx} style={styles.largeText}>
              <span style={styles.textWhite}>Block #  </span>
              <span style={styles.textWhite}> {b.blockNumber}</span>

              <span style={styles.textGreen}>: 50 </span>
              <span style={styles.textYellow}> SHARE</span>

              <span style={styles.textWhite}> :N  </span>
              <span style={styles.textYellow}>{b.nonce}</span>

              <span style={styles.textWhite}> :Hash </span>
              <span style={styles.textGreen}>
              {b.localHash.slice(0, 46)}
              </span>

              <span style={styles.textWhite}> : </span>
              <span style={styles.textWhite}>
                {new Date(b.timestamp).toLocaleString()}
              </span>
            </div>
          ))}

          {pendingBlocks.length > 0 && (
            <button
              onClick={handleBatchSubmit}
              style={styles.buttonPrimary}
              disabled={isMinting}
            >
              {isMinting ? "Minting..." : "Submit & Mint"}
            </button>
          )}
        </div>
      </div>

      <ToastContainer position="bottom-right" theme="dark" />
    </div>
  );
}

/** =========== 4) Basic Styling  =========== **/
const styles: { [key: string]: React.CSSProperties } = {
  pageWrapper: {
    minHeight: "100vh",
    backgroundColor: "#000",
    padding: "2rem",
  },
  header: {
    textAlign: "center",
    fontSize: "42px",
    marginBottom: "2rem",
    color: "#44d7b6",
  },
  mainContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(300px, 1fr))",
    gap: "2rem",
    justifyItems: "center",
  },
  panel: {
    backgroundColor: "#111",
    borderRadius: "8px",
    padding: "1.5rem",
    width: "100%",
    boxShadow: "0 0 8px rgba(0,0,0,0.5)",
  },
  fullWidth: {
    gridColumn: "1 / -1",
  },
  panelHeader: {
    fontSize: "24px",
    marginBottom: "1rem",
    textAlign: "center",
    color: "#ffc107",
  },
  subHeader: {
    fontSize: "20px",
    marginTop: "1.5rem",
    color: "#ffc107",
  },
  largeText: {
    fontSize: "20px",
    margin: "0.5rem 0",
  },
  select: {
    padding: "0.75rem",
    fontSize: "16px",
    borderRadius: "4px",
    border: "1px solid #333",
    backgroundColor: "#000",
    color: "#f0f0f0",
    width: "100%",
    marginTop: "0.5rem",
    marginBottom: "1rem",
  },
  buttonPrimary: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#0070f3",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
    marginRight: "0.5rem",
  },
  buttonSecondary: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#6c757d",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
    marginTop: "0.75rem",
  },
  buttonDanger: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#dc3545",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
    marginTop: "0.75rem",
  },
  textWhite: {
    color: "#ffffff",
  },
  textGreen: {
    color: "#0cc91f",
  },
  textYellow: {
    color: "#ffff00",
  },
};
