// app/api/miner-data/route.ts
import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { resolve } from 'path';

// Ensure environment variables are loaded (Next.js automatically loads .env files in the project root)
const rpcUrl = process.env.PULSECHAIN_RPC;
const contractAddress = process.env.CONTRACT_ADDRESS;

if (!rpcUrl || !contractAddress) {
  throw new Error('PULSECHAIN_RPC and CONTRACT_ADDRESS must be set in your environment variables.');
}

// Minimal ABI for reading block history from your ShareCoin contract.
// Adjust the ABI if you add or rename functions.
const abi = [
  "function getBlockHistoryLength() view returns (uint256)",
  "function getBlockHistory(uint256 start, uint256 end) view returns (tuple(uint256 blockNumber, bytes32 blockHash, uint256 reward, address miner, uint256 timestamp, bool claimed)[])"
];

export async function GET() {
  try {
    // Set up a provider connected to the testnet.
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Create a contract instance using the provider (read-only)
    const contract = new ethers.Contract(contractAddress, abi, provider);

    // Get the total number of mined blocks.
    const totalBlocksBN = await contract.getBlockHistoryLength();
    const totalBlocks = totalBlocksBN.toNumber();

    // Retrieve the entire block history.
    // (For demonstration, we'll get all blocks if totalBlocks is not huge;
    // otherwise, you might want to paginate.)
    let blockHistory = [];
    if (totalBlocks > 0) {
      blockHistory = await contract.getBlockHistory(0, totalBlocks - 1);
    }

    // Convert BigNumber values to strings for JSON output.
    const formattedHistory = blockHistory.map((b: any) => ({
      blockNumber: b.blockNumber.toString(),
      blockHash: b.blockHash,
      reward: b.reward.toString(),
      miner: b.miner,
      timestamp: b.timestamp.toString(),
      claimed: b.claimed,
    }));

    const data = {
      totalBlocks,
      blockHistory: formattedHistory,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching miner data:", error);
    return NextResponse.json({ error: "Failed to fetch miner data" }, { status: 500 });
  }
}
