"use client";

import React from "react";
import WalletDisplay from "./WalletDisplay"; // adjust the path if needed

interface AccountPoolPanelProps {
  account: string;
  confirmedSHR: number;
  unconfirmedSHR: number;
  minedBlocks: number;
  poolHashRate: string;
  activeMiners: number;
  networkHashRate: string;
  averageBlockTime: string;
  onUpgrade?: () => void; // optional callback for upgrade action
}

const AccountPoolPanel: React.FC<AccountPoolPanelProps> = ({
  account,
  confirmedSHR,
  unconfirmedSHR,
  minedBlocks,
  poolHashRate,
  activeMiners,
  networkHashRate,
  averageBlockTime,
  onUpgrade,
}) => {
  return (
    <div style={styles.flexPanel}>
      <div style={styles.infoBox}>
        <h2 style={styles.panelHeader}>My Account</h2>
        <p style={styles.largeText}><strong>Account:</strong> {account}</p>
        <WalletDisplay balance={confirmedSHR} />
        <p style={styles.largeText}><strong>Unconfirmed SHR:</strong> {unconfirmedSHR}</p>
        <p style={styles.largeText}><strong>Mined Blocks:</strong> {minedBlocks}</p>
        {onUpgrade && (
          <button style={styles.buttonUpgrade} onClick={onUpgrade}>
            Upgrade Miner
          </button>
        )}
      </div>
      <div style={styles.infoBox}>
        <h2 style={styles.panelHeader}>Pool Info</h2>
        <p style={styles.largeText}><strong>Pool Hash Rate:</strong> {poolHashRate}</p>
        <p style={styles.largeText}><strong>Active Miners:</strong> {activeMiners}</p>
        <p style={styles.largeText}><strong>Network Hash Rate:</strong> {networkHashRate}</p>
        <p style={styles.largeText}><strong>Avg. Block Time:</strong> {averageBlockTime}</p>
      </div>
    </div>
  );
};

const styles = {
  flexPanel: { display: "flex", justifyContent: "space-around", marginBottom: "1.5rem" },
  infoBox: { maxWidth: "600px", textAlign: "left", fontSize: "36px" },
  panelHeader: { fontSize: "36px", marginBottom: "0.5rem" },
  largeText: { fontSize: "36px" },
  buttonUpgrade: {
    padding: "1rem 2rem",
    fontSize: "32px",
    marginTop: "1rem",
    backgroundColor: "#0070f3",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
};

export default AccountPoolPanel;
