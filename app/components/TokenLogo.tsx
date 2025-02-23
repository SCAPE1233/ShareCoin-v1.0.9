"use client";

import React, { useState, useEffect } from "react";

interface UniswapToken {
  chainId: number;
  address: string;
  symbol: string;
  logoURI: string;
}

const useUniswapTokenList = () => {
  const [tokenList, setTokenList] = useState<UniswapToken[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokenList = async () => {
      try {
        const res = await fetch("https://tokens.uniswap.org");
        const data = await res.json();
        setTokenList(data.tokens);
      } catch (err) {
        console.error("Error fetching Uniswap token list:", err);
        setError("Failed to fetch token list");
      } finally {
        setLoading(false);
      }
    };

    fetchTokenList();
  }, []);

  return { tokenList, loading, error };
};

interface TokenLogoProps {
  tokenAddress: string;
  fallback?: string;
  className?: string;
}

const TokenLogo: React.FC<TokenLogoProps> = ({
  tokenAddress,
  fallback = "/default.png", // Change fallback path to "/default.png"
  className,
}) => {
  const { tokenList, loading, error } = useUniswapTokenList();

  if (loading) return <div className={className}>Loading...</div>;
  if (error) return <img src={fallback} alt="fallback" className={className} />;

  // Compare addresses case-insensitively.
  const token = tokenList.find(
    (t) => t.address.toLowerCase() === tokenAddress.toLowerCase()
  );

  return (
    <img
      src={token ? token.logoURI : fallback}
      alt={token ? token.symbol : "fallback"}
      className={className}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = fallback;
      }}
    />
  );
};

export default TokenLogo;
