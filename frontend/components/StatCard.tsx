export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="bg-[#0a0a0a] p-8 hover:bg-white/[0.02] transition-colors flex flex-col justify-between min-h-[140px]">
      <div>
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-light text-white font-mono mt-4">{value}</p>
      </div>
      {hint ? <p className="text-[9px] font-mono text-zinc-600 mt-2 tracking-wide uppercase">{hint}</p> : null}
    </div>
  );
}
