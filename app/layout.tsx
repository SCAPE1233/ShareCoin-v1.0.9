import "./globals.css";
import Navbar from "./components/Navbar";
import { Web3Provider } from "./context/Web3Context"; // ✅ Ensure Web3Provider wraps everything

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className="bg-black text-white">
                <Web3Provider>
                    <Navbar /> {/* ✅ Navbar will be displayed globally */}
                    {children}
                </Web3Provider>
            </body>
        </html>
    );
}
