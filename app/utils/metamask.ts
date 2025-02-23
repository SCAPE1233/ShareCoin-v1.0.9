// 1️⃣ MetaMask Connection Module (app/utils/metamask.ts)
import Web3 from "web3";
import { Dispatch, SetStateAction } from "react";

export const connectMetaMask = async (
    setAccount: Dispatch<SetStateAction<string | null>>,
    setWeb3: Dispatch<SetStateAction<Web3 | null>>,
    setContract: Dispatch<SetStateAction<any>>, // Web3 Contract Type
    CONTRACT_ABI: any,
    CONTRACT_ADDRESS: string
) => {
    if (typeof window !== "undefined" && window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        try {
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            setAccount(accounts[0]);
            setWeb3(web3Instance);
            setContract(new web3Instance.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS));
        } catch (error) {
            console.error("🚨 MetaMask connection error:", error);
        }
    } else {
        console.error("❌ MetaMask not installed!");
    }
};
