"use client";
import React, { useEffect, useState } from "react";

function formatHMS(secondsNumber: number): string {
  // ...
}

export default function AverageBlockTime() {
  const [averageBlockTime, setAverageBlockTime] = useState("N/A");

  useEffect(() => {
    const fetchBlockTime = async () => {
      try {
        // Make sure we actually await and store the fetch response
        const res = await fetch("https://sharecoinmining.com/api/averageBlockTime");
        if (!res.ok) {
          throw new Error(`Server responded with status ${res.status}`);
        }
        const data = await res.json();

        if (!data || data.average === "N/A") {
          setAverageBlockTime("N/A");
          return;
        }

        const secs = parseFloat(data.average);
        setAverageBlockTime(isNaN(secs) ? "N/A" : formatHMS(secs));
      } catch (err) {
        console.error("Failed to fetch local block time:", err);
        setAverageBlockTime("Error");
      }
    };

    // Poll every 15 seconds
    const interval = setInterval(fetchBlockTime, 15000);
    // Also fetch immediately once
    fetchBlockTime();

    return () => clearInterval(interval);
  }, []);

  return (
    <p className="text-lg mb-2">
      <span>Avg Block Time: </span>
      <span className="text-[#0df705]">{averageBlockTime}</span>
    </p>
  );
}
