const cron = require("node-cron");
const fetch = require("node-fetch");

// This scheduler runs every 10 minutes.
cron.schedule("*/10 * * * *", async () => {
  try {
    // Get all active subscriptions from your database or API.
    // For testing, assume you have an endpoint that returns active subscriptions.
    const res = await fetch("http://localhost:3000/api/activeSubscriptions");
    const activeSubs = await res.json();
    
    // Determine total "weight" from hashPower of all active subscriptions.
    const totalWeight = activeSubs.reduce((sum, sub) => sum + sub.hashPower, 0);
    // Pick a random number between 0 and totalWeight
    const randomWeight = Math.random() * totalWeight;
    let cumulative = 0;
    let selected;
    for (const sub of activeSubs) {
      cumulative += sub.hashPower;
      if (cumulative >= randomWeight) {
        selected = sub;
        break;
      }
    }
    
    // Now, credit the reward to the selected user by calling your contract function.
    console.log("Rewarding:", selected.address);
    // (Call your smart contract method here using ethers.js or web3.js)
  } catch (err) {
    console.error("Error running reward scheduler:", err);
  }
});
