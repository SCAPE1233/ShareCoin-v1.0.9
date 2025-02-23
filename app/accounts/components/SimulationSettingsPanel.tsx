"use client";
import React from "react";

interface SimulationSettingsPanelProps {
  simulationSpeed: number;
  difficultySensitivity: number;
  poolMode: string;
  onSpeedChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSensitivityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPoolModeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const SimulationSettingsPanel: React.FC<SimulationSettingsPanelProps> = ({
  simulationSpeed,
  difficultySensitivity,
  poolMode,
  onSpeedChange,
  onSensitivityChange,
  onPoolModeChange,
}) => {
  return (
    <div style={styles.panel}>
      <h2 style={styles.panelHeader}>Simulation Settings</h2>
      <div style={styles.settingRow}>
        <label style={styles.label}>Simulation Speed (0.5x - 3x):</label>
        <input
          type="range"
          min="0.5"
          max="3"
          step="0.1"
          value={simulationSpeed}
          onChange={onSpeedChange}
          style={styles.slider}
        />
        <span style={styles.largeText}>{simulationSpeed}x</span>
      </div>
      <div style={styles.settingRow}>
        <label style={styles.label}>Difficulty Sensitivity (0.5 - 2):</label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={difficultySensitivity}
          onChange={onSensitivityChange}
          style={styles.slider}
        />
        <span style={styles.largeText}>{difficultySensitivity}</span>
      </div>
      <div style={styles.settingRow}>
        <label style={styles.label}>Pool Mode:</label>
        <select value={poolMode} onChange={onPoolModeChange} style={styles.select}>
          <option value="Solo">Solo</option>
          <option value="Pool">Pool</option>
        </select>
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
  settingRow: {
    marginBottom: "1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
  },
  label: {
    fontSize: "26px",
    marginRight: "0.5rem",
  },
  slider: {
    verticalAlign: "middle",
  },
  select: {
    padding: "0.75rem",
    fontSize: "26px",
    borderRadius: "4px",
    border: "1px solid #333",
    background: "#333",
    color: "#f0f0f0",
  },
  largeText: {
    fontSize: "26px",
  },
};

export default SimulationSettingsPanel;
