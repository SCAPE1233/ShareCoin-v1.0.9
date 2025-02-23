/**
 * 1) Make sure you run `npm install ethers` (or yarn add ethers) 
 *    in this folder.
 * 2) Place your array in this script or import it from a JSON file.
 * 3) node repairAddresses.js
 * 4) Copy the output back into your code.
 */

const { ethers } = require("ethers");

// Original array (paste your entire array in here)
const originalTokens = [
  {
    symbol: "pDAI",
    address: "0xefD766cCb38EaF1dfd701853BFCe31359239f305",
    logo: "/tokens/0xefd766ccb38eaf1dfd701853bfce31359239f305.png",
    decimals: 18,
  },
  {
    symbol: "INC",
    address: "0x6eFAfcb715F385c71d8AF763E8478FeEA6faDF63",
    logo: "/tokens/0x6efafcb715f385c71d8af763e8478feea6fadf63.png",
    decimals: 18,
  },
  // ... other tokens
];

const repairedTokens = originalTokens.map((token) => {
  const lower = token.address.toLowerCase();
  let checksummed = "";
  try {
    checksummed = ethers.getAddress(lower);
  } catch (err) {
    console.error(`Bad address: ${token.address}, skipping or removing this token.`);
    return null;
  }

  // Now generate a new token object with the corrected address and logo path
  return {
    ...token,
    address: checksummed,
    logo: `/tokens/${checksummed.toLowerCase()}.png`, // keep .png name in lowercase
  };
});

// Filter out any nulls (where the address was totally invalid)
const validTokens = repairedTokens.filter(Boolean);

console.log("Repaired Tokens:\n", JSON.stringify(validTokens, null, 2));
