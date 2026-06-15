import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { TelegramNavControl } from "../components/TelegramNavControl";
import "./globals.css";

export const metadata: Metadata = {
  title: "AlphaProof",
  description: "Verifiable AI signal agent for Mantle Network."
};

const nav = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/reputation", label: "Reputation" },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans selection:bg-white selection:text-black">
        {/* Structural Background Grid - Web3/Technical Vibe */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        </div>

        {/* Navbar - Strict & Minimal */}
        <nav className="fixed w-full z-50 bg-[#020403]/92 backdrop-blur-md border-b border-white/10">
          <div className="flex h-24 items-center justify-between px-6 md:px-[58px]">
            <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <span className="grid h-9 w-9 place-items-center overflow-hidden drop-shadow-[0_0_18px_rgba(0,224,164,0.55)]">
                <Image src="/assets/l.png" alt="" width={54} height={54} priority className="h-9 w-9 object-contain" />
              </span>
              <span className="text-white font-bold tracking-tight">ALPHAPROOF<span className="text-zinc-500">.AI</span></span>
            </Link>
            <div className="hidden items-center gap-9 text-sm text-zinc-400 md:flex">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-white transition-colors">
                  {item.label}
                </Link>
              ))}
            </div>
            <TelegramNavControl />
          </div>
        </nav>

        <div className="relative z-10 min-h-screen flex flex-col justify-between">
          <div>{children}</div>
        </div>
      </body>
    </html>
  );
}
