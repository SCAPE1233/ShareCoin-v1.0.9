"use client";
import React from "react";

interface HistoryLogPanelProps {
  logEntries: string[];
}

const HistoryLogPanel: React.FC<HistoryLogPanelProps> = ({ logEntries }) => {
  return (
    <div style={styles.panel}>
      <h2 style={styles.panelHeader}>Block History</h2>
      <div style={styles.scrollBoxSmall}>
        {logEntries.length === 0 ? (
          <p style={styles.largeText}>No history available.</p>
        ) : (
          logEntries.map((entry, idx) => (
            <p key={idx} style={styles.logText}>{entry}</p>
          ))
        )}
      </div>
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
  scrollBoxSmall: {
    backgroundColor: "#000",
    padding: "1rem",
    borderRadius: "8px",
    maxHeight: "200px",
    overflowY: "auto",
    margin: "0 auto",
    width: "80%",
    fontSize: "26px",
  },
  logText: {
    margin: "0.25rem 0",
    fontSize: "26px",
  },
  largeText: {
    fontSize: "26px",
  },
};

export default HistoryLogPanel;
