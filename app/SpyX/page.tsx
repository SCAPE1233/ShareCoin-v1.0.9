"use client";

import Link from "next/link";

export default function HomePage() {
    return (
        <div className="h-screen flex flex-col items-center justify-center bg-black text-white">
            <h1 className="text-5xl font-bold mb-6">🚀 SpyX Dapp</h1>
            <nav className="mt-6 flex space-x-6">
                <Link href="/trade" className="text-xl text-blue-500">Trade</Link>
                <Link href="/stake" className="text-xl text-blue-500">Stake</Link>
                <Link href="/accounts" className="text-xl text-blue-500">Account</Link>
            </nav>
        </div>
    );
}
