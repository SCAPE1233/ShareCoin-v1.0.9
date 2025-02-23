"use client";

import { useWeb3 } from "./context/Web3Context";

export default function HomePage() {
  const { account } = useWeb3();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-8">
      <h1 className="text-8xl font-bold mb-12">Welcome to Share Dapp</h1>
      <div className="max-w-4xl text-center mb-12">
        <p className="text-4xl mb-6">
          We are offering Cloud mining contracts here on Pulse. How it works: go to the mining page and select your Mining contract (choose the time you want to mine), select your Miner (how much hash power you want)...
        </p>
        <p className="text-4xl mb-6">
          At this time we are only offering Solo mining. SHARE or ShareCoin will be the rewarded coin. We will offer a SHARE Pool where block rewards are tallied up by the amount of work your miner has completed.
        </p>
        <p className="text-4xl">
          ShareCoin will function with the same principles as Bitcoin in the early days: 50 coins per block with a total cap of 21M. The Share Pool block ledger will be public on the contract page.
        </p>
      </div>
      <p className="text-4xl">
        {account ? `✅ Connected: ${account}` : "❌ Not Connected"}
      </p>
    </div>
  );
}
