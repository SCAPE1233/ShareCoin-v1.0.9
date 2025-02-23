const { ethers } = require("ethers");

// 1) Convert the original address to all-lowercase
const lowercased = "0xefD766cCb38EaF1dfd701853BFCe31359239f305".toLowerCase();
// "0xefd766ccb38eaf1dfd701853bfce31359239f305"

const checksummed = ethers.getAddress(lowercased);
console.log("Checksummed address:", checksummed);
// => eFd766cCb38EaF1DFd701853BfCE31359239F305
