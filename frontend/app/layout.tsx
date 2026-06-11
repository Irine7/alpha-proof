import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "AlphaProof AI",
  description: "Verifiable AI signal agent for Mantle Network."
};

const nav = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/agent", label: "Reputation" }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans selection:bg-white selection:text-black">
        {/* Structural Background Grid - Web3/Technical Vibe */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        </div>

        {/* Navbar - Strict & Minimal */}
        <nav className="fixed w-full z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/10">
          <div className="flex justify-between items-center px-6 py-4 max-w-[1400px] mx-auto">
            <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
              <div className="w-2 h-2 bg-white" />
              <span className="text-white font-medium tracking-tight">ALPHAPROOF<span className="text-zinc-600">.AI</span></span>
            </Link>
            <div className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-white transition-colors">
                  {item.label}
                </Link>
              ))}
            </div>
            <Link href="/dashboard" className="hidden text-xs font-mono uppercase bg-white text-black px-4 py-2 hover:bg-zinc-200 transition-colors sm:inline-block">
              Run Proof Demo
            </Link>
          </div>
        </nav>

        <div className="relative z-10 min-h-screen flex flex-col justify-between">
          <div>{children}</div>
        </div>
      </body>
    </html>
  );
}
