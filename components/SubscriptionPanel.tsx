"use client";
import React from "react";
import { SubscriptionOption } from "@/app/page"; // Adjust path if needed

interface SubscriptionPanelProps {
  subscriptionActive: boolean;
  subscriptionPlan: string;
  subscriptionTime: number;
  onPlanChange: (plan: string) => void;
  onSubscribe: () => void;
  options: { [plan: string]: SubscriptionOption };
}

const SubscriptionPanel: React.FC<SubscriptionPanelProps> = ({
  subscriptionActive,
  subscriptionPlan,
  subscriptionTime,
  onPlanChange,
  onSubscribe,
  options,
}) => {
  return (
    <div style={styles.panel}>
      <h2 style={styles.panelHeader}>Subscription</h2>
      {subscriptionActive ? (
        <>
          <p style={styles.largeText}>
            <strong>Plan:</strong> {subscriptionPlan}
          </p>
          <p style={styles.largeText}>
            <strong>Time Remaining:</strong> {subscriptionTime} sec
          </p>
        </>
      ) : (
        <>
          <label style={styles.label}>Select Plan:</label>
          <select
            value={subscriptionPlan}
            onChange={(e) => onPlanChange(e.target.value)}
            style={styles.select}
          >
            {Object.keys(options).map((plan) => (
              <option key={plan} value={plan}>
                {plan} - {options[plan].cost} INC
              </option>
            ))}
          </select>
          <br />
          <button onClick={onSubscribe} style={styles.buttonPrimary}>
            Subscribe Now
          </button>
        </>
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
  label: {
    fontSize: "26px",
    marginRight: "0.5rem",
  },
  select: {
    padding: "0.75rem",
    margin: "0.75rem",
    fontSize: "26px",
    borderRadius: "4px",
    border: "1px solid #333",
    background: "#333",
    color: "#f0f0f0",
  },
  buttonPrimary: {
    padding: "1rem 2rem",
    marginTop: "0.5rem",
    backgroundColor: "#0070f3",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "26px",
  },
  largeText: {
    fontSize: "26px",
  },
};

export default SubscriptionPanel;
