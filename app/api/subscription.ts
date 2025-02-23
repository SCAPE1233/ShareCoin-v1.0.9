// pages/api/subscription.ts
import type { NextApiRequest, NextApiResponse } from "next";

// For testing, we use an in-memory store.
// In production, replace this with a proper database.
let subscriptionsStore: { [address: string]: { expiresAt: number; hashPower: number } } = {};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const { address } = req.query;
    if (!address || typeof address !== "string") {
      return res.status(400).json({ error: "Address is required" });
    }
    const subscription = subscriptionsStore[address.toLowerCase()];
    return res.status(200).json({ subscription });
  } else if (req.method === "POST") {
    const { address, expiresAt, hashPower } = req.body;
    if (!address || !expiresAt || !hashPower) {
      return res.status(400).json({ error: "Missing data" });
    }
    subscriptionsStore[address.toLowerCase()] = { expiresAt, hashPower };
    return res.status(200).json({ success: true });
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
