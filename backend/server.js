/********************************************************************
 * server.js - Enhanced server-based mining for ShareCoin,
 * with rate limit, plan verification, & chainNextBlockNumber sync
 ********************************************************************/
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");
const cron = require("node-cron");
// 1) Rate limiting package
const rateLimit = require("express-rate-limit");

/********************************************
 * 1) CONFIG
 ********************************************/
const RPC_URL = process.env.PULSECHAIN_RPC || "http://127.0.0.1:8545";
const SHARECOIN_ADDRESS = "0x03EA2507C5cAF3E75B7D417b5ACfE6dfA0beBAa1";
const SHARECOIN_ABI = [
  "function blockAlreadyUsed(address,uint256) view returns (bool)",
  "function getBlockHistoryLength() view returns (uint256)",
  "function subscriptionActiveFor(address user) view returns (bool)",
  // For plan verification:
  "function userPlan(address user) view returns (uint256)",

  "function serverSubmitMultipleMinedBlocksAndMintOnBehalf(address user, uint256[] blockNumbers, uint256[] nonces) external",
];
const OWNER_PRIVATE_KEY = process.env.PULSECHAIN_PRIVATE_KEY;

// We'll create provider, signer, and contract references in initChainBlockNumber
let provider;
let serverSigner;
let shareCoin;
let chainNextBlockNumber = 0;

/********************************************
 * 2) Data Structures
 ********************************************/
const minerStates = {};

/********************************************
 * 3) Helper Functions
 ********************************************/
function getFindProbability(plan) {
  switch (plan) {
    case 1: // Basic
      return 1 / 610;
    case 2: // Standard
      return 1 / 480;
    case 3: // Premium
      return 1 / 360;
    default:
      return 0;
  }
}

function getPlanHashRate(plan) {
  switch (plan) {
    case 1: return 500;
    case 2: return 2000;
    case 3: return 5000;
    default: return 0;
  }
}

/********************************************
 * 4) Rolling Average Block Time
 ********************************************/
const blockTimestamps = [];
function recordBlockTimestamp() {
  const now = Date.now();
  blockTimestamps.push(now);
  if (blockTimestamps.length > 50) {
    blockTimestamps.shift();
  }
}
function getAverageBlockTimeSec() {
  if (blockTimestamps.length < 2) return "N/A";
  let total = 0;
  for (let i = 1; i < blockTimestamps.length; i++) {
    total += (blockTimestamps[i] - blockTimestamps[i - 1]);
  }
  const avgMs = total / (blockTimestamps.length - 1);
  return (avgMs / 1000).toFixed(2);
}

/********************************************
 * 5) Express Setup
 ********************************************/
const app = express();
app.use(cors());
app.use(express.json());

// 1) Rate limiting - limit to 200 requests / 5 minutes as example
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 200, // 200 requests per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

/********************************************
 * 6) Routes
 ********************************************/
app.get("/api/networkHashRate", (req, res) => {
  let totalHashRate = 0;
  for (const address of Object.keys(minerStates)) {
    const data = minerStates[address];
    if (data.active) {
      totalHashRate += getPlanHashRate(data.plan);
    }
  }
  res.json({ networkHashRate: totalHashRate });
});

app.post("/api/startMining", async (req, res) => {
  try {
    const userAddress = (req.body.userAddress || "").toLowerCase();
    const { plan } = req.body;
    if (!userAddress) {
      return res.status(400).json({ error: "Missing userAddress" });
    }

    // 2) Check subscription
    const subscribed = await shareCoin.subscriptionActiveFor(userAddress);
    if (!subscribed) {
      return res.status(403).json({ error: "No active subscription on-chain." });
    }

    // 3) Plan verification: read plan from contract to ensure user is telling truth
    const onChainPlanBN = await shareCoin.userPlan(userAddress);
    const onChainPlan = Number(onChainPlanBN); // 1=Basic,2=Standard,3=Premium etc.
    if (onChainPlan < 1 || onChainPlan > 3) {
      // e.g. plan 0 or out of range
      return res.status(403).json({ error: "Invalid plan on-chain." });
    }

    // Now we trust onChainPlan as the real plan
    if (!minerStates[userAddress]) {
      minerStates[userAddress] = {
        active: false,
        plan: onChainPlan, // use the contract's plan
        hashAttempts: 0,
        blocksFound: [],
      };
    } else {
      minerStates[userAddress].plan = onChainPlan;
    }

    minerStates[userAddress].active = true;

    return res.json({ success: true, verifiedPlan: onChainPlan });
  } catch (err) {
    console.error("startMining error:", err);
    return res.status(500).json({ error: err.toString() });
  }
});

app.post("/api/stopMining", (req, res) => {
  const userAddress = (req.body.userAddress || "").toLowerCase();
  if (!userAddress) {
    return res.status(400).json({ error: "Missing userAddress" });
  }
  if (minerStates[userAddress]) {
    minerStates[userAddress].active = false;
  }
  return res.json({ success: true });
});

app.get("/api/minerStats", (req, res) => {
  const userAddress = (req.query.userAddress || "").toLowerCase();
  const state = minerStates[userAddress] || {
    active: false,
    plan: 0,
    hashAttempts: 0,
    blocksFound: [],
  };
  const hashRate = getPlanHashRate(state.plan);

  return res.json({
    active: state.active,
    plan: state.plan,
    hashAttempts: state.hashAttempts,
    blocksFound: state.blocksFound,
    hashRate,
    pendingCount: state.blocksFound.length,
  });
});

app.post("/api/clearMinedBlocks", (req, res) => {
  const userAddress = (req.body.userAddress || "").toLowerCase();
  const { blockNumbers } = req.body;

  if (!userAddress) {
    return res.status(400).json({ error: "Missing userAddress" });
  }
  if (!minerStates[userAddress]) {
    return res.status(404).json({ error: "No miner state found" });
  }
  const oldList = minerStates[userAddress].blocksFound;
  const newList = oldList.filter(b => !blockNumbers.includes(b.blockNumber));
  minerStates[userAddress].blocksFound = newList;

  console.log(`[Miner] Removed minted blocks for ${userAddress}. Remaining: ${newList.length}`);
  return res.json({ success: true, remainingBlocks: newList.length });
});

app.get("/api/averageBlockTime", (req, res) => {
  const avg = getAverageBlockTimeSec();
  return res.json({ average: avg });
});

/********************************************
 * 7) Background Mining Loop (every 10s)
 ********************************************/
setInterval(async () => {
  for (const address of Object.keys(minerStates)) {
    const data = minerStates[address];
    if (!data.active) continue;

    // Re-check subscription each iteration
    try {
      const sub = await shareCoin.subscriptionActiveFor(address);
      if (!sub) {
        data.active = false;
        console.log(`[Miner] ${address} lost subscription, stopping.`);
        continue;
      }
    } catch (err) {
      console.error("subscriptionActiveFor error:", err);
      continue;
    }

    // Probability-based find
    const prob = getFindProbability(data.plan);
    if (Math.random() < prob) {
      const crypto = require("crypto");
      function generatePseudoHash() {
        return "0x" + crypto.randomBytes(32).toString("hex");
      }

      const localBlock = chainNextBlockNumber;
      chainNextBlockNumber++;

      const nonce = Math.floor(Math.random() * 1e9);
      const fakeHash = generatePseudoHash();

      data.blocksFound.push({
        blockNumber: localBlock,
        nonce,
        localHash: fakeHash,
        timestamp: Date.now(),
      });

      recordBlockTimestamp();
      console.log(`[Miner] ${address} found block #${localBlock}`);
    }
    data.hashAttempts++;
  }

  // 4) Periodic chainNextBlockNumber sync
  // Here, every iteration or every X times, re-sync from contract
  // to ensure we stay in sync if anything else minted or if server restarted
  try {
    const lengthBN = await shareCoin.getBlockHistoryLength();
    chainNextBlockNumber = Number(lengthBN);
  } catch (err) {
    console.error("Error re-syncing chainNextBlockNumber:", err);
  }
}, 10000); // runs every 10s

/********************************************
 * 8) Cron Job - runs every 15 minutes
 ********************************************/
cron.schedule("*/15 * * * *", async () => {
  console.log("[CRON] Checking blocks for automatic minting...");
  for (const userAddress of Object.keys(minerStates)) {
    let blocks = minerStates[userAddress].blocksFound;
    if (!blocks.length) continue;

    try {
      // 1) Filter out blocks that are already used on-chain
      const freshBlocks = [];
      for (const b of blocks) {
        const isUsed = await shareCoin.blockAlreadyUsed(userAddress, b.blockNumber);
        if (!isUsed) {
          freshBlocks.push(b);
        } else {
          console.log(`[CRON] block #${b.blockNumber} already used for ${userAddress}, skipping.`);
        }
      }

      if (!freshBlocks.length) {
        continue;
      }

      // 2) Mint only the fresh blocks
      const blockNumbers = freshBlocks.map(b => b.blockNumber);
      const nonces = freshBlocks.map(b => b.nonce);

      console.log(`Minting ${blockNumbers.length} blocks for ${userAddress}...`);
      const tx = await shareCoin.serverSubmitMultipleMinedBlocksAndMintOnBehalf(
        userAddress,
        blockNumbers,
        nonces
      );
      await tx.wait();

      // 3) Remove them from local memory
      minerStates[userAddress].blocksFound = [];

      console.log(`[CRON] Mined for user ${userAddress} in tx ${tx.hash}`);

      // 4) Re-sync chainNextBlockNumber after the mint
      const lengthBN = await shareCoin.getBlockHistoryLength();
      chainNextBlockNumber = Number(lengthBN);
      console.log("[CRON] Re-synced local chainNextBlockNumber to", chainNextBlockNumber);

    } catch (err) {
      console.error("[CRON] Error minting for", userAddress, err);
    }
  }
  console.log("[CRON] Done.");
});

/********************************************
 * 9) Init and Start
 ********************************************/
async function initChainBlockNumber() {
  console.log("Connecting to RPC:", RPC_URL);
  provider = new ethers.JsonRpcProvider(RPC_URL);

  // Use server wallet as signer
  serverSigner = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);

  shareCoin = new ethers.Contract(SHARECOIN_ADDRESS, SHARECOIN_ABI, serverSigner);

  // Initial sync for chainNextBlockNumber
  const lengthBN = await shareCoin.getBlockHistoryLength();
  chainNextBlockNumber = Number(lengthBN);
  console.log("Initialized chainNextBlockNumber to", chainNextBlockNumber);
}

const PORT = process.env.PORT || 3001;
initChainBlockNumber()
  .then(() => {
    app.listen(PORT, () => {
      console.log("Mining server listening on port", PORT);
    });
  })
  .catch((err) => {
    console.error("Failed init:", err);
    process.exit(1);
  });
