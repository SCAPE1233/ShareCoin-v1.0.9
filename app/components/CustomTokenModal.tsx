"use client";

import React, { useState } from "react";
import { ethers } from "ethers";
//import type { Token } from "../app/trade/page"; // Adjust the path as needed
//import { ERC20_ABI } from "../constants/contractABI";

interface CustomTokenModalProps {
  onAdd: (token: Token) => void;
  onClose: () => void;
  signer: any;
}

const CustomTokenModal: React.FC<CustomTokenModalProps> = ({
  onAdd,
  onClose,
  signer,
}) => {
  const [tokenAddress, setTokenAddress] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleAddToken = async () => {
    setError("");
    if (!tokenAddress) {
      setError("Please enter a token address.");
      return;
    }
    setLoading(true);
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, signer);
      const symbol = await tokenContract.symbol();
      const decimals = await tokenContract.decimals();
      const newToken: Token = {
        symbol,
        address: tokenAddress,
        logo: "/tokens/default.png", // Use a default image or let the user specify later
        decimals,
      };
      onAdd(newToken);
      onClose();
    } catch (err) {
      console.error("Error fetching token info:", err);
      setError("Failed to fetch token info. Please check the address.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-gray-900 rounded-lg p-12 w-[60rem] max-h-[40rem] overflow-y-auto">
        <h2 className="text-white text-5xl mb-8">Add Custom Token</h2>
        <input
          type="text"
          placeholder="Token Contract Address"
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
          className="w-full p-6 rounded bg-gray-800 text-white text-3xl mb-6"
        />
        {error && <p className="text-red-500 text-3xl mb-6">{error}</p>}
        <div className="flex space-x-6">
          <button
            onClick={handleAddToken}
            className="flex-1 bg-green-600 hover:bg-green-500 p-6 rounded text-3xl font-semibold focus:outline-none"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Token"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-red-600 hover:bg-red-500 p-6 rounded text-3xl font-semibold focus:outline-none"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomTokenModal;
