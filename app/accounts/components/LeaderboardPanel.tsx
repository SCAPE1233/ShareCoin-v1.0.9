"use client";

import React from "react";

export interface LeaderboardEntry {
  account: string;
  blocksMined: number;
}

interface LeaderboardPanelProps {
  leaderboard: LeaderboardEntry[];
}

const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({ leaderboard }) => {
  return (
    <div style={styles.panel}>
      <h2 style={styles.panelHeader}>Leaderboard</h2>
      {leaderboard.length === 0 ? (
        <p style={styles.largeText}>No data available.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Account</th>
              <th style={styles.tableHeader}>Blocks Mined</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, idx) => (
              <tr key={idx}>
                <td style={styles.tableCell}>{entry.account}</td>
                <td style={styles.tableCell}>{entry.blocksMined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  panel: {
    textAlign: "center",
    marginBottom: "1.5rem",
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
  table: {
    width: "100%",
    color: "#f0f0f0",
    fontSize: "26px",
  },
  tableHeader: {
    fontSize: "22px",
    padding: "0.5rem",
  },
  tableCell: {
    fontSize: "26px",
    padding: "0.5rem",
  },
};

export default LeaderboardPanel;
