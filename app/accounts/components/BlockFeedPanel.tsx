"use client";
import React from "react";
import { BlockData } from "@/app/page"; // Adjust the path if needed

// A subcomponent for each block item, with custom colors for each piece of data.
const BlockItem: React.FC<{ block: BlockData }> = ({ block }) => {
  return (
    <div style={itemStyles.container}>
      <p style={itemStyles.blockNumber}>
        <strong>Block #{block.blockNumber}</strong>
      </p>
      <p style={itemStyles.hash}>
        Hash: {block.blockHash}
      </p>
      <p style={itemStyles.reward}>
        Reward: {block.reward} SHR
      </p>
      <p style={itemStyles.default}>
        Time: {block.timestamp}
      </p>
      <p style={itemStyles.default}>
        Mined by: {block.miner}
      </p>
    </div>
  );
};

const BlockFeedPanel: React.FC<{ blockFeed: BlockData[] }> = ({ blockFeed }) => {
  return (
    <div style={styles.panel}>
      <h2 style={styles.panelHeader}>Block Feed</h2>
      <div style={styles.scrollBox}>
        {blockFeed.length === 0 ? (
          <p style={styles.largeText}>No blocks found yet.</p>
        ) : (
          blockFeed.map((block, idx) => (
            <BlockItem key={idx} block={block} />
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
    margin: "1rem auto",
    width: "80%",
  },
  panelHeader: {
    fontSize: "28px",
    marginBottom: "0.5rem",
  },
  scrollBox: {
    backgroundColor: "#000",
    padding: "1rem",
    borderRadius: "8px",
    maxHeight: "400px",
    overflowY: "auto",
    margin: "0 auto",
    fontSize: "26px",
  },
  largeText: {
    fontSize: "26px",
  },
};

const itemStyles: { [key: string]: React.CSSProperties } = {
  container: {
    borderBottom: "1px solid #555",
    paddingBottom: "0.5rem",
    marginBottom: "0.5rem",
    textAlign: "left",
  },
  blockNumber: {
    fontSize: "26px",
    margin: "0.25rem 0",
    color: "green",
  },
  hash: {
    fontSize: "26px",
    margin: "0.25rem 0",
    color: "yellow",
  },
  reward: {
    fontSize: "26px",
    margin: "0.25rem 0",
    color: "green",
  },
  default: {
    fontSize: "26px",
    margin: "0.25rem 0",
    color: "#f0f0f0",
  },
};

export default BlockFeedPanel;
