import React from "react";

interface WalletDisplayProps {
  balance: number;
}

const WalletDisplay: React.FC<WalletDisplayProps> = ({ balance }) => {
  return (
    <div style={{ display: "flex", alignItems: "center", fontSize: "40px", color: "#f0f0f0" }}>
      <img
        src="/coin-icon.png"  // Ensure this path points to your coin icon in the public folder
        alt="Coin Icon"
        style={{ width: "45px", height: "45px", marginRight: "30px" }}
      />
      <span>{balance} SHR</span>
    </div>
  );
};

export default WalletDisplay;
