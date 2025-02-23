"use client";

import React, { useState } from "react";

export default function SwapSettings({ closeModal }) {
  const [slippage, setSlippage] = useState("1.00%");

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-80" onClick={closeModal}>
      <div className="bg-gray-900 w-[500px] p-6 rounded-lg shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-3xl font-bold mb-4 text-white">Slippage Settings</h2>
        
        <input 
          type="text" 
          className="w-full p-3 rounded bg-black text-white border border-gray-600 mb-4"
          value={slippage}
          onChange={(e) => setSlippage(e.target.value)}
        />

        <button 
          className="w-full mt-4 bg-green-600 p-3 rounded-lg text-lg"
          onClick={closeModal}
        >
          Save & Close
        </button>
      </div>
    </div>
  );
}
