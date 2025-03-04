"use client";

import React, { useEffect, useState } from "react";

// A small helper to format seconds into h, m, s
function formatHMS(secondsNumber: number): string {
  const h = Math.floor(secondsNumber / 3600);
  const remainder = secondsNumber % 3600;
  const m = Math.floor(remainder / 60);
  const s = Math.floor(remainder % 60);

  if (h > 0) {
    return `${h}h ${m}m ${s}s`;
  } else if (m > 0) {
    return `${m}m ${s}s`;
  } else {
    return `${s}s`;
  }
}

export default function AverageBlockTime() {
  const [averageBlockTime, setAverageBlockTime] = useState("N/A");

  useEffect(() => {
    // We'll poll every 15s
    const interval = setInterval(async () => {
      try {
        // Step 1) Fetch from your server, which returns { average: "6689.48" } or "N/A"
        const res = await fetch("http://18.215.230.251:3001/api/averageBlockTime");
        const data = await res.json(); // e.g. { average: "6689.48" }

        // Step 2) If it’s numeric, parse and convert to hh:mm:ss
        if (data.average === "N/A" || data.average === undefined) {
          setAverageBlockTime("N/A");
        } else {
          // Convert string -> number
          const secs = parseFloat(data.average);
          if (isNaN(secs)) {
            setAverageBlockTime("N/A");
          } else {
            const formatted = formatHMS(secs);
            setAverageBlockTime(formatted);
          }
        }
      } catch (err) {
        console.error("Failed to fetch local block time:", err);
        setAverageBlockTime("Error");
      }
    }, 15000);

    // Initial fetch once
    (async () => {
      try {
        const res = await fetch("http://18.215.230.251:3001/api/averageBlockTime");
        const data = await res.json();
        if (data.average === "N/A" || data.average === undefined) {
          setAverageBlockTime("N/A");
        } else {
          const secs = parseFloat(data.average);
          setAverageBlockTime(isNaN(secs) ? "N/A" : formatHMS(secs));
        }
      } catch (err) {
        console.error("Failed to fetch local block time:", err);
        setAverageBlockTime("Error");
      }
    })();

    return () => clearInterval(interval);
  }, []);

  return (
    <p className="text-lg mb-2">
      <span> Avg Block Time: </span>
      <span className="text-[#0df705]">{averageBlockTime}</span>
    </p>
  );
}
