"use client";

import React from "react";
import { BlockData } from "../page"; // adjust import if needed

interface BlockHistoryPanelProps {
  history: BlockData[];
}

const BlockHistoryPanel: React.FC<BlockHistoryPanelProps> = ({ history }) => {
  return (
    <div style={styles.panel}>
      <h2 style={styles.panelHeader}>Block History</h2>
      {history.length === 0 ? (
        <p style={styles.largeText}>No blocks found yet.</p>
      ) : (
        history.map((block, idx) => (
          <div key={idx} style={styles.blockItem}>
            <p style={styles.blockText}>
              <strong>Block #{block.blockNumber}</strong> – {block.timestamp}
            </p>
            <p style={styles.blockText}>Hash: {block.blockHash}</p>
            <p style={styles.blockText}>
              Reward: {block.reward} SHR – Mined by: {block.minedBy}
            </p>
          </div>
        ))
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  panel: {
    textAlign: "center",
    padding: "1rem",
    backgroundColor: "#000",
    borderRadius: "8px",
    fontSize: "26px",
  },
  panelHeader: {
    fontSize: "28px",
    marginBottom: "0.5rem",
  },
  largeText: {
    fontSize: "26px",
  },
  blockItem: {
    borderBottom: "1px solid #555",
    paddingBottom: "0.5rem",
    marginBottom: "0.5rem",
    textAlign: "left",
    fontSize: "26px",
  },
  blockText: {
    fontSize: "26px",
    margin: "0.25rem 0",
  },
};

export default BlockHistoryPanel;
