// app/layout.tsx
import "./globals.css";
import Navbar from "./components/Navbar";
import { Web3Provider } from "./context/Web3Context";

export const metadata = {
  title: "ShareCoin Cloud Mining on PulseChain",
  viewport: {
    width: "device-width",
    initialScale: 1.0,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-black text-white">
      <body className="min-h-screen">
        <Web3Provider>
          <Navbar />
          <main className="p-4">{children}</main>
        </Web3Provider>
      </body>
    </html>
  );
}
