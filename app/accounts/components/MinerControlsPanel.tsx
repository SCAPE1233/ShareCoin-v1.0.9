"use client";
import React from "react";

interface MinerControlsPanelProps {
  minerLevel: number;
  onMinerLevelChange: (level: number) => void;
  hashPower: number;
  isMining: boolean;
  onStart: () => void;
  onStop: () => void;
  onUpgrade: () => void;
}

const MinerControlsPanel: React.FC<MinerControlsPanelProps> = ({
  minerLevel,
  onMinerLevelChange,
  hashPower,
  isMining,
  onStart,
  onStop,
  onUpgrade,
}) => {
  return (
    <div style={styles.panel}>
      <h2 style={styles.panelHeader}>Miner Controls</h2>
      <div style={{ marginBottom: "1rem" }}>
        <label style={styles.label}>Select Miner Level: </label>
        <select
          value={minerLevel}
          onChange={(e) => onMinerLevelChange(parseInt(e.target.value))}
          style={styles.select}
        >
          {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
            <option key={level} value={level}>
              Level {level}
            </option>
          ))}
        </select>
      </div>
      <p style={styles.largeText}>
        Simulated Hash Rate: {minerLevel * 10} - {minerLevel * 1000} H/s
      </p>
      <div style={{ marginTop: "1rem" }}>
        {!isMining ? (
          <button onClick={onStart} style={styles.buttonPrimary}>
            Start Mining
          </button>
        ) : (
          <button onClick={onStop} style={styles.buttonDanger}>
            Stop Mining
          </button>
        )}
        <button onClick={onUpgrade} style={styles.buttonSuccess}>
          Upgrade Hash
        </button>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  // same inline styles
};

export default MinerControlsPanel;
