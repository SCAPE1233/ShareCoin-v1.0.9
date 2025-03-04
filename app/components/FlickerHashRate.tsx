"use client";
import React, { useState, useEffect } from "react";

enum PlanType {
  None = 0,
  Basic = 1,
  Standard = 2,
  Premium = 3,
  Lifetime = 4,
}

function getPlanHashRate(plan: PlanType): number {
  switch (plan) {
    case PlanType.Basic:    return 500;
    case PlanType.Standard: return 2000;
    case PlanType.Premium:  return 5000;
    case PlanType.Lifetime: return 5555;
    default:                return 0;
  }
}

interface FlickerHashRateProps {
  plan: PlanType;
  minerActive: boolean;
}

export default function FlickerHashRate({ plan, minerActive }: FlickerHashRateProps) {
  // If the miner is active, we flicker around plan's hash rate, else 0
  const baseRate = minerActive ? getPlanHashRate(plan) : 0;

  // We'll store a dummy counter to force re-renders
  const [updateKey, setUpdateKey] = useState(0);

  useEffect(() => {
    // Re-render every 10s, for example
    const interval = setInterval(() => {
      setUpdateKey(k => k + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  let displayed: number;
  if (baseRate === 0) {
    // If not mining, show exactly 0
    displayed = 0;
  } else {
    // Flicker around baseRate ±2
    const offset = (Math.random() * 4) - 2; 
    displayed = baseRate + offset;
  }

  return (
    <p className="text-lg mb-2">
      <span>Hash Rate: </span>
      <span className="text-[#0df705]">
        {displayed.toFixed(2)} H/s
      </span>
    </p>
  );
}
