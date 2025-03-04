// components/TokenSelector.tsx
import React from "react";
//import { Token } from "../pages/trade"; // Adjust the import path as needed

interface TokenSelectorProps {
  tokens: Token[];
  onSelect: (token: Token) => void;
  onClose: () => void;
}

const TokenSelector: React.FC<TokenSelectorProps> = ({ tokens, onSelect, onClose }) => {
  return (
    // Full-screen overlay for the modal
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-gray-900 rounded-lg p-12 w-[40rem] max-h-[40rem] overflow-y-auto">
        <h2 className="text-white text-4xl mb-8 text-center">Select a Token</h2>
        <ul>
          {tokens.map((token) => {
            return (
              <li
                key={token.address}
                className="flex items-center p-6 rounded hover:bg-gray-700 cursor-pointer mb-4"
                onClick={() => {
                  onSelect(token);
                  onClose();
                }}
              >
                <img
                  src={token.logo}
                  alt={token.symbol}
                  className="w-20 h-20 mr-4"
                />
                <span className="text-white text-3xl">{token.symbol}</span>
              </li>
            );
          })}
        </ul>
        <button
          className="mt-8 px-8 py-4 bg-blue-500 rounded text-white w-full text-3xl"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default TokenSelector;
