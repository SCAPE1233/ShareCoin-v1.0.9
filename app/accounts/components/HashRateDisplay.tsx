"use client";
import React from "react";

interface HashRateDisplayProps {
  effectiveHashRate: number;
}

const HashRateDisplay: React.FC<HashRateDisplayProps> = ({ effectiveHashRate }) => {
  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Hash Rate</h2>
      <p style={styles.rate}>{effectiveHashRate} H/s</p>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    textAlign: "center",
    padding: "1rem",
    backgroundColor: "#000",
    borderRadius: "8px",
    marginTop: "1rem",
  },
  header: {
    fontSize: "28px",
    marginBottom: "0.5rem",
  },
  rate: {
    fontSize: "32px",
    fontWeight: "bold",
  },
};

export default HashRateDisplay;
