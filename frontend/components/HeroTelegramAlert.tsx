export function HeroTelegramAlert({
  signalType,
  pair,
  confidence,
  proofHash
}: {
  signalType: string;
  pair: string;
  confidence: string;
  proofHash: string;
}) {
  return (
    <div className="absolute bottom-10 left-0 w-full max-w-[300px] rounded-[18px] border border-white/10 bg-[#111716]/95 p-5 shadow-2xl shadow-black/50 backdrop-blur-md lg:bottom-auto lg:left-[300px] lg:right-0 lg:top-[510px]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-white">Telegram alert</h3>
      </div>
      <div className="rounded-[12px] border border-white/10 bg-white/[0.04] p-4 text-sm text-zinc-300">
        <p className="font-bold">AlphaProof Signal</p>
        <p className="mt-5 text-zinc-400">{signalType}</p>
        <p>Pair: <span className="font-bold text-white">{pair}</span></p>
        <p>Confidence: <span className="font-bold text-white">{confidence}</span></p>
        <p className="mt-5 font-mono">Proof: {proofHash}</p>
      </div>
    </div>
  );
}
