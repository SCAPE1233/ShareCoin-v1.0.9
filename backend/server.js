/********************************************************************
 *  server.js - Example server-based mining simulation for ShareCoin
 ********************************************************************/
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");

/********************************************
 * 1) CONFIG
 ********************************************/
// We read the RPC URL from .env
const RPC_URL = process.env.PULSECHAIN_RPC || "http://127.0.0.1:8545";

// Replace with your actual contract address & ABI
const SHARECOIN_ADDRESS = "0xB6710FEED1c139C8e40cB73499e2e20E25EBE284";
const SHARECOIN_ABI = [
  "function getBlockHistoryLength() view returns (uint256)",
  "function subscriptionActiveFor(address user) view returns (bool)"
];

let provider;
let shareCoin;

// We'll track a global "next block number"
// that starts from the contract's blockHistoryLength
let chainNextBlockNumber = 0;

/********************************************
 * 2) MINER STATES
 ********************************************/
// We'll store each user's mining state in memory.
// For production, you'd want a real database.
const minerStates = {};
/*
Example structure:
minerStates["0xUSER"] = {
  active: false,
  plan: 1,        // 1=Basic, 2=Standard, 3=Premium
  hashAttempts: 0,
  blocksFound: [
    {
      blockNumber: 261,
      nonce: 123456,
      localHash: "0xabc123...",
      timestamp: 1684123456789
    }
  ]
};
*/

/********************************************
 * 3) HELPER FUNCTIONS
 ********************************************/
// Probability per plan (adjust as you like)
function getFindProbability(plan) {
  // Example: changed Basic => 1/72 for quicker testing
  switch (plan) {
    case 1: return 1 / 720;   // Basic
    case 2: return 1 / 480;  // Standard
    case 3: return 1 / 360;  // Premium
    default: return 0;
  }
}

// Optional plan-based hash rate (for display)
function getPlanHashRate(plan) {
  switch (plan) {
    case 1: return 500;    // Basic
    case 2: return 2000;   // Standard
    case 3: return 5000;   // Premium
    default: return 0;
  }
}

/********************************************
 * 4) EXPRESS APP SETUP
 ********************************************/
const app = express();
app.use(cors());
app.use(express.json());

/********************************************
 * 5) ROUTES
 ********************************************/
/**
 * Start mining (the user clicked 'Start Mining' in the front end).
 */
app.post("/api/startMining", async (req, res) => {
  try {
    const { userAddress, plan } = req.body;
    if (!userAddress) {
      return res.status(400).json({ error: "Missing userAddress" });
    }

    // Optionally confirm user is subscribed on-chain:
    const subscribed = await shareCoin.subscriptionActiveFor(userAddress);
    if (!subscribed) {
      return res.status(403).json({ error: "No active subscription on-chain." });
    }

    if (!minerStates[userAddress]) {
      minerStates[userAddress] = {
        active: false,
        plan: plan || 1,
        hashAttempts: 0,
        blocksFound: []
      };
    }
    minerStates[userAddress].active = true;
    if (plan) minerStates[userAddress].plan = plan;

    return res.json({ success: true });
  } catch (err) {
    console.error("startMining error:", err);
    return res.status(500).json({ error: err.toString() });
  }
});

/**
 * Stop mining (the user clicked 'Stop Mining').
 */
app.post("/api/stopMining", (req, res) => {
  const { userAddress } = req.body;
  if (!userAddress) {
    return res.status(400).json({ error: "Missing userAddress" });
  }
  if (minerStates[userAddress]) {
    minerStates[userAddress].active = false;
  }
  return res.json({ success: true });
});

/**
 * Get the user's current mining stats & found blocks.
 */
app.get("/api/minerStats", (req, res) => {
  const userAddress = (req.query.userAddress || "").toLowerCase();
  const state = minerStates[userAddress] || {
    active: false,
    plan: 0,
    hashAttempts: 0,
    blocksFound: []
  };

  const hashRate = getPlanHashRate(state.plan);

  return res.json({
    active: state.active,
    plan: state.plan,
    hashAttempts: state.hashAttempts,
    blocksFound: state.blocksFound,
    hashRate
  });
});

/**
 * Clear minted blocks from the server so they don't reappear.
 * This is called by the front end after a successful on-chain mint.
 */
app.post("/api/clearMinedBlocks", (req, res) => {
  const { userAddress, blockNumbers } = req.body;
  if (!userAddress) {
    return res.status(400).json({ error: "Missing userAddress" });
  }
  if (!minerStates[userAddress]) {
    return res.status(404).json({ error: "No miner state found" });
  }

  // Filter out the minted blocks
  const oldList = minerStates[userAddress].blocksFound;
  const newList = oldList.filter(
    (b) => !blockNumbers.includes(b.blockNumber)
  );
  minerStates[userAddress].blocksFound = newList;

  console.log(
    `[Miner] Removed minted blocks for ${userAddress}. Remaining: ${newList.length}`
  );

  return res.json({ success: true, remainingBlocks: newList.length });
});

/********************************************
 * 6) BACKGROUND MINING LOOP
 ********************************************/
// Runs every 2 seconds
setInterval(async () => {
  for (const address of Object.keys(minerStates)) {
    const data = minerStates[address];
    if (!data.active) continue; // skip if not actively mining

    // If you want to re-check subscription every iteration:
    try {
      const subscribed = await shareCoin.subscriptionActiveFor(address);
      if (!subscribed) {
        data.active = false;
        console.log(`[Miner] ${address} lost subscription, stopping mining.`);
        continue;
      }
    } catch (err) {
      console.error("subscriptionActiveFor error:", err);
      // skip this iteration
      continue;
    }

    // Do random block find based on plan
    const probability = getFindProbability(data.plan);
    if (Math.random() < probability) {
      // Found a block
    
    

      const crypto = require("crypto");

      function generatePseudoHash() {
        return "0x" + crypto.randomBytes(32).toString("hex");
      }
      
      // wherever you find a block:
      const blockNum = chainNextBlockNumber;
      chainNextBlockNumber += 1;
      
      const nonce = Math.floor(Math.random() * 1e9);
      const fakeHash = generatePseudoHash();  // now a full 32-byte hex hash
      
      data.blocksFound.push({
        blockNumber: blockNum,
        nonce,
        localHash: fakeHash,
        timestamp: Date.now()
      });
    
      

      console.log(`[Miner] ${address} found block #${blockNum}`);
    }
    data.hashAttempts += 1;
  }
}, 2000);

/********************************************
 * 7) INIT & START
 ********************************************/
/**
 * Initialize chainNextBlockNumber from the contract's existing blockHistoryLength.
 */
async function initChainBlockNumber() {
  console.log("Connecting to RPC:", RPC_URL);
  provider = new ethers.JsonRpcProvider(RPC_URL);
  shareCoin = new ethers.Contract(SHARECOIN_ADDRESS, SHARECOIN_ABI, provider);

  const lengthBN = await shareCoin.getBlockHistoryLength();
  chainNextBlockNumber = Number(lengthBN);
  console.log("Initialized chainNextBlockNumber to", chainNextBlockNumber);
}

const PORT = process.env.PORT || 3001;

initChainBlockNumber()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Mining server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to init chain block number:", err);
    process.exit(1);
  });
