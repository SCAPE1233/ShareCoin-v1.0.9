"use client";
import React from "react";

interface DebugPanelProps {
  simulationSpeed: number;
  difficultySensitivity: number;
  hashCounter: number;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ simulationSpeed, difficultySensitivity, hashCounter }) => {
  return (
    <div style={styles.panel}>
      <h2 style={styles.header}>Debug Panel</h2>
      <p style={styles.text}>Simulation Speed: {simulationSpeed}x</p>
      <p style={styles.text}>Difficulty Sensitivity: {difficultySensitivity}</p>
      <p style={styles.text}>Total Hashes: {hashCounter}</p>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  panel: {
    padding: "1rem",
    backgroundColor: "#000",
    borderRadius: "8px",
    margin: "1rem 0",
    color: "#fff",
    textAlign: "center",
  },
  header: {
    fontSize: "26px",
    marginBottom: "0.5rem",
  },
  text: {
    fontSize: "26px",
    margin: "0.25rem 0",
  },
};

export default DebugPanel;
