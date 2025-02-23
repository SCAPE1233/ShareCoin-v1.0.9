// 6️⃣ Swap Components (app/components/SwapComponent.tsx)
import React from "react";

interface SwapComponentProps {
    selectedToken: string;
    setSelectedToken: (token: string) => void;
    availableTokens: string[];
    tokenLogos: Record<string, string>;
}

export default function SwapComponent({ selectedToken, setSelectedToken, availableTokens, tokenLogos }: SwapComponentProps) {
    return (
        <div className="relative mt-4">
            <button className="w-full p-4 bg-gray-900 text-white rounded-lg flex justify-between items-center">
                <img src={tokenLogos[selectedToken] || ""} alt={selectedToken} className="w-6 h-6 mr-2" />
                {selectedToken} ▼
            </button>
        </div>
    );
}
