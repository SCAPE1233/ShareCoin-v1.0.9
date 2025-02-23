// pages/api/graphqlProxy.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }
  try {
    const response = await fetch("https://scan.mypinata.cloud/tokens/" + JSON.parse(req.body).variables.address, {
      method: "GET"
    });
    res.status(response.status);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error in proxy:", error);
    res.status(500).json({ error: "Internal server error", details: error });
  }
}
