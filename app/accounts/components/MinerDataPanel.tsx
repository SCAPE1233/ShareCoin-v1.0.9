"use client";
import React from "react";

const MinerDataPanel: React.FC = () => {
  // This is a placeholder panel. Replace or expand with your miner data details.
  return (
    <div style={styles.panel}>
      <h2 style={styles.header}>Miner Data</h2>
      <p style={styles.text}>Additional miner data and analytics can be displayed here.</p>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  panel: {
    textAlign: "center",
    padding: "1rem",
    backgroundColor: "#000",
    borderRadius: "8px",
  },
  header: {
    fontSize: "28px",
    marginBottom: "0.5rem",
  },
  text: {
    fontSize: "26px",
  },
};

export default MinerDataPanel;
