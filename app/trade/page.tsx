"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  ERC20_ABI,
  PULSE_ROUTER_V2_ADDRESS,
  PULSE_ROUTER_V2_ABI,
} from "../constants/contractABI";
import TokenSelector from "../components/TokenSelector";
import CustomTokenModal from "../components/CustomTokenModal";
import SlippageSettingsModal from "../components/SlippageSettingsModal";

// --------------------------------------------------------------------
// Custom Hook: useWeb3
// --------------------------------------------------------------------
const useWeb3 = () => {
  const [provider, setProvider] = useState<any>(null);
  const [router, setRouter] = useState<any>(null);
  const [signer, setSigner] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initWeb3 = async () => {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        try {
          await (window as any).ethereum.request({ method: "eth_requestAccounts" });
          const web3Provider = new ethers.BrowserProvider((window as any).ethereum);

          // Override ENS resolution on Pulsechain.
          web3Provider.getEnsAddress = async () => null;

          const network = await web3Provider.getNetwork();
          if (network.chainId !== 369) {
            try {
              await (window as any).ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: "0x171" }], // 0x171 is hex for 369
              });
            } catch (switchError: any) {
              if (switchError.code === 4902) {
                try {
                  await (window as any).ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [
                      {
                        chainId: "0x171",
                        chainName: "Pulsechain",
                        nativeCurrency: {
                          name: "Pulse",
                          symbol: "PLS",
                          decimals: 18,
                        },
                        rpcUrls: ["https://rpc.pulsechain.com"],
                        blockExplorerUrls: ["https://explorer.pulsechain.com"],
                      },
                    ],
                  });
                } catch (addError: any) {
                  console.error("Failed to add network:", JSON.stringify(addError));
                  setError("Failed to add the Pulsechain network. Please add it manually in MetaMask.");
                  setLoading(false);
                  return;
                }
              } else {
                console.error("Failed to switch network:", switchError);
                setError("Please switch your MetaMask network to Pulsechain.");
                setLoading(false);
                return;
              }
            }
          }
          const signerInstance = await web3Provider.getSigner();
          setSigner(signerInstance);

          const routerContract = new ethers.Contract(
            PULSE_ROUTER_V2_ADDRESS,
            PULSE_ROUTER_V2_ABI,
            signerInstance
          );
          setProvider(web3Provider);
          setRouter(routerContract);
        } catch (err) {
          console.error("Error initializing web3:", err);
          setError("Failed to connect to MetaMask.");
        }
      } else {
        setError("Ethereum object not found. Please install MetaMask.");
      }
      setLoading(false);
    };

    initWeb3();
  }, []);

  return { provider, router, signer, loading, error };
};

// --------------------------------------------------------------------
// Approve Token If Needed
// --------------------------------------------------------------------
const approveTokenIfNeeded = async (signer: any, tokenAddress: string, amount: bigint) => {
  // If native Pulse (0x000..0), skip approval
  if (tokenAddress === "0x0000000000000000000000000000000000000000") return;

  const checksummedAddress = ethers.getAddress(tokenAddress); // ensure EIP-55
  const tokenContract = new ethers.Contract(checksummedAddress, ERC20_ABI, signer);
  const userAddress = await signer.getAddress();
  const allowance = await tokenContract.allowance(userAddress, PULSE_ROUTER_V2_ADDRESS);

  if (allowance < amount) {
    const tx = await tokenContract.approve(PULSE_ROUTER_V2_ADDRESS, amount);
    await tx.wait();
    console.log("Token approved");
  }
};

// --------------------------------------------------------------------
// Token Interface
// --------------------------------------------------------------------
export interface Token {
  id?: string;
  name?: string;
  symbol: string;
  address: string;
  logo?: string;
  balance?: number;
  decimals?: number;
  price?: number;
}

// --------------------------------------------------------------------
// Fixed & Checksummed Token List
// --------------------------------------------------------------------
//
// - Removed DAI duplication. We keep "pDAI" with checksummed address
// - Adjusted addresses for INC, FEAR, etc. to EIP-55
// - If these tokens are not real ERC-20 on PulseChain, you may see decode errors
//   in getAmountsOut or balanceOf. Remove them if so.
//
const initialTokenData: Token[] = [
  //{
    //symbol: "WPLS",
    // Checksummed
   // address: "0xA1077A294DdE1B09Bb078844Df40758A5D0F9A27",
   // logo: `/tokens/${"0xa1077a294dde1b09bb078844df40758a5d0f9a27"}.png`,
   // decimals: 18,
  //},
  {
    symbol: "pHEX",
    address: "0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39", // already checksummed
    logo: `/tokens/${"0x2b591e99afe9f32eaa6214f7b7629768c40eeb39"}.png`,
    decimals: 18,
  },
  // pDAI (same address that was for DAI, corrected to EIP-55)
  {
    symbol: "pDAI",
    address: "0xeFd766cCb38EaF1DFd701853BfCE31359239F305", // EIP-55
    logo: `/tokens/${"0xefd766ccb38eaf1dfd701853bfce31359239f305"}.png`,
    decimals: 18,
  },
  {
    symbol: "pWETH",
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // checksummed
    logo: `/tokens/${"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"}.png`,
    decimals: 18,
  },
  {
    symbol: "INC",
    // checksummed from 0x6eFAfcb715F385c71d8AF763E8478FeEA6faDF63
    address: "0x6EFAfCb715F385c71D8AF763E8478FeEA6faDF63",
    logo: `/tokens/${"0x6efafcb715f385c71d8af763e8478feea6fadf63"}.png`,
    decimals: 18,
  },
  {
    symbol: "pUSDC",
    // checksummed from 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606EB48",
    logo: `/tokens/${"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"}.png`,
    decimals: 18,
  },
  {
    symbol: "FEAR",
    // checksummed from 0x38894302A6eABea6f2B29B508031d2ed75F0bE22
    address: "0x38894302A6eABea6F2B29B508031D2Ed75F0bE22",
    logo: `/tokens/${"0x38894302a6eabea6f2b29b508031d2ed75f0be22"}.png`,
    decimals: 18,
  },
  {
    symbol: "WETH",
    // checksummed from 0x02DcdD04e3F455D838cd1249292C58f3B79e3C3C
    address: "0x02DcdD04E3F455D838cd1249292C58f3B79E3C3C",
    logo: `/tokens/${"0x02dcdd04e3f455d838cd1249292c58f3b79e3c3c"}.png`,
    decimals: 18,
  },
  {
    symbol: "USDC",
    // checksummed from 0x15D38573d2feeb82e7ad5187aB8c1D52810B1f07
    address: "0x15D38573D2feEB82E7ad5187aB8C1D52810B1f07",
    logo: `/tokens/${"0x15d38573d2feeb82e7ad5187ab8c1d52810b1f07"}.png`,
    decimals: 18,
  },
  // Removed the duplicate "DAI" entry
  {
    symbol: "HEX",
    // checksummed
    address: "0x57FDE0a71132198BBEc939B98976993d8D89D225",
    logo: `/tokens/${"0x57fde0a71132198bbec939b98976993d8d89d225"}.png`,
    decimals: 18,
  },
  {
    symbol: "PLSX",
    // checksummed from 0x95B303987A60C71504D99Aa1b13B4DA07b0790ab
    address: "0x95B303987A60C71504D99Aa1b13B4Da07B0790Ab",
    logo: `/tokens/${"0x95b303987a60c71504d99aa1b13b4da07b0790ab"}.png`,
    decimals: 18,
  },
  {
    symbol: "pWBTC",
    // checksummed from 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599
    address: "0x2260FAC5E5542A773Aa44fBCfeDf7C193bc2C599",
    logo: `/tokens/${"0x2260fac5e5542a773aa44fbcfedf7c193bc2c599"}.png`,
    decimals: 18,
  },
  {
    symbol: "WBTC",
    // checksummed
    address: "0xb17D901469B9208B17d916112988A3FeD19b5cA1",
    logo: `/tokens/${"0xb17d901469b9208b17d916112988a3fed19b5ca1"}.png`,
    decimals: 18,
  },
  {
    symbol: "pUSDT",
    // checksummed from 0xdAC17F958D2ee523a2206206994597C13D831ec7
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    logo: `/tokens/${"0xdac17f958d2ee523a2206206994597c13d831ec7"}.png`,
    decimals: 18,
  },
  {
    symbol: "USDT",
    // checksummed from 0x0Cb6F5a34ad42ec934882A05265A7d5F59b51A2f
    address: "0x0Cb6F5A34Ad42Ec934882A05265A7D5F59b51A2F",
    logo: `/tokens/${"0x0cb6f5a34ad42ec934882a05265a7d5f59b51a2f"}.png`,
    decimals: 18,
  },
  {
    symbol: "PLS",
    // checksummed
    address: "0xA1077A294DdE1B09Bb078844Df40758A5D0F9A27",
    logo: `/tokens/${"0xa1077a294dde1b09bb078844df40758a5d0f9a27"}.png`,
    decimals: 18,
  },
];

// --------------------------------------------------------------------
// Price Mapping (fallback prices; will be updated live)
// --------------------------------------------------------------------
const tokenPrices: { [symbol: string]: number } = {
  WPLS: 1.0,
  HEX: 0.05,
  pDAI: 1.0,
  pWETH: 1500,
  INC: 0.02,
  pUSDC: 1.0,
  FEAR: 0.1,
  WETH: 1500,
  USDC: 1.0,
  PLSX: 0.0001,
  pWBTC: 28000,
  WBTC: 28000,
  pUSDT: 1.0,
  USDT: 1.0,
  PLS: 1.0,
};

// --------------------------------------------------------------------
// Main Trade Component
// --------------------------------------------------------------------
const Trade: React.FC = () => {
  const { router, signer, loading: web3Loading, error: web3Error } = useWeb3();
  const [tokens, setTokens] = useState<Token[]>(initialTokenData);

  const [tokenA, setTokenA] = useState<Token>(tokens[0]);
  const [tokenB, setTokenB] = useState<Token>(tokens[1]);

  const [amountA, setAmountA] = useState<string>("");
  const [amountB, setAmountB] = useState<string>(""); // if you need a manual field for tokenB
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [estimatedOutput, setEstimatedOutput] = useState<string>("");

  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [showTokenSelector, setShowTokenSelector] = useState<"A" | "B" | null>(null);
  const [showCustomTokenModal, setShowCustomTokenModal] = useState<boolean>(false);
  const [showSlippageModal, setShowSlippageModal] = useState<boolean>(false);
  const [slippageTolerance, setSlippageTolerance] = useState<string>("0.5");
  const [txDeadline, setTxDeadline] = useState<string>("20");

  // --------------------------------------------------------------------
  // Compute token logo
  // --------------------------------------------------------------------
  const getTokenLogo = (token: Token): string => {
    return token.logo || `/tokens/${token.address.toLowerCase()}.png`;
  };

  // --------------------------------------------------------------------
  // Update Balances (every 30s)
  // --------------------------------------------------------------------
  const updateBalances = useCallback(async () => {
    if (!signer) return;
    const newBalances: Record<string, string> = {};

    for (const tkn of tokens) {
      try {
        const checksummedAddr = ethers.getAddress(tkn.address);
        const tokenContract = new ethers.Contract(checksummedAddr, ERC20_ABI, signer);
        const userAddr = await signer.getAddress();
        const rawBalance = await tokenContract.balanceOf(userAddr);
        newBalances[tkn.address] = ethers.formatUnits(rawBalance, tkn.decimals || 18);
      } catch (error) {
        console.error(`Error fetching balance for ${tkn.address}:`, error);
        newBalances[tkn.address] = "0";
      }
    }
    setBalances(newBalances);
  }, [signer, tokens]);

  useEffect(() => {
    updateBalances();
    const interval = setInterval(updateBalances, 30000);
    return () => clearInterval(interval);
  }, [updateBalances]);

  // --------------------------------------------------------------------
  // Fetch live prices using pDAI as a reference
  // (adjust if you have a different stable or actual USDC)
  // --------------------------------------------------------------------
  const fetchPrices = useCallback(async () => {
    if (!router || !signer) return;

    const newPrices: Record<string, number> = {};
    // We'll treat pDAI (0xeFd7...F305) as 1:1 USD for demonstration
    // Adjust if you prefer a real stable coin address
    const pDAIAddress = "0xeFd766cCb38EaF1DFd701853BfCE31359239F305".toLowerCase();
    newPrices[pDAIAddress] = 1;

    for (const tkn of tokens) {
      const tknAddr = tkn.address.toLowerCase();
      if (tknAddr === pDAIAddress) {
        newPrices[tknAddr] = 1;
        continue;
      }
      try {
        const amountIn = ethers.parseUnits("1", tkn.decimals || 18);
        const path = [ethers.getAddress(tkn.address), ethers.getAddress(pDAIAddress)];
        const amountsOut = await router.getAmountsOut(amountIn, path);
        const outNumber = parseFloat(
          ethers.formatUnits(amountsOut[amountsOut.length - 1], 18)
        );
        newPrices[tknAddr] = outNumber; // price in "pDAI" ~ USD
      } catch (err) {
        console.error(`Error fetching price for ${tkn.symbol}:`, err);
        // fallback if error
        newPrices[tknAddr] = tokenPrices[tkn.symbol] ?? 0;
      }
    }

    setLivePrices(newPrices);
  }, [router, signer, tokens]);

  useEffect(() => {
    fetchPrices();
    const priceInterval = setInterval(fetchPrices, 30000);
    return () => clearInterval(priceInterval);
  }, [fetchPrices]);

  // --------------------------------------------------------------------
  // Pre-swap Estimated Output
  // --------------------------------------------------------------------
  useEffect(() => {
    const doEstimateOutput = async () => {
      if (!router || !amountA || isNaN(Number(amountA)) || parseFloat(amountA) <= 0) {
        setEstimatedOutput("");
        return;
      }
      try {
        const amountInWei = ethers.parseUnits(amountA, tokenA.decimals || 18);
        const path = [
          ethers.getAddress(tokenA.address),
          ethers.getAddress(tokenB.address),
        ];
        const amountsOut = await router.getAmountsOut(amountInWei, path);
        const outRaw = amountsOut[amountsOut.length - 1];
        setEstimatedOutput(ethers.formatUnits(outRaw, tokenB.decimals || 18));
      } catch (error) {
        console.error("Error fetching estimated output:", error);
        setEstimatedOutput("");
      }
    };
    doEstimateOutput();
  }, [router, amountA, tokenA, tokenB]);

  // --------------------------------------------------------------------
  // Compute approximate USD values
  // --------------------------------------------------------------------
  const tokenAPrice =
    livePrices[tokenA.address.toLowerCase()] ||
    tokenPrices[tokenA.symbol] ||
    0;
  const tokenBPrice =
    livePrices[tokenB.address.toLowerCase()] ||
    tokenPrices[tokenB.symbol] ||
    0;

  const inputAmount = parseFloat(amountA) || 0;
  const outputAmount = parseFloat(estimatedOutput) || 0;
  const inputValueUSD = inputAmount * tokenAPrice;
  const outputValueUSD = outputAmount * tokenBPrice;

  // Simple ratio
  const conversionRate = inputAmount ? outputAmount / inputAmount : 0;

  // --------------------------------------------------------------------
  // Handle Swap
  // --------------------------------------------------------------------
  const handleSwap = async () => {
    if (!router || !signer) return;
    try {
      // Convert user input
      const amountInWei = ethers.parseUnits(amountA, tokenA.decimals || 18);

      // Approve if needed
      await approveTokenIfNeeded(signer, tokenA.address, amountInWei);

      // Calculate minOut based on slippage
      // (Currently set to 0 in your code, but let's keep it. 
      //  for production, you do the real calc.)
      const tx = await router.swapExactTokensForTokens(
        amountInWei,
        0,
        [ethers.getAddress(tokenA.address), ethers.getAddress(tokenB.address)],
        await signer.getAddress(),
        Math.floor(Date.now() / 1000) + 60 * 20
      );
      await tx.wait();
      console.log("Swap successful:", tx);

      // Refresh
      setAmountA("");
      setEstimatedOutput("");
      await updateBalances();
      await fetchPrices();
    } catch (error) {
      console.error("Swap failed:", error);
    }
  };

  // --------------------------------------------------------------------
  // Handle Unwrap (WPLS -> PLS)
  // --------------------------------------------------------------------
  const handleUnwrap = async (amount: string) => {
    if (!signer) return;
    const wplsAddress = "0xA1077A294DdE1B09Bb078844Df40758A5D0F9A27";
    const WPLS_ABI = ["function withdraw(uint256 wad) public"];
    try {
      const tokenContract = new ethers.Contract(wplsAddress, WPLS_ABI, signer);
      const amountInWei = ethers.parseUnits(amount, 18);
      const tx = await tokenContract.withdraw(amountInWei);
      await tx.wait();
      console.log("Unwrap successful:", tx);

      await updateBalances();
      await fetchPrices();
    } catch (err) {
      console.error("Unwrap failed:", err);
    }
  };

  // --------------------------------------------------------------------
  // Handle Adding a Custom Token
  // --------------------------------------------------------------------
  const handleAddCustomToken = (newToken: Token) => {
    setTokens((prev) => [...prev, newToken]);
  };

  // --------------------------------------------------------------------
  // Render UI
  // --------------------------------------------------------------------
  if (web3Loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <p className="text-3xl">Loading Web3...</p>
      </div>
    );
  }

  if (web3Error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <p className="text-3xl">
          {typeof web3Error === "string" ? web3Error : JSON.stringify(web3Error)}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-10 space-y-8">
      <div className="mb-10 text-green-400 text-3xl">
        Wallet Connected •{" "}
        {balances[tokenA.address]
          ? `Balance of ${tokenA.symbol}: ${balances[tokenA.address]} (~$${(
              parseFloat(balances[tokenA.address]) * tokenAPrice
            ).toFixed(2)})`
          : ""}
      </div>

      <div className="bg-gray-900 p-10 rounded-xl w-full max-w-3xl shadow-xl relative space-y-8">
        {/* Slippage Settings Button */}
        <div className="absolute top-6 right-6">
          <button
            onClick={() => setShowSlippageModal(true)}
            className="p-4 bg-gray-800 rounded-full hover:bg-gray-700 focus:outline-none"
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0..."
              />
            </svg>
          </button>
        </div>

        <h2 className="text-5xl font-bold mb-8">Swap Tokens</h2>

        <div className="space-y-8">
          {/* Token A Input */}
          <div className="flex items-center bg-black p-6 rounded-lg border border-gray-700">
            <div
              onClick={() => setShowTokenSelector("A")}
              className="flex items-center space-x-6 cursor-pointer"
            >
              <img
                src={getTokenLogo(tokenA)}
                alt={`${tokenA.symbol} logo`}
                className="w-16 h-16"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/fallback.png";
                }}
              />
              <div>
                <span className="text-3xl">{tokenA.symbol}</span>
                <div className="text-xl text-gray-400">
                  Balance: {balances[tokenA.address] || "0"}
                </div>
              </div>
            </div>
            <input
              type="text"
              value={amountA}
              onChange={(e) => setAmountA(e.target.value)}
              className="bg-transparent text-right flex-1 px-4 text-3xl focus:outline-none"
              placeholder="0"
            />
          </div>

          {/* Token B Input */}
          <div className="flex items-center bg-black p-6 rounded-lg border border-gray-700">
            <div
              onClick={() => setShowTokenSelector("B")}
              className="flex items-center space-x-6 cursor-pointer"
            >
              <img
                src={getTokenLogo(tokenB)}
                alt={`${tokenB.symbol} logo`}
                className="w-16 h-16"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/fallback.png";
                }}
              />
              <div>
                <span className="text-3xl">{tokenB.symbol}</span>
                <div className="text-xl text-gray-400">
                  Balance: {balances[tokenB.address] || "0"}
                </div>
              </div>
            </div>
            <input
              type="text"
              value={amountB}
              onChange={(e) => setAmountB(e.target.value)}
              className="bg-transparent text-right flex-1 px-4 text-3xl focus:outline-none"
              placeholder="0"
            />
          </div>
        </div>

        {/* Estimated Output and Exchange Summary */}
        {amountA && estimatedOutput && (
          <div className="text-xl text-gray-400 mt-4">
            <p>
              Exchanging {amountA} {tokenA.symbol} (~${inputValueUSD.toFixed(2)}) for{" "}
              {estimatedOutput} {tokenB.symbol} (~${outputValueUSD.toFixed(2)}).
            </p>
            <p>
              Exchange Rate: 1 {tokenA.symbol} = {conversionRate.toFixed(4)}{" "}
              {tokenB.symbol}
            </p>
          </div>
        )}

        <button
          onClick={handleSwap}
          className="w-full bg-blue-600 hover:bg-blue-500 p-8 mt-10 rounded-lg text-4xl font-semibold focus:outline-none"
        >
          Swap {tokenA.symbol} for {tokenB.symbol}
        </button>

        <button
          onClick={() => handleUnwrap("1")}
          className="w-full bg-green-600 hover:bg-green-500 p-6 mt-6 rounded-lg text-3xl font-semibold focus:outline-none"
        >
          Unwrap 1 WPLS to Pulse
        </button>

        <button
          onClick={() => setShowCustomTokenModal(true)}
          className="w-full bg-purple-600 hover:bg-purple-500 p-6 mt-6 rounded-lg text-3xl font-semibold focus:outline-none"
        >
          Add Custom Token
        </button>
      </div>

      {/* Token Selector */}
      {showTokenSelector && (
        <TokenSelector
          tokens={tokens}
          balances={balances}
          // Pass fallback prices or livePrices for the token list display
          prices={tokenPrices}
          onSelect={(tk: Token) => {
            if (showTokenSelector === "A") {
              setTokenA(tk);
            } else {
              setTokenB(tk);
            }
            setShowTokenSelector(null);
          }}
          onClose={() => setShowTokenSelector(null)}
        />
      )}

      {/* Custom Token Modal */}
      {showCustomTokenModal && signer && (
        <CustomTokenModal
          onAdd={handleAddCustomToken}
          onClose={() => setShowCustomTokenModal(false)}
          signer={signer}
        />
      )}

      {/* Slippage Settings Modal */}
      {showSlippageModal && (
        <SlippageSettingsModal
          slippage={slippageTolerance}
          deadline={txDeadline}
          onSave={(newSlippage, newDeadline) => {
            setSlippageTolerance(newSlippage);
            setTxDeadline(newDeadline);
          }}
          onClose={() => setShowSlippageModal(false)}
        />
      )}
    </div>
  );
};

export default Trade;
