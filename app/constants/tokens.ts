// app/constants/tokens.ts
export interface Token {
    symbol: string;
    address: string;
    decimals: number;
    logo: string; // Local path in your public folder
    price?: number; // optional, updated by polling
  }
  
  export const defaultTokens: Token[] = [
    //{
      //symbol: "WPLS",
      //address: "0xA1077a294dDE1B09bB078844df40758a5D0f9a27",
     // decimals: 18,
     // logo: "/tokens/pls.png",  // stored locally in public/tokens/pls.png
    //},
    {
      symbol: "HEX",
      address: "0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39",
      decimals: 18,
      logo: "/tokens/hex.png",
    },
    {
      symbol: "DAI",
      address: "0xefD766cCb38EaF1dfd701853BFCe31359239f305",
      decimals: 18,
      logo: "/tokens/dai.png",
    },
    {
      symbol: "WETH",
      address: "0x02DcdD04e3F455D838cd1249292C58f3B79e3C3C",
      decimals: 18,
      logo: "/tokens/weth.png",
    },
    {
      symbol: "INC",
      address: "0x2fa878Ab3F87CC1C9737Fc071108F904c0B0C95d",
      decimals: 18,
      logo: "/tokens/inc.png",
    },
    {
      symbol: "USDC",
      address: "0x15D38573d2feeb82e7ad5187ab8c1d52810b1f07",
      decimals: 18,
      logo: "/tokens/usdc.png",
    },
    {
      symbol: "Share",
      address: "0x03EA2507C5cAF3E75B7D417b5ACfE6dfA0beBAa1", // Replace with your actual address
      decimals: 18,
      logo: "/tokens/Share.png",
    },
  ];
  