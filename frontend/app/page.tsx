"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  ShieldCheck, 
  GitGraph, 
  Terminal, 
  Database, 
  Cpu, 
  CheckCircle2
} from 'lucide-react';

export default function Landing() {
  const [time, setTime] = useState("");

  useEffect(() => {
    setTime(new Date().toISOString().split('T')[1].slice(0, 8));
    const timer = setInterval(() => {
      setTime(new Date().toISOString().split('T')[1].slice(0, 8));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans selection:bg-white selection:text-black">
      <main className="relative z-10 pt-32 pb-20 max-w-[1400px] mx-auto">
        {/* Hero Section - Asymmetric, Data-driven */}
        <div className="px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-end min-h-[60vh]">
          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-wider text-zinc-500">
              <span className="flex items-center gap-2 text-mantle">
                <span className="w-2 h-2 bg-mantle rounded-full animate-pulse" />
                System Online
              </span>
              <span>//</span>
              <span>Mantle Network</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-medium text-white tracking-tighter leading-[1.05]">
              Quant-grade AI<br />
              <span className="text-zinc-500">On-chain verified</span>
            </h1>
            
            <p className="max-w-xl text-lg text-zinc-400 leading-relaxed font-light">
              DeFi anomaly detection infrastructure. The agent finds alpha, performs a cryptographic commit prior to the event, and proves its mathematical accuracy
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/dashboard" className="bg-white text-black px-6 py-3 text-sm font-medium hover:bg-zinc-200 transition-colors flex items-center gap-2">
                Open Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="https://github.com/placeholder/alphaproof-ai" target="_blank" rel="noreferrer" className="border border-white/10 hover:border-white/30 text-white px-6 py-3 text-sm font-medium transition-colors flex items-center gap-2 bg-[#0a0a0a]">
                <Terminal className="w-4 h-4" /> View Contracts
              </a>
            </div>
          </div>

          <div className="lg:col-span-4 border-l border-white/10 pl-6 space-y-6 hidden lg:block">
            <div className="space-y-1">
              <div className="text-[10px] font-mono text-zinc-500">LATEST EPOCH CONFIDENCE</div>
              <div className="text-3xl font-light text-white">94.2%</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-mono text-zinc-500">ANOMALIES DETECTED (24H)</div>
              <div className="text-3xl font-light text-white">1,204</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-mono text-zinc-500">SYSTEM TIME (UTC)</div>
              <div className="text-3xl font-light text-white font-mono">{time || "00:00:00"}</div>
            </div>
          </div>
        </div>

        {/* Technical Ticker */}
        <div className="mt-20 border-y border-white/10 flex overflow-hidden bg-white/[0.02]">
          <div className="flex whitespace-nowrap animate-marquee py-3 text-xs font-mono text-zinc-500">
            <span className="mx-4">TX: 0x8a...4f2a [DETECTED: WHALE_ACCUMULATION]</span> |
            <span className="mx-4">TX: 0x1b...9c33 [DETECTED: LIQUIDITY_DRAIN]</span> |
            <span className="mx-4 text-mantle">EPOCH #42 COMMIT VERIFIED</span> |
            <span className="mx-4">TX: 0x9f...11b8 [DETECTED: FLASH_LOAN_PREP]</span> |
            <span className="mx-4">TX: 0x8a...4f2a [DETECTED: WHALE_ACCUMULATION]</span> |
            <span className="mx-4">TX: 0x1b...9c33 [DETECTED: LIQUIDITY_DRAIN]</span> |
            <span className="mx-4 text-mantle">EPOCH #42 COMMIT VERIFIED</span>
          </div>
        </div>

        {/* Section: Architecture - Bento/Grid Style */}
        <section id="mechanics" className="pt-32 px-6">
          <div className="mb-12">
            <h2 className="text-3xl font-medium tracking-tight text-white mb-4">Architecture</h2>
            <p className="text-zinc-400 max-w-xl">
              Raw blockchain data is transformed into verified profit through three deterministic phases
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 border border-white/10 bg-[#0a0a0a]">
            <div className="p-8 border-b md:border-b-0 md:border-r border-white/10 hover:bg-white/[0.02] transition-colors">
              <Database className="w-5 h-5 text-white mb-8" />
              <div className="text-xs font-mono text-zinc-500 mb-2">PHASE_01</div>
              <h3 className="text-lg font-medium text-white mb-3">Ingestion</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Continuous parsing of the Mantle mempool and transaction graph. The system ingests and structures terabytes of raw on-chain data in real-time
              </p>
            </div>
            
            <div className="p-8 border-b md:border-b-0 md:border-r border-white/10 hover:bg-white/[0.02] transition-colors">
              <Cpu className="w-5 h-5 text-white mb-8" />
              <div className="text-xs font-mono text-zinc-500 mb-2">PHASE_02</div>
              <h3 className="text-lg font-medium text-white mb-3">Detection</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Proprietary ML models filter out market noise. Early detection of exploits, insider accumulation, and hidden liquidity patterns
              </p>
            </div>

            <div className="p-8 hover:bg-white/[0.02] transition-colors">
              <ShieldCheck className="w-5 h-5 text-white mb-8" />
              <div className="text-xs font-mono text-zinc-500 mb-2">PHASE_03</div>
              <h3 className="text-lg font-medium text-white mb-3">On-chain Commit</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                The signal is cryptographically hashed and recorded on a smart contract. We create an irrefutable proof of insight before it realizes on the market
              </p>
            </div>
          </div>
        </section>

        {/* Section: Verification / Terminal UI */}
        <section id="verification" className="pt-32 px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-3xl font-medium tracking-tight text-white mb-6">Trustless Alpha</h2>
              <div className="space-y-6 text-zinc-400 text-sm leading-relaxed">
                <p>
                  The market is filled with black boxes and retrospective analytics. In Web3, trust must be replaced by mathematical proof
                </p>
                <p>
                  AlphaProof AI cannot forge history or delete an unsuccessful forecast. Each agent prediction becomes a transaction on the Mantle network, locking in the timestamp and model confidence
                </p>
                <ul className="space-y-4 pt-4 border-t border-white/10 mt-6">
                  <li className="flex items-center gap-3 text-white">
                    <CheckCircle2 className="w-4 h-4 text-zinc-500" />
                    <span>Zero possibility of data manipulation</span>
                  </li>
                  <li className="flex items-center gap-3 text-white">
                    <CheckCircle2 className="w-4 h-4 text-zinc-500" />
                    <span>Public on-chain agent statistics</span>
                  </li>
                  <li className="flex items-center gap-3 text-white">
                    <CheckCircle2 className="w-4 h-4 text-zinc-500" />
                    <span>Auditable commit smart contracts</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Brutalist Terminal Mockup */}
            <div className="bg-[#050505] border border-zinc-800 p-1 flex flex-col font-mono text-xs">
              <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2 flex justify-between items-center text-zinc-500">
                <span>alphaproof-node-01</span>
                <span className="flex gap-1">
                  <div className="w-2 h-2 bg-zinc-700 rounded-full" />
                  <div className="w-2 h-2 bg-zinc-700 rounded-full" />
                  <div className="w-2 h-2 bg-zinc-700 rounded-full" />
                </span>
              </div>
              <div className="p-4 space-y-2 overflow-hidden h-[300px] text-zinc-400 flex flex-col justify-end">
                <div className="opacity-50">&gt; Indexing block 14205510... OK</div>
                <div className="opacity-50">&gt; Indexing block 14205511... OK</div>
                <div>&gt; WARN: Anomaly detected in pool 0x4A...21f. Severity: HIGH</div>
                <div>&gt; Generating inference matrix...</div>
                <div className="text-white">&gt; SIGNAL: MNT/USDC accumulation pattern</div>
                <div>&gt; Confidence score: 0.942</div>
                <div className="py-2">
                  <div className="text-mantle">✓ Committing to Mantle Network...</div>
                  <div className="text-zinc-500">  Tx: 0x7f9a2b...3a9b1c</div>
                  <div className="text-zinc-500">  Hash: 0x88f219...110a</div>
                </div>
                <div className="animate-pulse">&gt; _</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0a0a0a] mt-32">
        <div className="max-w-[1400px] mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-zinc-600">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-zinc-600" />
            ALPHAPROOF AI © {new Date().getFullYear()}
          </div>
          <div className="flex gap-6">
            <a href="https://github.com/placeholder/alphaproof-ai" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-2">GitHub</a>
            <a href="https://t.me/placeholder" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Telegram</a>
            <a href="#" className="hover:text-white transition-colors">Docs</a>
          </div>
          <div>DEPLOYED ON MANTLE</div>
        </div>
      </footer>
    </div>
  );
}
