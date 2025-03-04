"use client";

import React from "react";

const AddShareCoinButton: React.FC = () => {
  const tokenAddress = "0x03EA2507C5cAF3E75B7D417b5ACfE6dfA0beBAa1";
  const tokenSymbol = "SHARE";
  const tokenDecimals = 18;

  // If we have `sharecoin.png` inside `public/`:
  // public/sharecoin.png -> this means the file is available at <your-site>/sharecoin.png
  // In Next.js client code, we can do:
  const tokenImage = typeof window !== "undefined"
    ? `${window.location.origin}/sharecoin.png`
    : "https://sharecoinmining.com/sharecoin.png";

  const addTokenToMetaMask = async () => {
    if (!window.ethereum) {
      alert("MetaMask not found!");
      return;
    }
    try {
      const wasAdded = await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: tokenAddress,
            symbol: tokenSymbol,
            decimals: tokenDecimals,
            image: tokenImage,
          },
        },
      });

      if (wasAdded) {
        console.log("Token added to MetaMask!");
      } else {
        console.log("User canceled token addition.");
      }
    } catch (err) {
      console.error("Failed to add token:", err);
    }
  };

  return (
    <button
      onClick={addTokenToMetaMask}
      className="bg-blue-500 text-white px-4 py-2 rounded"
    >
      Add ShareCoin to MetaMask
    </button>
  );
};

export default AddShareCoinButton;
